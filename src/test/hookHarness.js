import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

export function mountHook(useHook) {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current;
  function Harness() { current = useHook(); return null; }
  act(() => root.render(<Harness />));
  return {
    get current() { return current; },
    unmount() { act(() => root.unmount()); container.remove(); }
  };
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

export async function flush() {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
}
