import {GenericObject} from './types/global.types';

export const fireEvent = (el: any, eventName: string, eventDetail?: GenericObject | string | number) => {
  if (typeof el.dispatchEvent !== 'function') {
    throw new Error('fireEvent: cannot dispatch event, "el" param has no dispatchEvent method');
  }
  el.dispatchEvent(
    new CustomEvent(eventName, {
      detail: eventDetail,
      bubbles: true,
      composed: true
    })
  );
};
