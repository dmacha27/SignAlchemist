import { useMemo, memo, useRef, useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";

import { fft, util as fftUtil } from "fft-js";

import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Menu, NumberInput, Button, Group } from "@mantine/core";
import { FaSearch, FaDownload, FaImage, FaHandPaper } from "react-icons/fa";
import Draggable from "react-draggable";
import { diff, average } from "../utils/dataUtils.js";

ChartJS.register(
  zoomPlugin,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

import {
  handleResetZoom,
  handleResetStyle,
  exportToPNG,
} from "../utils/chartUtils";

import { ThemeContext } from "../../contexts/ThemeContext";
import ErrorBoundary from "./ErrorBoundary";

const MAX_DATA_LENGTH = 5000;

const baseChartOptions = {
  label: "spectrum",
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: "index",
      intersect: false,
      backgroundColor: "#fff",
      titleColor: "#222",
      bodyColor: "#333",
      borderColor: "#ccc",
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      type: "linear",
      position: "bottom",
      title: {
        display: true,
        text: "Frequency (Hz)",
        color: "#111",
        font: { size: 14, weight: "bold" },
      },
    },
    y: {
      ticks: { color: "#444" },
      title: {
        display: true,
        text: "Amplitude",
        color: "#111",
        font: { size: 14, weight: "bold" },
      },
    },
  },
};

function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function padToPowerOfTwo(signal) {
  const desiredLength = nextPowerOfTwo(signal.length);
  const paddingLength = desiredLength - signal.length;
  const paddedSignal = signal.concat(Array(paddingLength).fill(0));
  return paddedSignal;
}

/**
 * SpectrumChart component renders a frequency spectrum chart using FFT (Fast Fourier Transform)
 *
 * @param {Object} props - The props for the component.
 * @param {Array} props.table - A 2D array of data where the first row contains headers and the rest contains signal data.
 * @param {string} [props.defaultColor='#2196f3'] - The default color for the chart's line and points.
 */
