import { generateDataOriginal } from "./dataUtils";
import {
  exportToPNG,
  handleResetStyle,
  handleResetZoom,
  updateDatasetStyles,
  processChartHighlight,
} from "../utils/chartUtils";

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

describe("dataUtils", () => {
  describe("generateDataOriginal", () => {
    it("returns correct array", () => {
      const file_headers = [...mockEDA[0], "Timestamp (calc)"];
      const rows = mockEDA.slice(1);
      const result = generateDataOriginal(file_headers, rows, 0, 1, 1);

      expect(result).toEqual(mockEDA);
    });

    it("generates data with synthetic timestamps when no timestamp column", () => {
      const file_headers = [...mockEDA[0], "Timestamp (calc)"];
      const rows = mockEDA.slice(1);
      const result = generateDataOriginal(file_headers, rows, 2, 1, 4);

      expect(result[0]).toEqual(["Timestamp (calc)", "Gsr"]);
      expect(result[1][0]).toBeCloseTo(0.0);
      expect(result[2][0]).toBeCloseTo(0.25);
      expect(result[3][0]).toBeCloseTo(0.5);

      const expectedGsrValues = mockEDA.slice(1).map((row) => row[1]);
      const resultGsrValues = result.slice(1).map((row) => row[1]);
      expect(resultGsrValues).toEqual(expectedGsrValues);
    });
  });
});

describe("chartUtils", () => {
  describe("handleResetZoom", () => {
    it("sets min and max and calls update", () => {
      const mockChart = {
        config: {
          options: {
            scales: {
              x: { min: "STH", max: "STH" },
              y: { min: "STH", max: "STH" },
            },
          },
        },
        update: jest.fn(),
      };

      handleResetZoom(mockChart);

      expect(mockChart.config.options.scales.x.min).toBeUndefined();
      expect(mockChart.config.options.scales.x.max).toBeUndefined();
      expect(mockChart.config.options.scales.y.min).toBeUndefined();
      expect(mockChart.config.options.scales.y.max).toBeUndefined();
      expect(mockChart.update).toHaveBeenCalled();
    });

    it("does nothing if chart is undefined", () => {
      expect(handleResetZoom(null)).toBeUndefined();
    });
  });

  describe("handleResetStyle", () => {
    it("resets chart styles", () => {
      const dataPoints = [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ];
      const chart = {
        data: {
          datasets: [
            {
              data: dataPoints,
              pointBackgroundColor: [],
              pointBorderColor: [],
              pointRadius: [],
            },
          ],
        },
        update: jest.fn(),
      };

      const color = "yellow";

      handleResetStyle(chart, color);

      expect(chart.data.datasets[0].pointBackgroundColor).toEqual([
        color,
        color,
      ]);
      expect(chart.data.datasets[0].pointBorderColor).toEqual([color, color]);
      expect(chart.data.datasets[0].pointRadius).toEqual([2, 2]);

      expect(chart.data.datasets[0].segment.borderColor()).toBe(color);
      expect(chart.data.datasets[0].segment.backgroundColor()).toBe(color);

      expect(chart.update).toHaveBeenCalled();
    });

    it("does nothing if chart is undefined", () => {
      expect(handleResetStyle(null, "#fff")).toBeUndefined();
    });
  });

  describe("exportToPNG", () => {
    let capturedAnchor;

    beforeEach(() => {
      capturedAnchor = null;
      const originalCreateElement = document.createElement;
      jest.spyOn(document, "createElement").mockImplementation((tag) => {
        const el = originalCreateElement.call(document, tag);
        if (tag === "a") capturedAnchor = el;
        return el;
      });
    });

    afterEach(() => {
      document.createElement.mockRestore();
    });

    it("generates image with correct filename", () => {
      const mockChart = {
        toBase64Image: jest.fn(() => "data:image"),
      };

      exportToPNG(mockChart);

      expect(mockChart.toBase64Image).toHaveBeenCalled();

      expect(capturedAnchor.href).toBe("data:image");
      expect(capturedAnchor.download).toBe("chart.png");
    });

    it("manages to generate image with incorrect filename", () => {
      const mockChart = {
        toBase64Image: jest.fn(() => "data:image"),
      };

      exportToPNG(mockChart, "bad");

      expect(capturedAnchor.download).toBe("chart.png");
    });

    it("does nothing if chart is undefined", () => {
      expect(exportToPNG(null)).toBeUndefined();
    });
  });

  describe("updateDatasetStyles", () => {
    it("updates dataset properties correctly", () => {
      const dataset = {
        data: [1, 2, 3, 4],
        pointBackgroundColor: [],
        pointBorderColor: [],
        pointRadius: [],
      };
      const highlightColor = "red";
      const actualColor = "blue";

      updateDatasetStyles(dataset, 2, highlightColor, actualColor);

      expect(dataset.pointBackgroundColor).toEqual([
        actualColor,
        actualColor,
        highlightColor,
        actualColor,
      ]);
      expect(dataset.pointBorderColor).toEqual([
        actualColor,
        actualColor,
        highlightColor,
        actualColor,
      ]);
      expect(dataset.pointRadius).toEqual([2, 2, 6, 2]);
    });
  });

  describe("processChartHighlight", () => {
    const mockChart = {
      data: {
        datasets: [
          {
            data: new Array(10).fill({ x: 1, y: 1 }),
            pointBackgroundColor: "#2196f3",
          },
        ],
      },
      config: { options: { scales: { x: { min: "STH", max: "STH" } } } },
      update: jest.fn(),
    };

    const mockChartRef = {
      current: {
        data: {
          datasets: [{ data: new Array(10).fill({ x: 1, y: 1 }) }],
        },
      },
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("does nothing if dataset is too large", () => {
      mockChart.data.datasets[0].data = new Array(6000).fill({ x: 1, y: 1 });
      expect(
        processChartHighlight(mockChart, -1, -1, "#fa6400", -1, mockChartRef)
      ).toBeUndefined();
    });

    it("does nothing if length mismatch", () => {
      mockChart.data.datasets[0].data = new Array(10).fill({ x: 1, y: 1 });
      mockChartRef.current.data.datasets[0].data = new Array(5).fill({
        x: 1,
        y: 1,
      });
      expect(
        processChartHighlight(mockChart, -1, -1, "#fa6400", -1, mockChartRef)
      ).toBeUndefined();
    });

    it("updates styles and sets zoom range", () => {
      mockChart.data.datasets[0].data = new Array(10).fill({ x: 1, y: 1 });
      mockChartRef.current.data.datasets[0].data = new Array(10).fill({
        x: 1,
        y: 1,
      });

      processChartHighlight(
        mockChart,
        4, // pointIndex
        1, // xvalue
        "#fa6400", // highlightColor
        2, // zoomRange
        mockChartRef
      );

      expect(mockChart.config.options.scales.x.min).toBe(-1); // 1 - 2 / xvalue - zoomRange
      expect(mockChart.config.options.scales.x.max).toBe(3); // 1 + 2
      expect(mockChart.update).toHaveBeenCalled();
    });
  });
});
