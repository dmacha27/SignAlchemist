import { render, screen, userEvent } from "../../test-utils";
import ComparisonChart from "./ComparisonChart";
import { ThemeContext } from "../../contexts/ThemeContext";
import * as chartUtils from "../utils/chartUtils";

const mockChartRef = {
  config: {
    options: {
      label: "signal",
    },
  },
  update: jest.fn(),
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

    return <div data-testid="mock-line-chart" />;
  });

  return { Line };
});

jest.mock("chart.js", () => ({
  Chart: {
    register: jest.fn(),
  },
}));

jest.mock("chartjs-plugin-zoom", () => ({}));
jest.mock("chartjs-adapter-date-fns", () => {});
jest.mock("react-draggable", () => ({ children }) => <div>{children}</div>);

const mockTheme = {
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
};

describe("ComparisonChart", () => {
  beforeEach(() => {
    jest.spyOn(chartUtils, "exportToPNG").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetZoom").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetStyle").mockImplementation(() => {});
    jest.spyOn(chartUtils, "getActualColor").mockReturnValue("#2196f3");
    jest
      .spyOn(chartUtils, "processChartHighlight")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the chart with small dataset", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <ComparisonChart table1={mockEDA} table2={mockEDA} name2="Test" />
      </ThemeContext.Provider>
    );
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
    expect(screen.getByText("Reset Zoom")).toBeInTheDocument();
    expect(mockChartRef.data.datasets).toHaveLength(2); // Two datasets (2 lines)

    expect(mockChartRef.config.options.scales.x.type).toBe("linear");
    expect(mockChartRef.config.options.scales.x.title.text).toMatch(/((ms))/i);
  });

  it("renders correctly without timestamps starting with 0 in dark mode", () => {
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
      <ThemeContext.Provider value={{ ...mockTheme, isDarkMode: true }}>
        <ComparisonChart
          table1={mockRealTimeEDA}
          table2={mockRealTimeEDA}
          name2="Test"
        />
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
        <ComparisonChart table1={largeDataset} table2={mockEDA} name2="Test" />
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
        <ComparisonChart table1={mockEDA} table2={mockEDA} name2="Test" />
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
        <ComparisonChart table1={mockEDA} table2={mockEDA} name2="Test" />
      </ThemeContext.Provider>
    );

    const resetZoomButton = screen.getByText(/Reset Zoom/i);
    await userEvent.click(resetZoomButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalled();
  });
});
