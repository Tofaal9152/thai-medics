import { useMemo, useEffect, useRef } from "react";
import debounce from "debounce";

export function useDebouncedCallback<TArgs extends Array<unknown>>(
  callback: (...args: TArgs) => void,
  delay = 500
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      debounce((...args: TArgs) => {
        callbackRef.current(...args);
      }, delay),
    [delay]
  );

  useEffect(() => {
    return () => debouncedFn.clear();
  }, [debouncedFn]);

  return debouncedFn;
}
