import Icon from './Components/icon';
import { Panel } from './Components/Panel';
import { useOrderBookSocket, usePriceSocket } from './socketHooks';
import { PriceAction } from './types';
import { formatStrPrice } from './utils';
import { getColor } from './utils/color';
import './App.css';

const getIcon = (action: PriceAction) => {
  switch (action) {
    case PriceAction.UP:
      return <Icon color='#00b15d' className='r180deg' />;
    case PriceAction.DOWN:
      return <Icon color='#FF5B5A' />;
    case PriceAction.SAME:
    default:
      return null;
  }
};

const getChangeDirection = (lastPrice: number, curPrice: number) => {
  if (lastPrice < curPrice) return PriceAction.UP;
  if (lastPrice > curPrice) return PriceAction.DOWN;
  return PriceAction.SAME;
};

function App() {
  const [lastPrice, curPrice] = usePriceSocket();
  const [buyOrders, sellOrders] = useOrderBookSocket();
  const action = getChangeDirection(lastPrice ?? 0, curPrice ?? 0);

  return (
    <>
      <div className='orderbook-header'>Order Book (BTC/PFC)</div>
      <div className='divider'></div>
      <Panel orders={sellOrders} />
      <div className='price-container' style={{ backgroundColor: action ? getColor(action).bgColor : 'transparent' }}>
        {curPrice ? formatStrPrice(String(curPrice)) : ''}
        {getIcon(action)}
      </div>
      <Panel type={PriceAction.BUY} orders={buyOrders} />
    </>
  );
}

export default App;
