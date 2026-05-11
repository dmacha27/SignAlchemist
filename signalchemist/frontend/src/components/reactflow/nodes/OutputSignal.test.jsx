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
import userEvent from "@testing-library/user-event";
import OutputSignal from "./OutputSignal";

const mockSetChartDataProcessed = jest.fn();
const mockScrollToCharts = jest.fn();

describe("OutputSignal", () => {
  beforeEach(() => {
    mockUseNodeConnections.mockReset();
    mockUseNodesData.mockReset();
    mockSetChartDataProcessed.mockReset();
    mockScrollToCharts.mockReset();
  });
  it("renders the headers and rows when source populated", async () => {
    mockUseNodeConnections.mockReturnValue([{ source: "0", target: "1" }]);
    mockUseNodesData.mockReturnValue({ data: { table: mockEDA } });
    render(
      <OutputSignal
        id="1"
        data={{
          setChartDataProcessed: mockSetChartDataProcessed,
          scrollToCharts: mockScrollToCharts,
        }}
      />
    );

    expect(screen.getByText("Processed Signal")).toBeInTheDocument();

    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("Gsr")).toBeInTheDocument();

    expect(screen.getByText("0.0000")).toBeInTheDocument();
    expect(screen.getByText("1.1000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /see/i })).toBeInTheDocument();
  });

  it("waits for table", async () => {
    mockUseNodeConnections.mockReturnValue([]);
    mockUseNodesData.mockReturnValue({});
    render(
      <OutputSignal
        id="1"
        data={{
          setChartDataProcessed: mockSetChartDataProcessed,
          scrollToCharts: mockScrollToCharts,
        }}
      />
    );

    expect(
      screen.getByText(/Waiting for processed signal/i)
    ).toBeInTheDocument();
  });

  it("scrolls to charts when clicking see", async () => {
    const user = userEvent.setup();
    mockUseNodeConnections.mockReturnValue([{ source: "0", target: "1" }]);
    mockUseNodesData.mockReturnValue({ data: { table: mockEDA } });
    render(
      <OutputSignal
        id="1"
        data={{
          setChartDataProcessed: mockSetChartDataProcessed,
          scrollToCharts: mockScrollToCharts,
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /see/i }));

    expect(mockScrollToCharts).toHaveBeenCalledTimes(1);
    expect(mockSetChartDataProcessed).toHaveBeenCalledWith(mockEDA);
  });
});
