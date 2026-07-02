import { useState, useEffect } from 'react';

/**
 * Hook to debounce any value (e.g. search input string) by a specified delay in milliseconds.
 * Helps prevent redundant backend API queries on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
