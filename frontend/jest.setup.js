import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// https://github.com/jsdom/jsdom/issues/2177#issuecomment-376139329
// "There's not much you can do here.....  The long-term fix is for us to get a better CSS parser, but that's quite difficult."
const originalConsoleError = console.error;
console.error = function (...data) {
  if (
    typeof data[0]?.toString === "function" &&
    data[0].toString().includes("Error: Could not parse CSS stylesheet")
  ) {
    return;
  }

  originalConsoleError(...data);
};

class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe(target) {
    this.callback([{ target }], this);
  }

  unobserve() {}

  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

class DOMMatrixReadOnly {
  constructor(transform) {
    const scale = transform?.match(/scale\(([1-9.]+)\)/)?.[1];
    this.m22 = scale !== undefined ? +scale : 1;
  }
}

// Only run the shim once when requested
let init = false;

export const mockReactFlow = () => {
  if (init) return;
  init = true;

  global.DOMMatrixReadOnly = DOMMatrixReadOnly;

  Object.defineProperties(global.HTMLElement.prototype, {
    offsetHeight: {
      get() {
        return parseFloat(this.style.height) || 1;
      },
    },
    offsetWidth: {
      get() {
        return parseFloat(this.style.width) || 1;
      },
    },
  });

  global.SVGElement.prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
};
