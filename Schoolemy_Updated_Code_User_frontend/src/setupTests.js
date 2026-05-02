// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router v7 expects Web APIs in the Jest environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// In-memory localStorage/sessionStorage (supports real get/set semantics for tests)
const createStorageMock = () => {
  let store = Object.create(null);
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = Object.create(null);
    },
  };
};

const localStorageImpl = createStorageMock();
const sessionStorageImpl = createStorageMock();

global.localStorage = localStorageImpl;
global.sessionStorage = sessionStorageImpl;

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: localStorageImpl,
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    writable: true,
    value: sessionStorageImpl,
  });
}

function resetMatchMedia(matches = false) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

resetMatchMedia(false);

// Per-test reset: avoid jest.clearAllMocks() here — it can strip mock implementations
// created in jest.mock factories (e.g. auth service) and break suites that rely on them.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetMatchMedia(false);
});
