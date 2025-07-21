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

const mockEdaOutliers = [
  ["Timestamp", "Gsr"],
  [0, 55.55],
  [1, 1.5],
  [2, 2.2],
  [3, 2.5],
  [4, 3.3],
  [5, 3.5],
  [6, 4.4],
];

const mockTheme = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

const mockUseNodeConnections = jest.fn();
const mockUseNodesData = jest.fn();
const mockUpdateNodeData = jest.fn();

jest.mock("@xyflow/react", () => {
  const actual = jest.requireActual("@xyflow/react");
  return {
    ...actual,
    useNodeConnections: () => mockUseNodeConnections(),
    Handle: () => <div data-testid="mock-handle" />,
    useNodesData: () => mockUseNodesData(),
    useReactFlow: () => ({
      updateNodeData: mockUpdateNodeData,
    }),
  };
});

import { render, screen, fireEvent, act } from "../../../test-utils";
import OutliersNode from "./OutliersNode";
import { ThemeContext } from "../../../contexts/ThemeContext";

const mockSetChartDataProcessed = jest.fn();
const mockDeleteNode = jest.fn();

describe("OutliersNode", () => {
  beforeAll(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes("/api/outliers")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: mockEdaOutliers.slice(1),
            }),
        });
      }
    });

    window.addEventListener("error", (event) => {
      const message = event?.error?.message || event.message || "";

      if (message.includes("scrollIntoView is not a function")) {
        event.preventDefault(); // Mantine core scrolls when option is selected but it does not work in tests
      }
    });
  });

  beforeEach(() => {
    mockUseNodeConnections.mockReset();
    mockUseNodesData.mockReset();
    mockUpdateNodeData.mockReset();
    mockSetChartDataProcessed.mockReset();
    mockDeleteNode.mockReset();
  });

  it("renders form", async () => {
    mockUseNodeConnections.mockReturnValue([]);
    mockUseNodesData.mockReturnValue({});
    render(
      <ThemeContext.Provider value={mockTheme}>
        <OutliersNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    expect(screen.getByText(/Outlier technique/i)).toBeInTheDocument();
  });

  it("deletes node", async () => {
    mockUseNodeConnections.mockReturnValue([]);
    mockUseNodesData.mockReturnValue({});
    render(
      <ThemeContext.Provider value={mockTheme}>
        <OutliersNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    const deleteButton = screen.getByTestId("delete2");
    fireEvent.click(deleteButton);

    expect(mockDeleteNode).toHaveBeenCalled();
  });

  it("handles see output", async () => {
    mockUseNodeConnections.mockReturnValue([]);
    mockUseNodesData.mockReturnValue({ data: { table: mockEDA } });

    render(
      <ThemeContext.Provider value={mockTheme}>
        <OutliersNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    const outputButton = screen.getByTestId("output2");
    fireEvent.click(outputButton);

    expect(mockSetChartDataProcessed).toHaveBeenCalled();
  });

  it("handles see output error", async () => {
    mockUseNodeConnections.mockReturnValue([]);
    mockUseNodesData.mockReturnValue({});
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    render(
      <ThemeContext.Provider value={mockTheme}>
        <OutliersNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    const outputButton = screen.getByTestId("output2");
    fireEvent.click(outputButton);

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("handles delete table", async () => {
    mockUseNodeConnections.mockReturnValue([
      { source: "0", target: "2" },
      { source: "2", target: "1" },
    ]);

    render(
      <ThemeContext.Provider value={mockTheme}>
        <OutliersNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    const listener = jest.fn();
    window.addEventListener(`delete-source-tables1`, listener);

    const event = new CustomEvent(`delete-source-tables2`);
    window.dispatchEvent(event);

    expect(listener).toHaveBeenCalled();

    expect(mockUpdateNodeData).toHaveBeenCalledWith("2", expect.any(Function));

    const prevFn = mockUpdateNodeData.mock.calls[0][1];
    const prev = { table: mockEDA };
    const result = prevFn(prev);
    expect(result).toEqual({
      ...prev,
      table: null,
    });
  });

  it("handles execute", async () => {
    mockUseNodeConnections.mockReturnValue([
      { source: "0", target: "2" },
      { source: "2", target: "1" },
    ]);

    render(
      <ThemeContext.Provider value={mockTheme}>
        <OutliersNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    const listener = jest.fn();
    window.addEventListener(`execute-node1`, listener);

    await act(async () => {
      const event = new CustomEvent(`execute-node2`, {
        detail: { table: mockEDA },
      });
      window.dispatchEvent(event);
    });

    expect(listener).toHaveBeenCalled();

    expect(mockUpdateNodeData).toHaveBeenCalledWith("2", expect.any(Function));

    const prevFn = mockUpdateNodeData.mock.calls[1][1];
    const prev = { table: mockEDA };
    const result = prevFn(prev);
    expect(result).toEqual({
      ...prev,
      table: mockEdaOutliers, // Outliers result
    });
  });

  it("handles execute with error", async () => {
    mockUseNodeConnections.mockReturnValue([
      { source: "0", target: "2" },
      { source: "2", target: "1" },
    ]);

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Outliers failed" }),
      })
    );

    render(
      <ThemeContext.Provider value={mockTheme}>
        <OutliersNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    await act(async () => {
      const event = new CustomEvent(`execute-node2`, {
        detail: { table: mockEDA },
      });
      window.dispatchEvent(event);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Outliers failed");
  });

  it("updates outlier technique select", async () => {
    mockUseNodeConnections.mockReturnValue([]);

    render(
      <ThemeContext.Provider value={mockTheme}>
        <OutliersNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    await fireEvent.click(screen.getByTestId("Select outlier"));

    await fireEvent.click((await screen.findByText(/IQR/i)).parentElement);
    expect(screen.getByTestId("Select outlier")).toHaveValue("IQR");
  });
});
