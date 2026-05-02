// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Hooks/components read this when the module loads; tests need a defined base URL
process.env.REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Jest/Node may not define Web Crypto on `global` (security.js uses crypto.getRandomValues)
if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto = {
    getRandomValues(arr) {
      for (let i = 0; i < arr.length; i += 1) arr[i] = (i * 17 + 3) % 256;
      return arr;
    },
  };
}

// Security: individual test files mock `../../Utils/security` where needed.
// Real `security.js` is covered in `src/__tests__/utils/security.test.js`.

// Ant Design (Grid / responsiveObserver) expects `window.matchMedia` in JSDOM.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
