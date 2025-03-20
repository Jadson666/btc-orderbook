import { PriceAction } from '../types';
import { formatStrPrice, QuoteDataType, SizeAndPercent, SizeChangeState } from '../utils';
import { getColor } from '../utils/color';

const Row = ({
  type,
  price,
  size,
  accPercent,
  accSize,
  state
}: QuoteDataType & { type: PriceAction.BUY | PriceAction.SELL; totalSize: number; state: SizeChangeState }) => {
  const { textColor = '', bgColor } = getColor(type);
  const stateBgColor = getColor(state).bgColor ?? '';
  const percentage = ~~((1 - accPercent) * 100);
  const rowHighlightClass = state === SizeChangeState.NEW ? `highlight-row-${type}` : '';
  return (
    <div className={`${rowHighlightClass} row-grid`}>
      <div className="price-cell" style={{ color: textColor }}>{formatStrPrice(String(price))}</div>
      <div className="size-cell" style={{ transition: 'background-color 0.5s', backgroundColor: stateBgColor }}>{formatStrPrice(String(size))}</div>
      <div className="acc-size-cell" style={{ background: `linear-gradient(to right, transparent ${percentage}%, ${bgColor} ${percentage}%)` }}>
        {formatStrPrice(String(accSize))}
      </div>
    </div>
  );
};

export const Panel = ({
  type = PriceAction.SELL,
  orders
}: {
  type?: PriceAction.BUY | PriceAction.SELL;
  orders: SizeAndPercent;
}) => {
  return (
    <div className='panel-grid'>
      {type === PriceAction.SELL && (
        <div className='row-grid'>
          <div className='quote-header price-cell'>Price (USD)</div>
          <div className='quote-header'>Size</div>
          <div className='quote-header acc-size-cell'>Total</div>
        </div>
      )}

      {orders.data.map(({ price, size, accPercent, accSize, state }) => (
        <Row
          key={price}
          type={type}
          price={price}
          size={size}
          totalSize={orders.totalSize}
          accPercent={accPercent}
          accSize={accSize}
          state={state}
        />
      ))}
    </div>
  );
};
