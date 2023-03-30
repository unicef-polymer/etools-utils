import {Store} from 'redux';

let store: Store<any>;
let storePromise: Promise<Store<any>> | null = null;
let storeResolver: ((store: Store<any>) => void) | null = null;

export const setStore = (parentAppReduxStore: Store<any>) => {
  store = parentAppReduxStore;
  if (storeResolver) {
    storeResolver(store);
    storePromise = null;
    storeResolver = null;
  }
};

export const getStore = () => {
  return store;
};

export const getStoreAsync = () => {
  if (store) {
    return Promise.resolve(store);
  }
  if (!storePromise) {
    storePromise = new Promise((resolve) => (storeResolver = resolve));
  }
  return storePromise;
};
