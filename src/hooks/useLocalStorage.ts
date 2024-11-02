import { useState } from 'react';

export default function useLocalStorage<Value>(key: string, initialValue: Value) {
  const [state, setState] = useState(() => {
    // Initialize the state
    try {
      const value = window.localStorage.getItem(key);
      // Check if the local storage already has any values,
      // otherwise initialize it with the passed initialValue
      return value ? JSON.parse(value) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: Value | ((prev: Value) => Value)) => {
    const valueToStore = value instanceof Function ? value(state) : value;
    try {
      // If the passed value is a callback function,
      //  then call it with the existing state.
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } finally {
      setState(valueToStore);
    }
  };

  return [state, setValue];
}
