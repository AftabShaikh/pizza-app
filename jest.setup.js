// Jest setup file
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    const { src, alt, width, height, ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return React.createElement('img', {
      src,
      alt,
      width,
      height,
      ...rest
    });
  },
}));

// Import React for JSX
const React = require('react');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch globally
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});