import { IQuote, OrderBookData } from '../socketHooks';
import BigNumber from 'bignumber.js';

export const formatStrPrice = (price: string) => {
  const p = new BigNumber(price);
  return p.toFormat({ groupSeparator: ',', groupSize: 3, decimalSeparator: '.' });
};

export enum SizeChangeState {
  NEW = 'new',
  SAME = 'same',
  UP = 'up',
  DOWN = 'down'
}

export type QuoteDataType = IQuote & { accPercent: number; accSize: number, state: SizeChangeState };

export interface SizeAndPercent {
  totalSize: number;
  data: QuoteDataType[];
}

export const getTotalSizeAndPercent = (
  orderbook: OrderBookData,
  sellMap: Map<string, string>,
  buyMap: Map<string, string>
): { bids: SizeAndPercent; asks: SizeAndPercent } => {
  const bidsTotal = orderbook.bids.reduce((acc, cur) => {
    const size = Number(cur.size);
    return acc + size;
  }, 0);

  let bidsAccSize = bidsTotal;
  const finalBids: QuoteDataType[] = [];
  for (let i = 0; i < orderbook.bids.length; i++) {
    const bid: QuoteDataType = { ...orderbook.bids[i], accPercent: 0, accSize: 0, state: SizeChangeState.NEW };
    bid.accPercent = bidsAccSize / bidsTotal;
    bid.accSize = bidsAccSize;
    bidsAccSize -= Number(bid.size);

    // Check if the size has changed
    if (sellMap.has(bid.price)) {
      const prevPrice = sellMap.get(bid.price)
      if (Number(prevPrice) > Number(bid.size)) {
        bid.state = SizeChangeState.DOWN
      } else if (Number(prevPrice) < Number(bid.size)) {
        bid.state = SizeChangeState.UP
      } else {
        bid.state = SizeChangeState.SAME
      }
    }
    sellMap.set(bid.price, bid.size)
    finalBids.push(bid as QuoteDataType);
  }

  const asksTotal = orderbook.asks.reduce((acc, cur) => {
    const size = Number(cur.size);
    return acc + size;
  }, 0);

  let asksAccSize = 0;
  const finalAsks: QuoteDataType[] = [];
  for (let i = 0; i < orderbook.asks.length; i++) {
    const ask: QuoteDataType = { ...orderbook.asks[i], accPercent: 0, accSize: 0, state: SizeChangeState.NEW };
    asksAccSize += Number(ask.size);
    ask.accPercent = asksAccSize / asksTotal;
    ask.accSize = asksAccSize;

    // Check if the size has changed
    if (buyMap.has(ask.price)) {
      const prevPrice = buyMap.get(ask.price)
      if (Number(prevPrice) > Number(ask.size)) {
        ask.state = SizeChangeState.DOWN
      } else if (Number(prevPrice) < Number(ask.size)) {
        ask.state = SizeChangeState.UP
      } else {
        ask.state = SizeChangeState.SAME
      }
    }
    buyMap.set(ask.price, ask.size)
    finalAsks.push(ask as QuoteDataType);
  }

  return {
    bids: {
      totalSize: bidsTotal,
      data: finalBids
    },
    asks: {
      totalSize: asksTotal,
      data: finalAsks
    }
  };
};
