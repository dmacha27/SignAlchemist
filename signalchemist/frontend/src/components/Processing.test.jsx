import { render, screen, waitFor, fireEvent, act } from "../test-utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Processing from "./Processing";
import { ThemeContext } from "../contexts/ThemeContext";

jest.mock("./common/SignalTabs", () => () => <div>SignalTabs</div>);

const mockChartRef = {
  config: { options: {} },
  update: jest.fn(),
  data: {},
};

jest.mock("react-chartjs-2", () => {
  const Line = jest.fn(({ data, options, ref }) => {
    mockChartRef.config.options = {
      ...options,
      label: "signal",
    };
    mockChartRef.data = data;
    ref.current = mockChartRef;

    return <div data-testid="mock-line-chart" />;
  });

  return { Line };
});

const mockInstances = { mockChart: mockChartRef };

jest.mock("chart.js", () => {
  return {
    Chart: class {
      static register = jest.fn();
      static get instances() {
        return mockInstances;
      }
    },
  };
});

jest.mock("chartjs-plugin-zoom", () => ({}));
jest.mock("chartjs-adapter-date-fns", () => {});
jest.mock("react-draggable", () => ({ children }) => <div>{children}</div>);

const mockTheme = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

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
const csvContent = mockEDA.map((row) => row.join(",")).join("\n");

const initialEntry = {
  pathname: "/processing",
  state: {
    file: new File([csvContent], "mock.csv", { type: "text/csv" }),
    signalType: "EDA",
    timestampColumn: 0,
    samplingRate: 1,
    signalValues: 1,
  },
};

jest.mock("@xyflow/react", () => {
  const actual = jest.requireActual("@xyflow/react");

  const FakeReactFlow = (props) => {
    const RealReactFlow = actual.ReactFlow;

    const element = (
      <RealReactFlow
        {...props}
        onInit={(instance) => {
          global.reactFlowInstance = instance;
        }}
      />
    );

    return element;
  };

  return {
    ...actual,
    ReactFlow: FakeReactFlow,
  };
});

async function setupFlow() {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ThemeContext.Provider value={mockTheme}>
        <Routes>
          <Route path="/processing" element={<Processing />} />
        </Routes>
      </ThemeContext.Provider>
    </MemoryRouter>
  );

  await screen.findByText(/Signal Processing/);
  await screen.findByText("metricA");

  const outlierButton = await screen.findByTitle(/add outlier detection node/i);
  fireEvent.click(outlierButton);

  const resamplingButton = await screen.findByTitle(/add resampling node/i);
  fireEvent.click(resamplingButton);

  const filteringButton = await screen.findByTitle(/add filtering node/i);
  fireEvent.click(filteringButton);

  const instance = global.reactFlowInstance;

  await waitFor(() => {
    const nodes = instance.getNodes();
    expect(nodes).toHaveLength(5);
  });

  act(() => {
    instance.addEdges({
      id: "xy-edge__1-3",
      source: "1",
      target: "3",
      type: "ButtonEdge",
      animated: true,
    });
  });

  act(() => {
    instance.addEdges({
      id: "xy-edge__3-2",
      source: "3",
      target: "2",
      type: "ButtonEdge",
      animated: true,
    });
  });

  await waitFor(() => {
    const edges = instance.getEdges();
    expect(edges).toHaveLength(2);
  });
}

async function readBlobAsText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read blob"));
    reader.readAsText(blob);
  });
}

