import { render, screen, userEvent, fireEvent } from "../../test-utils";
import SpectrumChart from "./SpectrumChart";
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
  [7, 4.7],
];

jest.mock("react-chartjs-2", () => {
  const Line = jest.fn(({ data, options, ref }) => {
    mockChartRef.config.options = {
      ...options,
      label: "spectrum",
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

describe("SpectrumChart", () => {
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
        <SpectrumChart table={mockEDA} samplingRate={1} />
      </ThemeContext.Provider>
    );
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
  });

  it("renders warning and disables interaction with large dataset", () => {
    const largeDataset = [
      ["Timestamp", "Gsr"],
      ...Array.from({ length: 6000 }, (_, i) => [i, Math.random() * 10]),
    ];

    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumChart table={largeDataset} samplingRate={1} />
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

  it("onClick executes properly", () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumChart table={mockEDA} samplingRate={1} />
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
          label: "spectrum",
        },
      },
      update: jest.fn(),
      tooltip: {
        setActiveElements: jest.fn(),
      },
      data: { datasets: [{ data: { length: 4 } }] },
    };

    mockInstances["mockChartRef2"] = mockChartRef2;

    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumChart table={mockEDA} samplingRate={1} />
      </ThemeContext.Provider>
    );

    const chart = screen.getByTestId("mock-line-chart");

    fireEvent.mouseMove(chart);

    expect(mockChartRef2.tooltip.setActiveElements).toHaveBeenCalled();
    expect(mockChartRef2.update).toHaveBeenCalled();

    delete mockInstances["mockChartRef2"];
  });

  it("calls exportToPNG when export PNG menu item is clicked", async () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumChart table={mockEDA} samplingRate={1} />
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
        <SpectrumChart table={mockEDA} samplingRate={1} />
      </ThemeContext.Provider>
    );

    const resetZoomButton = screen.getByText(/Reset Zoom/i);
    await userEvent.click(resetZoomButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalled();
  });

  it("calls handleResetStyle when Reset Style button is clicked", async () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumChart table={mockEDA} samplingRate={1} />
      </ThemeContext.Provider>
    );

    const resetStyleButton = screen.getByText(/Reset Style/i);
    await userEvent.click(resetStyleButton);

    expect(chartUtils.handleResetStyle).toHaveBeenCalled();
  });

  it("handleGoToX works properly with one chart", async () => {
    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumChart table={mockEDA} samplingRate={1} />
      </ThemeContext.Provider>
    );

    const setGoToX = screen.getByPlaceholderText("Go to X...");
    fireEvent.change(setGoToX, { target: { value: 0.2 } });

    const goXButton = screen.getByLabelText("go-x");
    await userEvent.click(goXButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(1);
    expect(chartUtils.getActualColor).toHaveBeenCalledTimes(1);
    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(1);
    expect(mockChartRef.update).toHaveBeenCalled();
  });

  it("handleGoToX works properly with both charts", async () => {
    const mockChartRef2 = {
      config: {
        options: {
          label: "spectrum",
          scales: {
            x: {},
          },
        },
      },
      update: jest.fn(),
      tooltip: {
        setActiveElements: jest.fn(),
      },
      data: { datasets: [{ data: { length: 4 } }] },
    };

    mockInstances["mockChartRef2"] = mockChartRef2;

    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumChart table={mockEDA} samplingRate={1} />
      </ThemeContext.Provider>
    );

    const setGoToX = screen.getByPlaceholderText("Go to X...");
    fireEvent.change(setGoToX, { target: { value: 0.2 } });

    const bothXButton = screen.getByLabelText("both-x");
    await userEvent.click(bothXButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(2);
    expect(chartUtils.getActualColor).toHaveBeenCalledTimes(2);
    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(2);
    expect(mockChartRef2.update).toHaveBeenCalled();

    delete mockInstances["mockChartRef2"];
  });

  it("handleYMinMax works properly with one chart", async () => {
    const yMin = 5;
    const yMax = 15;
    const actualColor = "#2196f3";

    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumChart table={mockEDA} samplingRate={1} />
      </ThemeContext.Provider>
    );

    const setYMin = screen.getByPlaceholderText("Y min");
    fireEvent.change(setYMin, { target: { value: yMin } });

    const setYMax = screen.getByPlaceholderText("Y max");
    fireEvent.change(setYMax, { target: { value: yMax } });

    const goXButton = screen.getByLabelText("go-y");
    await userEvent.click(goXButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(1);
    expect(chartUtils.getActualColor).toHaveBeenCalledTimes(1);
    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(1);
    expect(mockChartRef.update).toHaveBeenCalled();

    // Also tests segment functions behaviour
    const borderColor = mockChartRef.data.datasets[0].segment.borderColor;
    const backgroundColor =
      mockChartRef.data.datasets[0].segment.backgroundColor;

    expect(
      borderColor({
        p0: { parsed: { y: yMin + 1 } },
        p1: { parsed: { y: yMax - 1 } },
      })
    ).toBe(actualColor);

    expect(
      backgroundColor({
        p0: { parsed: { y: yMin + 1 } },
        p1: { parsed: { y: yMax - 1 } },
      })
    ).toBe(actualColor);

    expect(
      borderColor({
        p0: { parsed: { y: yMin - 10 } },
        p1: { parsed: { y: yMax - 1 } },
      })
    ).toBe("gray");

    expect(
      backgroundColor({
        p0: { parsed: { y: yMin + 1 } },
        p1: { parsed: { y: yMax + 10 } },
      })
    ).toBe("gray");
  });

  it("handleYMinMax works properly with both charts", async () => {
    const mockChartRef2 = {
      config: {
        options: {
          label: "spectrum",
          scales: {
            x: {},
            y: {},
          },
        },
      },
      update: jest.fn(),
      tooltip: {
        setActiveElements: jest.fn(),
      },
      data: {
        datasets: [
          {
            data: [{ x: 1, y: 1 }],
          },
        ],
      },
    };

    mockInstances["mockChartRef2"] = mockChartRef2;

    render(
      <ThemeContext.Provider value={mockTheme}>
        <SpectrumChart table={mockEDA} samplingRate={1} />
      </ThemeContext.Provider>
    );

    const setYMin = screen.getByPlaceholderText("Y min");
    fireEvent.change(setYMin, { target: { value: 3 } });

    const setYMax = screen.getByPlaceholderText("Y max");
    fireEvent.change(setYMax, { target: { value: 20 } });

    const goXButton = screen.getByLabelText("both-y");
    await userEvent.click(goXButton);

    expect(chartUtils.handleResetZoom).toHaveBeenCalledTimes(2);
    expect(chartUtils.getActualColor).toHaveBeenCalledTimes(2);
    expect(chartUtils.handleResetStyle).toHaveBeenCalledTimes(2);
    expect(mockChartRef2.update).toHaveBeenCalled();

    delete mockInstances["mockChartRef2"];
  });
});
