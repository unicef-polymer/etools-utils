import {Callback} from './types/global.types';

export const debounce = (fn: Callback, time: number): Callback => {
  let timeout: any;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), time);
  };
};
