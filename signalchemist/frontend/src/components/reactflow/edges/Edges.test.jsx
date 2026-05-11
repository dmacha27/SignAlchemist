import { render, screen, fireEvent } from "../../../test-utils";
import ButtonEdge from "./ButtonEdge";
import HandleLimit from "./HandleLimit";
import { ReactFlowProvider } from "@xyflow/react";

const mockSetEdges = jest.fn();
const mockUseReactFlow = jest.fn(() => ({
  setEdges: mockSetEdges,
}));
const mockUseNodeConnections = jest.fn(() => []);
const mockUseNodesData = jest.fn(() => ({ data: { executionState: "idle" } }));

jest.mock("@xyflow/react", () => ({
  ...jest.requireActual("@xyflow/react"),
  useReactFlow: () => mockUseReactFlow(),
  useNodeConnections: () => mockUseNodeConnections(),
  useNodesData: (id) => mockUseNodesData(id),
  EdgeLabelRenderer: ({ children }) => <>{children}</>, // Forcing edge to appear as if two nodes were connected
}));

describe("ButtonEdge", () => {
  beforeEach(() => {
    mockSetEdges.mockReset();
    mockUseReactFlow.mockImplementation(() => ({
      setEdges: mockSetEdges,
    }));
    mockUseNodesData.mockReset();
    mockUseNodesData.mockReturnValue({ data: { executionState: "idle" } });
  });

  it("renders the BaseEdge correctly", () => {
    render(
      <ReactFlowProvider>
        <ButtonEdge
          id="e1-2"
          source="1"
          target="2"
          sourceX={0}
          sourceY={0}
          targetX={100}
          targetY={100}
          sourcePosition="right"
          targetPosition="left"
        />
      </ReactFlowProvider>
    );
    expect(screen.getByTestId("BaseEdge")).toBeInTheDocument();
    expect(screen.getByTestId("FaTrash")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /insert node/i })).toBeInTheDocument();
  });

  it("calls setEdges when clicking delete label", () => {
    render(
      <ReactFlowProvider>
        <ButtonEdge
          id="e1-2"
          source="1"
          target="2"
          sourceX={0}
          sourceY={0}
          targetX={100}
          targetY={100}
          sourcePosition="right"
          targetPosition="left"
        />
      </ReactFlowProvider>
    );

    const button = screen.getByTestId("FaTrash").parentElement;
    fireEvent.click(button);

    expect(mockSetEdges).toHaveBeenCalled();

    const filter = mockSetEdges.mock.calls[0][0];

    const initialEdges = [
      { id: "e1-2", label: "delete" },
      { id: "e3-4", label: "keep" },
    ];

    const filtered = filter(initialEdges);

    expect(filtered).toEqual([{ id: "e3-4", label: "keep" }]);
  });

  it("dispatches insert event from edge menu", () => {
    const listener = jest.fn();
    window.addEventListener("insert-node-on-edge", listener);

    render(
      <ReactFlowProvider>
        <ButtonEdge
          id="e1-2"
          source="1"
          target="2"
          sourceX={0}
          sourceY={0}
          targetX={100}
          targetY={100}
          sourcePosition="right"
          targetPosition="left"
        />
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /insert node/i }));
    fireEvent.click(screen.getByRole("button", { name: /insert filtering node/i }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({
      edgeId: "e1-2",
      sourceId: "1",
      targetId: "2",
      nodeType: "FilteringNode",
    });

    window.removeEventListener("insert-node-on-edge", listener);
  });

  it("dispatches insert event for peaks node", () => {
    const listener = jest.fn();
    window.addEventListener("insert-node-on-edge", listener);

    render(
      <ReactFlowProvider>
        <ButtonEdge
          id="e1-2"
          source="1"
          target="2"
          sourceX={0}
          sourceY={0}
          targetX={100}
          targetY={100}
          sourcePosition="right"
          targetPosition="left"
        />
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /insert node/i }));
    fireEvent.click(screen.getByRole("button", { name: /insert peaks node/i }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({
      edgeId: "e1-2",
      sourceId: "1",
      targetId: "2",
      nodeType: "PeaksNode",
    });

    window.removeEventListener("insert-node-on-edge", listener);
  });
});

describe("HandleLimit", () => {
  beforeEach(() => {
    mockUseNodeConnections.mockReset();
  });

  it("allows connection if the limit is not reached", () => {
    mockUseNodeConnections.mockReturnValue([]);
    render(
      <ReactFlowProvider>
        <HandleLimit
          type="source"
          connectionCount={2}
        />
      </ReactFlowProvider>
    );

    const handle = screen.getByTestId("Handle");
    expect(handle).toHaveClass("connectable");
  });

  it("blocks connection if the limit is reached", () => {
    mockUseNodeConnections.mockReturnValue([{ id: "c1" }, { id: "c2" }]);
    render(
      <ReactFlowProvider>
        <HandleLimit
          type="source"
          connectionCount={2}
        />
      </ReactFlowProvider>
    );

    const handle = screen.getByTestId("Handle");
    expect(handle).not.toHaveClass("connectable");
  });
});
