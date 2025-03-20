import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import webSocket from 'ws';

const app = express();
const server = http.createServer(app);
const priceSocketUrl = 'wss://ws.btse.com/ws/futures';
const priceTopic = 'tradeHistoryApi:BTCPFC';
const expressServer = server.listen(3000, () => {
  console.log('listening on *:3000');
});

const io = new Server(expressServer, { cors: { origin: '*' } });
let lastPrice = null

io.on('connection', (socket) => {
  io.emit('newPrice', { price: lastPrice });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const reconnectInterval = 3000;
let priceClient, obClient;

const connectLastPrice = () => {
  priceClient = new webSocket(priceSocketUrl);

  function subscribe() {
    if (priceClient.readyState === priceClient.OPEN) {
      const pricePayload = {
        op: 'subscribe',
        args: [priceTopic]
      };
      priceClient.send(JSON.stringify(pricePayload));
    }
  }

  function reconnect() {
    reset();
    setTimeout(connectLastPrice, reconnectInterval);
  }

  priceClient.onerror = () => {
    console.log('connection error');
  };

  priceClient.onopen = () => {
    subscribe();
  };

  priceClient.onclose = () => {
    console.log('echo-protocol client closed');
    reconnect();
  };

  priceClient.onmessage = (e) => {
    const raw = JSON.parse(e.data);
    const topic = raw && raw.topic ? raw.topic : '';
    const data = raw.data;
    if (typeof e.data === 'string') {
      if (data) {
        lastPrice = data[0].price;
        io.emit('newPrice', { price: data[0].price });
      }
    }
  };
};

let deltaOrders = {};
const ROW_LIMIT = 8;
const obSocketUrl = 'wss://ws.btse.com/ws/oss/futures';
const obTopic = 'update:BTCPFC';
let lastTimestamp = 0;
let deltaSeqNum = 0;

const connectOrderBook = () => {
  obClient = new webSocket(obSocketUrl);

  function subscribe() {
    if (obClient.readyState === obClient.OPEN) {
      const payload = {
        op: 'subscribe',
        args: [obTopic],
      };
      obClient.send(JSON.stringify(payload));
    }
  }

  function unsubscribe() {
    if (obClient.readyState === obClient.OPEN) {
      const payload = {
        op: 'unsubscribe',
        args: [obTopic],
      };
      obClient.send(JSON.stringify(payload));
    }
  }

  function reset() {
    deltaOrders = {};
    lastTimestamp = 0;
    deltaSeqNum = 0;
  }

  function reconnect() {
    reset();
    setTimeout(connect, reconnectInterval);
  }

  function resubscribe() {
    reset();
    unsubscribe();
    subscribe();
  }

  obClient.onerror = () => {
    console.log('connection error');
  };

  obClient.onopen = () => {
    subscribe();
  };

  obClient.onclose = () => {
    console.log('echo-protocol client closed');
    reconnect();
  };

  obClient.onmessage = (e) => {
    const prepareOrderbookFunc = (map, obj) => {
      if (map && obj && obj.length === 2) {
        const val = obj[1];
        if (val === '0') { // delete entry if SIZE is 0
          delete map[obj[0]];
        } else { // add or replace the entry on non-zero sizes
          map[obj[0]] = val;
        }
      }
      return map;
    };

    const getOrderbook = (data, n) => {
      const askKeys = Object.keys(data.asks).sort().slice(0, n).reverse();
      const bidKeys = Object.keys(data.bids).sort().reverse().slice(0, n);

      // validate cross orderbook
      const bestAsk = askKeys[askKeys.length - 1];
      const bestBid = bidKeys[0];
      if (bestBid >= bestAsk) {
        console.log('ERROR: cross orderbook! Should re-subscribe!');
        resubscribe();
      }

      const asks = askKeys.map((k) => ({ price: k, size: data.asks[k] }));
      const bids = bidKeys.map((k) => ({ price: k, size: data.bids[k] }));
      return { asks, bids }
    };

    if (typeof e.data === 'string') {
      const now = Date.now();
      if (!lastTimestamp) {
        lastTimestamp = now;
      }
      const raw = JSON.parse(e.data);
      const topic = raw && raw.topic ? raw.topic : '';
      const data = raw.data;

      if (topic.startsWith('update')) {
        if (deltaSeqNum && deltaSeqNum !== data.prevSeqNum) {
          console.log(
            `ERROR: seq number not matched! (local: ${deltaSeqNum}, prev: ${data.prevSeqNum}, current: ${data.seqNum})`
          );
          resubscribe();
        }

        deltaSeqNum = data.seqNum;
        const asks = deltaOrders.asks || {};
        const bids = deltaOrders.bids || {};
        deltaOrders.asks = raw.data.asks.reduce(prepareOrderbookFunc, asks);
        deltaOrders.bids = raw.data.bids.reduce(prepareOrderbookFunc, bids);

        if (deltaOrders && deltaOrders.asks && deltaOrders.bids) {
          const topOrder = getOrderbook(deltaOrders, ROW_LIMIT);
          io.emit('orderbook', topOrder);
        }
      } else {
        return;
      }
    }
  };
};

connectLastPrice();
connectOrderBook();
