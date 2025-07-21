jest.mock("react-dom/client", () => {
  const render = jest.fn();
  return {
    createRoot: jest.fn(() => ({ render })),
  };
});

import { createRoot } from "react-dom/client";

describe("main", () => {
  it("calls createRoot", () => {
    require("./main");

    expect(createRoot).toHaveBeenCalled();
  });
});
