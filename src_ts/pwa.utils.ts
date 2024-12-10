import {Store, Unsubscribe, StoreEnhancer, ReducersMapObject} from 'redux';
import {Constructor, CustomElement} from './types/types';

export interface LazyStore {
  addReducers: (newReducers: ReducersMapObject) => void;
}

export const connect =
  <S>(store: Store<S>) =>
  <T extends Constructor<CustomElement>>(baseElement: T) =>
    class extends baseElement {
      _storeUnsubscribe!: Unsubscribe;

      connectedCallback() {
        if (super.connectedCallback) {
          super.connectedCallback();
        }

        this._storeUnsubscribe = store.subscribe(() => this.stateChanged(store.getState()));
        this.stateChanged(store.getState());
      }

      disconnectedCallback() {
        this._storeUnsubscribe();

        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
      }

      /**
       * The `stateChanged(state)` method will be called when the state is updated.
       */
      stateChanged(_state: S) {
        // TBD
      }
    };

export const lazyReducerEnhancer = (combineReducers: typeof import('redux').combineReducers) => {
  const enhancer: StoreEnhancer<LazyStore> = (nextCreator) => {
    return (origReducer, preloadedState) => {
      let lazyReducers = {};
      const nextStore = nextCreator(origReducer, preloadedState);
      return {
        ...nextStore,
        addReducers(newReducers) {
          const combinedReducerMap: ReducersMapObject = {
            ...lazyReducers,
            ...newReducers
          };

          this.replaceReducer(combineReducers((lazyReducers = combinedReducerMap)));
        }
      };
    };
  };

  return enhancer;
};

export const installRouter = (locationUpdatedCallback: (location: Location, event: Event | null) => void) => {
  document.body.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;

    const anchor = e.composedPath().filter((n) => (n as HTMLElement).tagName === 'A')[0] as
      | HTMLAnchorElement
      | undefined;
    if (!anchor || anchor.target || anchor.hasAttribute('download') || anchor.getAttribute('rel') === 'external')
      return;

    const href = anchor.href;
    if (!href || href.indexOf('mailto:') !== -1) return;

    const location = window.location;
    const origin = location.origin || location.protocol + '//' + location.host;
    if (href.indexOf(origin) !== 0) return;

    e.preventDefault();
    if (href !== location.href) {
      window.history.pushState({}, '', href);
      locationUpdatedCallback(location, e);
    }
  });

  window.addEventListener('popstate', (e) => locationUpdatedCallback(window.location, e));
  locationUpdatedCallback(window.location, null /* event */);
};

export const installMediaQueryWatcher = (
  mediaQuery: string,
  layoutChangedCallback: (mediaQueryMatches: boolean) => void
) => {
  const mql = window.matchMedia(mediaQuery);
  try {
    // Chrome & Firefox
    mql.addEventListener('change', (e) => layoutChangedCallback(e.matches));
  } catch (e1) {
    console.log(e1);
    try {
      // Safari
      mql.addListener((e) => layoutChangedCallback(e.matches));
    } catch (e2) {
      console.error(e2);
    }
  }
  layoutChangedCallback(mql.matches);
};

export const installOfflineWatcher = (offlineUpdatedCallback: (isOffline: boolean) => void) => {
  window.addEventListener('online', () => offlineUpdatedCallback(false));
  window.addEventListener('offline', () => offlineUpdatedCallback(true));

  offlineUpdatedCallback(navigator.onLine === false);
};
