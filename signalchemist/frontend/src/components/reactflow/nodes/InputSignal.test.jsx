jest.mock("@xyflow/react", () => {
  const actual = jest.requireActual("@xyflow/react");
  return {
    ...actual,
    useNodeConnections: () => [{ source: "0", target: "1" }],
    Handle: () => <div data-testid="mock-handle" />,
  };
});

import { render, screen } from "../../../test-utils";
import InputSignal from "./InputSignal";

const mockEDA = [
  ["Timestamp", "Gsr"],
  [0, 1.1],
  [1, 1.5],
  [2, 2.2],
  [3, 2.5],
  [4, 3.3],
  [5, 3.5],
  [6, 4.4],
];

describe("InputSignal", () => {
  it("renders the headers and rows", () => {
    render(<InputSignal id="0" data={{ table: mockEDA }} />);

    expect(screen.getByText(/Original Signal/i)).toBeInTheDocument();

    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("Gsr")).toBeInTheDocument();

    expect(screen.getByText("0.0000")).toBeInTheDocument();
    expect(screen.getByText("1.1000")).toBeInTheDocument();
  });

  it("handles execute", () => {
    const handler = jest.fn();
    window.addEventListener("execute-node1", handler);

    render(<InputSignal id="0" data={{ table: mockEDA }} />);

    const event = new CustomEvent("start-execute");
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles delete", () => {
    const handler = jest.fn();
    window.addEventListener("delete-source-tables1", handler);

    render(<InputSignal id="0" data={{ table: mockEDA }} />);

    const event = new CustomEvent("delete-source-tables0");
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
