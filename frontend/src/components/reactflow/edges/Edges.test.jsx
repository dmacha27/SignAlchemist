import { render, screen, fireEvent } from "../../../test-utils";
import ButtonEdge from "./ButtonEdge";
import HandleLimit from "./HandleLimit";
import { ReactFlowProvider } from "@xyflow/react";

const mockSetEdges = jest.fn();
const mockUseReactFlow = jest.fn(() => ({
  setEdges: mockSetEdges,
}));
const mockUseNodeConnections = jest.fn(() => []);

jest.mock("@xyflow/react", () => ({
  ...jest.requireActual("@xyflow/react"),
  useReactFlow: () => mockUseReactFlow(),
  useNodeConnections: () => mockUseNodeConnections(),
  EdgeLabelRenderer: ({ children }) => <>{children}</>, // Forcing edge to appear as if two nodes were connected
}));

describe("ButtonEdge", () => {
  beforeEach(() => {
    mockSetEdges.mockReset();
    mockUseReactFlow.mockImplementation(() => ({
      setEdges: mockSetEdges,
    }));
  });

  it("renders the BaseEdge correctly", () => {
    render(
      <ReactFlowProvider>
        <ButtonEdge
          id="e1-2"
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
  });

  it("calls setEdges when clicking delete label", () => {
    render(
      <ReactFlowProvider>
        <ButtonEdge
          id="e1-2"
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
