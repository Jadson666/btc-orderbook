import { SizeChangeState } from '.';
import { PriceAction } from '../types';

export const getColor = (type: PriceAction | SizeChangeState) => {
  switch (type) {
    case PriceAction.UP:
    case PriceAction.BUY:
    case SizeChangeState.UP:
      return {
        textColor: '#00b15d',
        bgColor: 'rgba(16, 186, 104, 0.12)'
      };
    case PriceAction.DOWN:
    case PriceAction.SELL:
    case SizeChangeState.DOWN:
      return {
        textColor: '#FF5B5A',
        bgColor: 'rgba(255, 90, 90, 0.12)'
      };
    case PriceAction.SAME:
    default:
      return {
        textColor: '#F0F4F8',
        bgColor: 'transparent'
      };
  }
};
