import { render, screen, userEvent, fireEvent } from "../../test-utils";
import CustomChart from "./CustomChart";
import { ThemeContext } from "../../contexts/ThemeContext";
import * as chartUtils from "../utils/chartUtils";

let mockElements = [{ index: 2 }];

const mockChartRef = {
  config: {
    options: {
      label: "signal",
    },
  },
  update: jest.fn(),
  tooltip: {
    setActiveElements: jest.fn(),
  },
  getElementsAtEventForMode: jest.fn(() => mockElements),
  data: {},
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

jest.mock("react-chartjs-2", () => {
  const Line = jest.fn(({ data, options, ref }) => {
    mockChartRef.config.options = {
      ...options,
      label: "signal",
    };
    mockChartRef.data = data;
    ref.current = mockChartRef;

    return (
      <div
        data-testid="mock-line-chart"
        onClick={(e) => options.onClick(e)}
        onMouseMove={(e) => {
          const event = {
            ...e,
            native: {
              x: 0, // Arbitrary value
              y: 0,
            },
          };
          options.onHover(event, mockElements);
        }}
      />
    );
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

describe("CustomChart", () => {
  beforeEach(() => {
    jest.spyOn(chartUtils, "exportToPNG").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetZoom").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetStyle").mockImplementation(() => {});
    jest.spyOn(chartUtils, "getActualColor").mockReturnValue("#2196f3");
    jest
      .spyOn(chartUtils, "processChartHighlight")
      .mockImplementation(() => {});

    mockElements = [{ index: 2 }];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the chart with small dataset", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <CustomChart table={mockEDA} />
      </ThemeContext.Provider>
    );
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
    expect(screen.getByText("Reset Zoom")).toBeInTheDocument();
    expect(screen.getByText("Reset Style")).toBeInTheDocument();

    expect(mockChartRef.config.options.scales.x.type).toBe("linear"); // Datasets seem to be calculated (start by 0)
    expect(mockChartRef.config.options.scales.x.title.text).toMatch(/((ms))/i);
  });

  it("renders correctly without timestamps starting with 0", () => {
    const mockRealTimeEDA = [
      ["Timestamp", "Gsr"],
      [1749626640, 1.1],
      [1749626641, 1.5],
      [1749626642, 2.2],
      [1749626643, 2.5],
      [1749626644, 3.3],
      [1749626645, 3.5],
      [1749626646, 4.4],
    ];
    render(
      <ThemeContext.Provider value={mockTheme}>
        <CustomChart table={mockRealTimeEDA} />
      </ThemeContext.Provider>
    );

    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();

    expect(mockChartRef.config.options.scales.x.type).toBe("time");
    expect(mockChartRef.config.options.scales.x.title.text).toMatch(
      /((date))/i
    );
  });

  it("renders warning and disables interaction with large dataset", () => {
    const largeDataset = [
      ["Timestamp", "Gsr"],
      ...Array.from({ length: 6000 }, (_, i) => [i, Math.random() * 10]),
    ];

    render(
      <ThemeContext.Provider value={mockTheme}>
        <CustomChart table={largeDataset} />
      </ThemeContext.Provider>
    );
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
    expect(screen.getByText(/Too much data/i)).toBeInTheDocument();

    expect(screen.queryByText(/Reset Zoom/i)).not.toBeInTheDocument();

    expect(mockChartRef.config.options.plugins.zoom.pan.enabled).toBe(false);
    expect(mockChartRef.config.options.plugins.zoom.zoom.wheel.enabled).toBe(
      false
    );
    expect(mockChartRef.config.options.plugins.zoom.zoom.pinch.enabled).toBe(
      false
    );
  });

  it("calls exportToPNG when export PNG menu item is clicked", async () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <CustomChart table={mockEDA} />
      </ThemeContext.Provider>
    );

    const exportToPNGButton = screen.getByLabelText("export");
    await userEvent.click(exportToPNGButton);

    const pngItem = await screen.findByText("PNG");
    expect(pngItem).toBeInTheDocument();

    await userEvent.click(pngItem);

    expect(chartUtils.exportToPNG).toHaveBeenCalled();
  });

  it("calls handleResetZoom when Reset Zoom button is clicked", async () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <CustomChart table={mockEDA} />
      </ThemeContext.Provider>
    );

    const resetZoomButton = screen.getByText(/Reset Zoom/i);
    await userEvent.click(resetZoomButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalled();
  });

  it("calls handleResetStyle when Reset Style button is clicked", async () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <CustomChart table={mockEDA} />
      </ThemeContext.Provider>
    );

    const resetStyleButton = screen.getByText(/Reset Style/i);
    await userEvent.click(resetStyleButton);

    expect(chartUtils.handleResetStyle).toHaveBeenCalled();
  });

  it("onClick executes properly", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <CustomChart table={mockEDA} />
      </ThemeContext.Provider>
    );

    const chart = screen.getByTestId("mock-line-chart");

    fireEvent.click(chart);

    // processChartHighlight is already tested individually, correct behaviour spected.
    expect(chartUtils.processChartHighlight).toHaveBeenCalledTimes(1);
  });

  it("onHover activates tooltip in the other chart", () => {
    const mockChartRef2 = {
      config: {
        options: {
          label: "signal",
        },
      },
      update: jest.fn(),
      tooltip: {
        setActiveElements: jest.fn(),
      },
      data: { datasets: [{ data: { length: 7 } }] },
    };

    mockInstances["mockChartRef2"] = mockChartRef2;

    render(
      <ThemeContext.Provider value={mockTheme}>
        <CustomChart table={mockEDA} />
      </ThemeContext.Provider>
    );

    const chart = screen.getByTestId("mock-line-chart");

    fireEvent.mouseMove(chart);

    expect(mockChartRef2.tooltip.setActiveElements).toHaveBeenCalled();
    expect(mockChartRef2.update).toHaveBeenCalled();

    delete mockInstances["mockChartRef2"];
  });

  it("prevents onHover when length mismatch", () => {
    const mockChartRef2 = {
      config: {
        options: {
          label: "signal",
        },
      },
      update: jest.fn(),
      tooltip: {
        setActiveElements: jest.fn(),
      },
      data: { datasets: [{ data: { length: 345 } }] },
    };

    mockInstances["mockChartRef2"] = mockChartRef2;

    render(
      <ThemeContext.Provider value={mockTheme}>
        <CustomChart table={mockEDA} />
      </ThemeContext.Provider>
    );

    const chart = screen.getByTestId("mock-line-chart");

    fireEvent.mouseMove(chart);

    expect(mockChartRef2.tooltip.setActiveElements).not.toHaveBeenCalled();
    expect(mockChartRef2.update).not.toHaveBeenCalled();

    delete mockInstances["mockChartRef2"];
  });
});
