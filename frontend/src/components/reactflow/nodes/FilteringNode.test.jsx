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

const mockEdaFiltered = [
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

import { render, screen, fireEvent, act, waitFor } from "../../../test-utils";
import FilteringNode from "./FilteringNode";
import { ThemeContext } from "../../../contexts/ThemeContext";

const mockSetChartDataProcessed = jest.fn();
const mockDeleteNode = jest.fn();

describe("FilteringNode", () => {
  beforeAll(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes("/api/filtering")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: mockEdaFiltered.slice(1),
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
        <FilteringNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    expect(screen.getByText(/Filtering technique/i)).toBeInTheDocument();
    expect(screen.getByText(/Python code/i)).toBeInTheDocument();
  });

  it("deletes node", async () => {
    mockUseNodeConnections.mockReturnValue([]);
    mockUseNodesData.mockReturnValue({});
    render(
      <ThemeContext.Provider value={mockTheme}>
        <FilteringNode
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
        <FilteringNode
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
        <FilteringNode
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
        <FilteringNode
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
        <FilteringNode
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
      table: mockEdaFiltered, // Filtering result
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
        json: () => Promise.resolve({ error: "Filtering failed" }),
      })
    );

    render(
      <ThemeContext.Provider value={mockTheme}>
        <FilteringNode
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

    expect(consoleErrorSpy).toHaveBeenCalledWith("Filtering failed");

    expect(mockUpdateNodeData).toHaveBeenCalledWith("2", expect.any(Function));

    const prevFn = mockUpdateNodeData.mock.calls[1][1];
    const prev = { table: mockEDA };
    const result = prevFn(prev);
    expect(result).toEqual({
      ...prev,
      table: mockEDA, // Filtering failed
    });

    consoleErrorSpy.mockRestore();
  });

  it("updates filter and fields when filter changes", async () => {
    mockUseNodeConnections.mockReturnValue([]);

    render(
      <ThemeContext.Provider value={mockTheme}>
        <FilteringNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    await fireEvent.click(screen.getByTestId("Select filter"));

    await fireEvent.click((await screen.findByText(/Fir/i)).parentElement);
    expect(screen.getByTestId("Select filter")).toHaveValue("Fir");

    await waitFor(() => {
      // Fir does not have order parameter
      expect(screen.queryByLabelText(/Order/i)).not.toBeInTheDocument();
    });
  });

  it("updates the filter field when input changes", async () => {
    mockUseNodeConnections.mockReturnValue([]);
    mockUseNodesData.mockReturnValue({});

    render(
      <ThemeContext.Provider value={mockTheme}>
        <FilteringNode
          id="2"
          data={{
            samplingRate: 1,
            setChartDataProcessed: mockSetChartDataProcessed,
            deleteNode: mockDeleteNode,
          }}
        />
      </ThemeContext.Provider>
    );

    const orderInput = screen.getByPlaceholderText("Enter order");

    fireEvent.change(orderInput, { target: { value: "4" } });

    expect(orderInput.value).toBe("4");
  });
});
