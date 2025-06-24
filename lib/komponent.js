// React model improvements:
// 1. Returns cached VNode if props are the same
// 2. Proxies callbacks in a way that the proxy is constant across renders, but what it points to could change.
//    You can use this in useEffect dependencies without worrying about stale closures and re-renders.
// 3. useKState = useState with deep comparison of state
// 4. useKMemo = useMemo with deep comparison of dependency array and return value.
// 5. useKEffect = useEffect with deep comparison of dependency array.
// 6. usePropDiff = Hook to figure out which property that has actually changed from the last render
// 7. useMapMemo = Takes an array, a render function to be called for each item, and a dependencies array.
//    Only if there is a change in array, the render function is called only for the changed values.
//    It will diff the array to minimize the number of render functions called.
//    If a value is same, it re-uses the previous result.
//    If dependency array changes it gets rid of the cache and re-renders the full list.

import { h } from "preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { isEqual } from "./utils.js";

const Nil = Symbol("Nil");

const emptyArray = [];

/** @type {string[]} */
const defaultPropsToNotMemoize = [];

export const memo = (Component, propsToNotMemoize = defaultPropsToNotMemoize) => {
  const wrapper = (props) => {
    const newProps = {};
    // Caches
    const lastRender = useRef(Nil);
    const lastProps = useRef(Nil);
    // Proxies
    const proxyCallbacks = useRef({});

    let hasChanged = false;

    for (const [key, value] of Object.entries(props)) {
      const allowMemoize = !propsToNotMemoize.includes(key);
      if (typeof value === "function" && allowMemoize) {
        if (proxyCallbacks.current[key]?.func !== value) {
          if (!proxyCallbacks.current[key]) {
            proxyCallbacks.current[key] = {
              internalProxy(...args) {
                // use latest func from proxyCallbacks.current[key]
                return proxyCallbacks.current[key]?.func(...args);
              },
              func: null, // initial value
            };
          }
          proxyCallbacks.current[key].func = value;
          proxyCallbacks.current[key].internalProxy.value = value;
        }
        newProps[key] = proxyCallbacks.current[key].internalProxy;
      } else {
        // If a callback prop changes to something not undefined or null, we need to remove the proxy
        if (allowMemoize && proxyCallbacks.current[key]) {
          if (value === undefined || value === null) {
            proxyCallbacks.current[key].func = value;
          } else {
            delete proxyCallbacks.current[key];
          }
        }
        hasChanged =
          hasChanged ||
          (allowMemoize
            ? !isEqual(value, lastProps.current[key])
            : value !== lastProps.current[key]);
        newProps[key] = value;
      }
    }
    if (!hasChanged && lastRender.current !== Nil) {
      return lastRender.current;
    }
    lastProps.current = newProps;
    lastRender.current = h(Component, newProps);
    return lastRender.current;
  };
  // Add a name to the wrapper so that it can be used in error messages
  Object.defineProperty(wrapper, "name", {
    value: `KomponentMemo${Component.name}`,
  });
  return wrapper;
};

/**
 * Like useMemo but both dependencies and state are compared using a
 * deep equality function for deciding when to return cached value.
 * @template T
 * @param {() => T} getState
 * @param {any[]} dependencies
 * @returns {[T, boolean]} [state, hasChanged]
 */
export function useKMemo(getState, dependencies) {
  const state = useRef(/** @type {T} */ (null));
  const lastDependencies = useRef(/** @type {T} */ (null));
  let hasChanged = false;
  if (!dependencies || !isEqual(dependencies, lastDependencies.current)) {
    const newState = getState();
    if (!isEqual(newState, state.current)) {
      lastDependencies.current = dependencies;
      state.current = newState;
      hasChanged = true;
    }
  }
  return [state.current, hasChanged];
}

/**
 * Like useState, but first value of return array is a stable getter function.
 * Calling it always returns the latest value.
 *
 * Second value is a setter function that can be called to update the state.
 *
 * Third value is a boolean that tells you if the state has changed since the last render.
 * @template T
 * @param {T} initialValue
 * @returns {[() => T, (valueOrSetter: T|((value: T) => T)) => void, boolean]} [getValue, setValue, hasChanged]
 */
export function useKState(initialValue) {
  const state = useRef(initialValue);
  const [versionNumber, forceRefresh] = useState(1);

  const getValue = useCallback(() => state.current, []);

  // setter doesn't need to be created on every render
  const setValue = useCallback((valueOrSetter) => {
    const value =
      typeof valueOrSetter === "function" ? valueOrSetter(state.current) : valueOrSetter;
    if (!isEqual(value, state.current)) {
      state.current = value;
      forceRefresh((x) => x + 1);
    }
  }, []);

  let hasChanged = false;
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useMemo(() => {
    hasChanged = true;
  }, [versionNumber]);

  return [getValue, setValue, hasChanged];
}

/**
 * useEffect with deep comparison of dependency array.
 * @param {() => Function|undefined} func
 * @param {any[]} dependencies
 * @returns {void}
 */
export function useKEffect(func, dependencies = emptyArray) {
  const lastDependencies = useRef(dependencies);
  const lastEffectReturnValue = useRef(undefined);
  // we use useEffect for preact to schedule the effect
  // biome-ignore lint/correctness/useExhaustiveDependencies: func is not a dependency until dependencies changes
  useEffect(() => {
    if (isEqual(dependencies, lastDependencies.current)) {
      lastDependencies.current = dependencies;
      lastEffectReturnValue.current?.(); // cleanup
      lastEffectReturnValue.current = func();
    }
  }, dependencies);
}
