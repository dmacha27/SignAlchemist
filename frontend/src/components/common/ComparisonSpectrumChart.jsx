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
import { Button, Menu, NumberInput, Group } from "@mantine/core";
import { FaDownload, FaImage, FaSearch, FaHandPaper } from "react-icons/fa";
import Draggable from "react-draggable";

import { diff, average } from "../utils/dataUtils.js";
import { exportToPNG, handleResetZoom } from "../utils/chartUtils";

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

const MAX_DATA_LENGTH = 5000;

import { ThemeContext } from "../../contexts/ThemeContext";
import ErrorBoundary from "./ErrorBoundary";

const baseChartOptions = {
  label: "comparison-spectrum",
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: "top",
    },
    tooltip: {
      mode: "nearest",
      intersect: true,
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
      title: {
        display: true,
        text: "Frequency (Hz)",
        color: "#111",
        font: { size: 14, weight: "bold" },
      },
    },
    y: {
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
  return signal.concat(Array(desiredLength - signal.length).fill(0));
}

function processFFT(table, samplingRate) {
  const signal = table.slice(1).map((row) => row[1]);
  const padded = padToPowerOfTwo(signal);
  const phasors = fft(padded);
  const frequencies = fftUtil.fftFreq(phasors, samplingRate);
  const magnitudes = fftUtil.fftMag(phasors);
  return frequencies.map((f, i) => ({ x: f, y: magnitudes[i] }));
}

/**
 * ComparisonSpectrumChart component renders a line chart that compares two spectrograms.
 *
 * @param {Object} props - The props for the component.
 * @param {Array} props.table1 - The first dataset, a 2D array where each sub-array represents a pair of x and y values.
 * @param {Array} props.table2 - The second dataset, a 2D array where each sub-array represents a pair of x and y values.
 * @param {string} [props.name1="Original"] - The label for the first dataset.
 * @param {string} props.name2 - The label for the second dataset.
 *
 */
const ComparisonSpectrumChart = memo(
  ({ table1, table2, name2, name1 = "Original" }) => {
    const chartRef = useRef(null);
    const draggableRef = useRef(null);

    const samplingRate1 =
      1 / average(diff(table1.slice(1).map((row) => row[0])));
    const dataset1 = useMemo(() => processFFT(table1, samplingRate1), [table1]);

    const samplingRate2 =
      1 / average(diff(table2.slice(1).map((row) => row[0])));
    const dataset2 = useMemo(() => processFFT(table2, samplingRate2), [table2]);

    const isLargeDataset =
      dataset1.length > MAX_DATA_LENGTH || dataset2.length > MAX_DATA_LENGTH;

    const minXValue = useMemo(() => {
      return Math.min(...dataset1.map((d) => d.x), ...dataset2.map((d) => d.x));
    }, [dataset1, dataset2]);

    const maxXValue = useMemo(() => {
      return Math.max(...dataset1.map((d) => d.x), ...dataset2.map((d) => d.x));
    }, [dataset1, dataset2]);

    const minYValue = useMemo(() => {
      return Math.min(...dataset1.map((d) => d.y), ...dataset2.map((d) => d.y));
    }, [dataset1, dataset2]);

    const maxYValue = useMemo(() => {
      return Math.max(...dataset1.map((d) => d.y), ...dataset2.map((d) => d.y));
    }, [dataset1, dataset2]);

    const zoomRangeX = (maxXValue - minXValue) * 0.02;
    const zoomRangeY = (maxYValue - minYValue) * 0.001;

    const [goToX, setGoToX] = useState(null);
    const [yMin, setYMin] = useState(null);
    const [yMax, setYMax] = useState(null);

    const { isDarkMode: isDark } = useContext(ThemeContext);

    const chartOptions = useMemo(
      () => ({
        ...baseChartOptions,
        plugins: {
          ...baseChartOptions.plugins,
          legend: {
            display: true,
            labels: {
              color: isDark ? "#ffffff" : "#000000",
            },
          },
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

    const chartData = {
      datasets: [
        {
          label: name1,
          data: dataset1,
          borderColor: "#2196f3",
          pointBackgroundColor: "#2196f3",
          pointRadius: 2,
          fill: false,
        },
        {
          label: name2,
          data: dataset2,
          borderColor: "#50C878",
          pointBackgroundColor: "#50C878",
          pointRadius: 2,
          fill: false,
        },
      ],
    };

    const handleGoToX = () => {
      if (
        chartRef.current &&
        goToX !== null &&
        minXValue <= goToX &&
        goToX <= maxXValue
      ) {
        handleResetZoom(chartRef.current);
        chartRef.current.config.options.scales.x.min = goToX - zoomRangeX;
        chartRef.current.config.options.scales.x.max = goToX + zoomRangeX;
        chartRef.current.update();
      }
    };

    const handleYMinMax = () => {
      if (
        chartRef.current &&
        yMin !== null &&
        yMax !== null &&
        yMin <= yMax &&
        minYValue <= yMin &&
        yMax <= maxYValue
      ) {
        handleResetZoom(chartRef.current);
        chartRef.current.config.options.scales.y.min = yMin - zoomRangeY;
        chartRef.current.config.options.scales.y.max = yMax + zoomRangeY;
        chartRef.current.update();
      }
    };

    return (
      <div className="text-center py-4">
        <div className="relative">
          <ErrorBoundary>
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          </ErrorBoundary>
          <Draggable
            bounds="parent"
            nodeRef={draggableRef}
            handle=".drag-handle"
          >
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
              <Button size="xs" onClick={handleGoToX} aria-label="go-x">
                Go
              </Button>
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
              <Button size="xs" onClick={handleYMinMax} aria-label="go-y">
                Go
              </Button>
            </Group>
          </div>
        )}
      </div>
    );
  }
);

ComparisonSpectrumChart.propTypes = {
  table1: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  table2: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  name1: PropTypes.string,
  name2: PropTypes.string.isRequired,
};

export default ComparisonSpectrumChart;