describe("Processing", () => {
  beforeEach(() => {
    global.URL.createObjectURL = jest.fn(() => "blob:mock-pipeline");
    global.URL.revokeObjectURL = jest.fn();
    HTMLAnchorElement.prototype.click = jest.fn();

    global.fetch = jest.fn((url) => {
      if (url.includes("metrics")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              metricA: { value: 0.967534, description: "Gadea et al." },
            }),
        });
      }

      if (url.includes("outliers")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                // No headers
                [0, 55.55],
                [1, 1.5],
                [2, 2.2],
                [3, 2.5],
                [4, 3.3],
                [5, 3.5],
                [6, 4.4],
              ],
            }),
        });
      }
    });
  });

  it("clean flow", async () => {
    await setupFlow();

    fireEvent.click(screen.getByTitle("Restart flow"));

    await screen.findByText(/Confirm reset/i);
    fireEvent.click(screen.getByText(/Yes, clean/i));

    await waitFor(() => {
      const nodes = global.reactFlowInstance.getNodes();
      expect(nodes).toHaveLength(2);
    });
  });

  it("delete node", async () => {
    await setupFlow();

    fireEvent.click(screen.getByTestId("delete3"));

    await waitFor(() => {
      const nodes = global.reactFlowInstance.getNodes();
      const hasNode3 = nodes.some((n) => n.id === "3");
      expect(hasNode3).toBe(false);

      const edges = global.reactFlowInstance.getEdges();
      expect(edges).toHaveLength(0);
    });
  });

  it("executes whole pipeline", async () => {
    await setupFlow();

    const button = screen.getByTitle("Start-end execution");

    const listener = jest.fn();
    window.addEventListener(`execute-node2`, listener);

    fireEvent.click(button);

    await waitFor(() => {
      // Processed signal table
      expect(screen.getByText("55.5500")).toBeInTheDocument();
    });
  });

  it("shows error if metrics returns error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Metrics failed" }),
      })
    );

    try {
      await setupFlow();
    } catch (e) {
      // intentionally ignored
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith("Metrics failed");

    consoleErrorSpy.mockRestore();
  });

  it("shows error if metrics returns error after execution", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    await setupFlow();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Metrics failed" }),
      })
    );

    //Execute
    const button = screen.getByTitle("Start-end execution");

    const listener = jest.fn();
    window.addEventListener(`execute-node2`, listener);

    fireEvent.click(button);

    // Now metrics fails
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Metrics failed");
    });

    consoleErrorSpy.mockRestore();
  });

  it("manually connects nodes 4 and 5", async () => {
    await setupFlow();

    act(() => {
      global.reactFlowInstance.addEdges({
        id: "xy-edge__4-5",
        source: "4",
        target: "5",
        type: "ButtonEdge",
        animated: true,
      });
    });

    await waitFor(() => {
      const edges = global.reactFlowInstance.getEdges();
      expect(edges.some((e) => e.source === "4" && e.target === "5")).toBe(
        true
      );
    });
  });

  it("inserts a node on an existing edge", async () => {
    await setupFlow();

    const insertButtons = screen.getAllByRole("button", { name: /insert node/i });
    fireEvent.click(insertButtons[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /insert filtering node/i })[0]);

    await waitFor(() => {
      const nodes = global.reactFlowInstance.getNodes();
      expect(nodes).toHaveLength(6);
    });

    await waitFor(() => {
      const edges = global.reactFlowInstance.getEdges();
      expect(edges.some((edge) => edge.id === "xy-edge__1-3")).toBe(false);
      expect(edges.some((edge) => edge.source === "1" && edge.target === "6")).toBe(true);
      expect(edges.some((edge) => edge.source === "6" && edge.target === "3")).toBe(true);
    });
  });

  it("exports the current pipeline to JSON", async () => {
    await setupFlow();

    fireEvent.click(screen.getByTitle("Export pipeline"));

    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);

    const exportedBlob = global.URL.createObjectURL.mock.calls[0][0];
    const exportedText = await readBlobAsText(exportedBlob);
    const exportedPipeline = JSON.parse(exportedText);

    expect(exportedPipeline.signalType).toBe("EDA");
    expect(exportedPipeline.nodes).toHaveLength(3);
    expect(exportedPipeline.edges).toHaveLength(2);
    expect(exportedPipeline.nodes.map((node) => node.type)).toEqual(
      expect.arrayContaining(["OutliersNode", "ResamplingNode", "FilteringNode"])
    );
  });

  it("imports a pipeline from JSON", async () => {
    await setupFlow();

    const fileInput = document.querySelector('input[type="file"]');
    const importedPipeline = {
      signalType: "EDA",
      nodes: [
        {
          id: "3",
          type: "FilteringNode",
          position: { x: 320, y: 110 },
          data: {
            samplingRate: 1,
            filter: "fir",
            fields: {
              lowcut: 0.1,
              highcut: 0.4,
              python: "",
            },
          },
        },
      ],
      edges: [
        { source: "1", target: "3" },
        { source: "3", target: "2" },
      ],
    };

    await act(async () => {
      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(
              [JSON.stringify(importedPipeline)],
              "pipeline.json",
              { type: "application/json" }
            ),
          ],
        },
      });
    });

    await waitFor(() => {
      const nodes = global.reactFlowInstance.getNodes();
      expect(nodes).toHaveLength(3);
    });

    const importedNode = global.reactFlowInstance
      .getNodes()
      .find((node) => node.id === "3");

    expect(importedNode.type).toBe("FilteringNode");
    expect(importedNode.data.filter).toBe("fir");

    const importedEdges = global.reactFlowInstance.getEdges();
    expect(importedEdges).toHaveLength(2);
    expect(importedEdges.some((edge) => edge.source === "1" && edge.target === "3")).toBe(true);
    expect(importedEdges.some((edge) => edge.source === "3" && edge.target === "2")).toBe(true);
  });

  it("loads the recommended EDA pipeline", async () => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <ThemeContext.Provider value={mockTheme}>
          <Routes>
            <Route path="/processing" element={<Processing />} />
          </Routes>
        </ThemeContext.Provider>
      </MemoryRouter>
    );

    await screen.findByText(/Signal Processing/);
    await screen.findByText("metricA");

    fireEvent.click(screen.getByTitle("Recommended pipelines"));
    fireEvent.click(await screen.findByText("EDA / GSR"));

    await waitFor(() => {
      const nodes = global.reactFlowInstance.getNodes();
      expect(nodes).toHaveLength(5);
    });

    const nodes = global.reactFlowInstance.getNodes();
    const filteringNode = nodes.find((node) => node.type === "FilteringNode");
    const resamplingNode = nodes.find((node) => node.type === "ResamplingNode");
    const outliersNode = nodes.find((node) => node.type === "OutliersNode");

    expect(resamplingNode.data.targetSamplingRate).toBe(15);
    expect(outliersNode.data.outlierTechnique).toBe("iqr");
    expect(filteringNode.data.filter).toBe("gaussian");
    expect(filteringNode.data.fields.sigma).toBe(100);

    const edges = global.reactFlowInstance.getEdges();
    expect(edges).toHaveLength(4);
  });
});
