import { useSyncExternalStore } from 'react';

type Listener = () => void;

export interface StoreApi<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((prev: T) => Partial<T>)) => void;
  subscribe: (listener: Listener) => () => void;
}

export function create<T>(
  initializer: (
    set: (partial: Partial<T> | ((prev: T) => Partial<T>)) => void,
    get: () => T
  ) => T
) {
  let state: T;
  const listeners = new Set<Listener>();

  const getState = () => state;
  const setState = (partial: Partial<T> | ((prev: T) => Partial<T>)) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };
  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = initializer(setState, getState);

  function useBoundStore<U>(selector: (state: T) => U): U {
    return useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(state)
    );
  }

  useBoundStore.getState = getState;
  useBoundStore.setState = setState;
  useBoundStore.subscribe = subscribe;

  return useBoundStore;
}
