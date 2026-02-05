// Polyfill for react-router v7 which needs TextEncoder/TextDecoder in jsdom
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });

// Polyfill structuredClone for Chakra UI v3 (jsdom doesn't provide it)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(val: T): T => {
    if (val === undefined) return undefined as T;
    if (val === null) return null as T;
    return JSON.parse(JSON.stringify(val));
  };
}

// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