const SpectrumChart = memo(({ table, defaultColor = "#2196f3" }) => {
  const signal = useMemo(() => table.slice(1).map((row) => row[1]), [table]);

  const chartRef = useRef(null);
  const draggableRef = useRef(null);
  const [goToX, setGoToX] = useState(null);
  const [yMin, setYMin] = useState(null);
  const [yMax, setYMax] = useState(null);

  const { both_data, minXValue, maxXValue, minYValue, maxYValue, zoomRangeX } =
    useMemo(() => {
      const samplingRate =
        1 / average(diff(table.slice(1).map((row) => row[0])));
      const paddedSignal = padToPowerOfTwo(signal);
      const phasors = fft(paddedSignal);
      const frequencies = fftUtil.fftFreq(phasors, samplingRate);
      const magnitudes = fftUtil.fftMag(phasors);

      const both_data = frequencies.map((f, ix) => ({
        frequency: f,
        magnitude: magnitudes[ix],
      }));

      console.log(magnitudes);
      const minXValue = frequencies[0];
      const maxXValue = frequencies[frequencies.length - 1];
      const minYValue = magnitudes.reduce(
        (min, val) => Math.min(min, val),
        Infinity
      );
      const maxYValue = magnitudes.reduce(
        (max, val) => Math.max(max, val),
        -Infinity
      );

      const zoomRangeX = (maxXValue - minXValue) * 0.02;

      return {
        both_data,
        minXValue,
        maxXValue,
        minYValue,
        maxYValue,
        zoomRangeX,
      };
    }, [signal]);

  const isLargeDataset = both_data.length > MAX_DATA_LENGTH;

  const { isDarkMode: isDark } = useContext(ThemeContext);

  const chartOptions = useMemo(
    () => ({
      ...baseChartOptions,
      actualColor: defaultColor,
      plugins: {
        ...baseChartOptions.plugins,
        tooltip: {
          ...baseChartOptions.plugins.tooltip,
          backgroundColor: isDark ? "#333" : "#fff",
          titleColor: isDark ? "#fff" : "#222",
          bodyColor: isDark ? "#ddd" : "#333",
          borderColor: isDark ? "#555" : "#ccc",
        },
        zoom: {
          pan: {
            enabled: !isLargeDataset,
            mode: "x",
          },
          zoom: {
            wheel: { enabled: !isLargeDataset },
            pinch: { enabled: !isLargeDataset },
            mode: "x",
            onZoomComplete: ({ chart }) => {
              chart.config.options.scales.y.min = undefined;
              chart.config.options.scales.y.max = undefined;
              chart.update();
            },
          },
        },
      },
      scales: {
        ...baseChartOptions.scales,
        x: {
          ...baseChartOptions.scales.x,
          ticks: { color: isDark ? "#ffffff" : "#000000" },
          grid: { color: isDark ? "#444444" : "#e5e5e5" },
          title: {
            ...baseChartOptions.scales.x.title,
            color: isDark ? "#ffffff" : "#000000",
          },
        },
        y: {
          ...baseChartOptions.scales.y,
          ticks: { color: isDark ? "#ffffff" : "#444444" },
          grid: { color: isDark ? "#444444" : "#e5e5e5" },
          title: {
            ...baseChartOptions.scales.y.title,
            color: isDark ? "#ffffff" : "#000000",
          },
        },
      },
    }),
    [isDark, isLargeDataset]
  );

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.update();
  }, [isDark]);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          data: both_data.map(({ frequency, magnitude }) => ({
            x: frequency,
            y: magnitude,
          })),
          borderColor: defaultColor,
          pointRadius: 2,
          pointBackgroundColor: defaultColor,
          fill: false,
        },
      ],
    }),
    [both_data, defaultColor]
  );

  const handleGoToX = (both = false) => {
    if (chartRef.current && goToX !== null) {
      if (minXValue <= goToX && goToX <= maxXValue) {
        const charts = both
          ? Object.values(ChartJS.instances).filter(
              (chart) => chart?.config?.options?.label === "spectrum"
            )
          : [chartRef.current];

        charts.forEach((chart) => {
          const dataset = chart.data.datasets[0];
          if (dataset.data.length > MAX_DATA_LENGTH) return;
          const actualColor = chart.config.options.actualColor;

          handleResetZoom(chart);
          handleResetStyle(chart, actualColor);

          chart.config.options.scales.x.min = goToX - zoomRangeX;
          chart.config.options.scales.x.max = goToX + zoomRangeX;
          chart.update();
        });
      }
    }
  };

  const handleYMinMax = (both = false) => {
    if (chartRef.current && yMin !== null && yMax !== null) {
      if (
        minYValue <= yMin &&
        yMin <= maxYValue &&
        minYValue <= yMax &&
        yMax <= maxYValue &&
        yMin <= yMax
      ) {
        const charts = both
          ? Object.values(ChartJS.instances).filter(
              (chart) => chart?.config?.options?.label === "spectrum"
            )
          : [chartRef.current];
        charts.forEach((chart) => {
          const dataset = chart.data.datasets[0];
          if (dataset.data.length > MAX_DATA_LENGTH) return;
          const actualColor = chart.config.options.actualColor;

          handleResetZoom(chart);
          handleResetStyle(chart, actualColor);

          dataset.pointBackgroundColor = dataset.data.map(({ y }) => {
            return y >= yMin && y <= yMax ? actualColor : "gray";
          });

          dataset.pointBorderColor = dataset.data.map(({ y }) => {
            return y >= yMin && y <= yMax ? actualColor : "gray";
          });

          dataset.segment = {
            borderColor: ({ p0, p1 }) => {
              const y0 = p0.parsed.y;
              const y1 = p1.parsed.y;
              return y0 >= yMin && y0 <= yMax && y1 >= yMin && y1 <= yMax
                ? actualColor
                : "gray";
            },
            backgroundColor: ({ p0, p1 }) => {
              const y0 = p0.parsed.y;
              const y1 = p1.parsed.y;
              return y0 >= yMin && y0 <= yMax && y1 >= yMin && y1 <= yMax
                ? actualColor
                : "gray";
            },
          };

          const zoomRangeY = (yMax - yMin) * 0.02;
          chart.config.options.scales.y.min = yMin - zoomRangeY;
          chart.config.options.scales.y.max = yMax + zoomRangeY;
          chart.update();
        });
      }
    }
  };

  return (
    <div className="text-center py-4">
      <div className="relative">
        <ErrorBoundary>
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </ErrorBoundary>
        <Draggable bounds="parent" nodeRef={draggableRef} handle=".drag-handle">
          <div ref={draggableRef} className="absolute top-0 right-0 z-10">
            <div className="relative inline-block group">
              <Menu shadow="md" width={100}>
                <Menu.Target>
                  <Button size="xs" variant="light" aria-label="export">
                    <FaDownload />
                  </Button>
                </Menu.Target>
                <Menu.Dropdown className="bg-white dark:bg-gray-900 dark:border-gray-600">
                  <Menu.Label className="text-black dark:text-white">
                    Export as
                  </Menu.Label>
                  <Menu.Item
                    leftSection={<FaImage size={12} />}
                    onClick={() => exportToPNG(chartRef.current)}
                    className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    PNG
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>

              <div className="drag-handle absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:flex group-active:flex items-center justify-center cursor-move text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full w-6 h-6 shadow-md border border-gray-300 dark:border-gray-600">
                <FaHandPaper size={12} />
              </div>
            </div>
          </div>
        </Draggable>
      </div>
      {isLargeDataset ? (
        <div className="w-3/4 mx-auto mt-3 bg-yellow-100 text-yellow-800 p-4 rounded-md">
          <strong>Too much data</strong> – interaction is disabled to improve
          performance.
        </div>
      ) : (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => handleResetZoom(chartRef.current)}
            className="flex items-center gap-2 px-4 py-1 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white text-sm"
          >
            <FaSearch /> Reset Zoom
          </button>

          <div className="flex flex-col items-center gap-3">
            <Group spacing="xs">
              <NumberInput
                placeholder="Go to X..."
                size="xs"
                style={{ width: 100 }}
                hideControls
                step={0.001}
                precision={3}
                min={minXValue}
                max={maxXValue}
                onChange={(value) => setGoToX(value)}
              />
              <div className="flex gap-1">
                <Button
                  size="xs"
                  onClick={() => handleGoToX()}
                  aria-label="go-x"
                >
                  Go
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleGoToX(true)}
                  aria-label="both-x"
                >
                  Both
                </Button>
              </div>
            </Group>

            <Group spacing="xs">
              <NumberInput
                placeholder="Y min"
                size="xs"
                style={{ width: 80 }}
                hideControls
                precision={3}
                step={0.001}
                min={-Infinity}
                max={Infinity}
                onChange={(value) => setYMin(value)}
              />

              <NumberInput
                placeholder="Y max"
                size="xs"
                style={{ width: 80 }}
                hideControls
                precision={3}
                step={0.001}
                min={-Infinity}
                max={Infinity}
                onChange={(value) => setYMax(value)}
              />
              <div className="flex gap-1">
                <Button
                  size="xs"
                  onClick={() => handleYMinMax()}
                  aria-label="go-y"
                >
                  Go
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleYMinMax(true)}
                  aria-label="both-y"
                >
                  Both
                </Button>
              </div>
            </Group>
          </div>

          <button
            onClick={() => handleResetStyle(chartRef.current, defaultColor)}
            className="flex items-center gap-2 px-4 py-1 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white text-sm"
          >
            <FaSearch /> Reset Style
          </button>
        </div>
      )}
    </div>
  );
});

SpectrumChart.propTypes = {
  table: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  defaultColor: PropTypes.string,
};

export default SpectrumChart;
