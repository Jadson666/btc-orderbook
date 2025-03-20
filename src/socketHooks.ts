import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getTotalSizeAndPercent, SizeAndPercent } from './utils';

const SOCKET_URL = 'http://localhost:3000';

export const usePriceSocket = () => {
  const [curPrice, setCurPrice] = useState(null); 
  const lastPrice = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'] 
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('newPrice', (data) => {
      try {
        setCurPrice(prev => {
          lastPrice.current = prev;
          return data.price
        })
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return [lastPrice.current, curPrice];
};


export interface IQuote {
  price: string;
  size: string;
}
export interface OrderBookData {
  bids: IQuote[];
  asks: IQuote[];
}

export const useOrderBookSocket = () => {
  const [buyOrders, setBuyOrders] = useState<SizeAndPercent>({ totalSize: 0, data: [] });
  const [sellOrders, setSellOrders] = useState<SizeAndPercent>({ totalSize: 0, data: [] });
  const sellMap = useRef(new Map<string, string>());
  const buyMap = useRef(new Map<string, string>());

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'] 
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('orderbook', (data: OrderBookData) => {
      try {
        const orderAllData = getTotalSizeAndPercent(data, sellMap.current, buyMap.current)
        setSellOrders(orderAllData.bids)
        setBuyOrders(orderAllData.asks)
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return [buyOrders, sellOrders];
}
