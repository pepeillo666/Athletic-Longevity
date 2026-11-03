// Kleiner Hash-Router-Vermittler, damit Ansichten navigieren können, ohne app.js zu importieren.
let impl = { rerender: () => {} };

export function setRouterImpl(next) {
  impl = next;
}

export function navigate(hash, { replace = false } = {}) {
  const target = hash.startsWith('#') ? hash : `#${hash}`;
  if (location.hash === target) {
    impl.rerender();
    return;
  }
  if (replace) location.replace(target);
  else location.hash = target;
}

export function rerender() {
  impl.rerender();
}
