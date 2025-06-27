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

const mockUseNodeConnections = jest.fn();
const mockUseNodesData = jest.fn();

jest.mock("@xyflow/react", () => {
  const actual = jest.requireActual("@xyflow/react");
  return {
    ...actual,
    useNodeConnections: () => mockUseNodeConnections(),
    Handle: () => <div data-testid="mock-handle" />,
    useNodesData: () => mockUseNodesData(),
  };
});

import { render, screen } from "../../../test-utils";
import OutputSignal from "./OutputSignal";

const mockSetChartDataProcessed = jest.fn();

describe("OutputSignal", () => {
  beforeEach(() => {
    mockUseNodeConnections.mockReset();
  });
  it("renders the headers and rows when source populated", async () => {
    mockUseNodeConnections.mockReturnValue([{ source: "0", target: "1" }]);
    mockUseNodesData.mockReturnValue({ data: { table: mockEDA } });
    render(
      <OutputSignal
        id="1"
        data={{ setChartDataProcessed: mockSetChartDataProcessed }}
      />
    );

    expect(screen.getByText("Processed Signal")).toBeInTheDocument();

    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("Gsr")).toBeInTheDocument();

    expect(screen.getByText("0.0000")).toBeInTheDocument();
    expect(screen.getByText("1.1000")).toBeInTheDocument();
  });

  it("waits for table", async () => {
    mockUseNodeConnections.mockReturnValue([]);
    mockUseNodesData.mockReturnValue({});
    render(
      <OutputSignal
        id="1"
        data={{ setChartDataProcessed: mockSetChartDataProcessed }}
      />
    );

    expect(
      screen.getByText(/Waiting for processed signal/i)
    ).toBeInTheDocument();

  });
});
