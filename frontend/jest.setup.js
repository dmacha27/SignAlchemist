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
