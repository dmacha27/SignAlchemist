import { render, screen, userEvent, fireEvent } from "../../test-utils";
import SpectrumComparisonChart from "./ComparisonSpectrumChart";
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
  [7, 4.7],
];

jest.mock("react-chartjs-2", () => {
  const Line = jest.fn(({ data, options, ref }) => {
    mockChartRef.config.options = {
      ...options,
      label: "signal",
      scales: {
        y: {},
        x: {},
      },
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

describe("ComparisonSpectrumChart", () => {
  beforeEach(() => {
    jest.spyOn(chartUtils, "exportToPNG").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetZoom").mockImplementation(() => {});
    jest.spyOn(chartUtils, "handleResetStyle").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the chart with small dataset", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumComparisonChart
          table1={mockEDA}
          table2={mockEDA}
          samplingRate={1}
          name2="Test"
        />
      </ThemeContext.Provider>
    );
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
  });

  it("renders warning and disables interaction with large dataset", () => {
    const largeDataset = [
      ["Timestamp", "Gsr"],
      ...Array.from({ length: 10000 }, (_, i) => [i, Math.random() * 10]),
    ];

    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumComparisonChart
          table1={largeDataset}
          table2={largeDataset}
          samplingRate={1}
          name2="Test"
        />
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
        <SpectrumComparisonChart
          table1={mockEDA}
          table2={mockEDA}
          samplingRate={1}
          name2="Test"
        />
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
        <SpectrumComparisonChart
          table1={mockEDA}
          table2={mockEDA}
          samplingRate={1}
          name2="Test"
        />
      </ThemeContext.Provider>
    );

    const resetZoomButton = screen.getByText(/Reset Zoom/i);
    await userEvent.click(resetZoomButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalled();
  });

  it("handleGoToX works properly", async () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumComparisonChart
          table1={mockEDA}
          table2={mockEDA}
          samplingRate={1}
          name2="Test"
        />
      </ThemeContext.Provider>
    );

    const setGoToX = screen.getByPlaceholderText("Go to X...");
    fireEvent.change(setGoToX, { target: { value: 0.2 } });

    const goXButton = screen.getByLabelText("go-x");
    await userEvent.click(goXButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(1);
    expect(mockChartRef.update).toHaveBeenCalled();
  });

  it("handleYMinMax works properly", async () => {
    const yMin = 5;
    const yMax = 15;

    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumComparisonChart
          table1={mockEDA}
          table2={mockEDA}
          samplingRate={1}
          name2="Test"
        />
      </ThemeContext.Provider>
    );

    const setYMin = screen.getByPlaceholderText("Y min");
    fireEvent.change(setYMin, { target: { value: yMin } });

    const setYMax = screen.getByPlaceholderText("Y max");
    fireEvent.change(setYMax, { target: { value: yMax } });

    const goXButton = screen.getByLabelText("go-y");
    await userEvent.click(goXButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(1);
    expect(mockChartRef.update).toHaveBeenCalled();
  });
});
