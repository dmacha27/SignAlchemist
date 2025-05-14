import { memo, useRef, useEffect, useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { FaSearch, FaDownload, FaImage, FaHandPaper } from 'react-icons/fa';
import { Menu, Button } from '@mantine/core';
import Draggable from 'react-draggable';

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
  getActualColor,
  handleResetZoom,
  handleResetStyle,
  exportToPNG,
} from '../utils/chartUtils';

import { ThemeContext } from '../../contexts/ThemeContext';

const MAX_DATA_LENGTH = 5000;


const baseChartOptions = {
  label: "signal",
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: true,
      backgroundColor: '#fff',
      titleColor: '#222',
      bodyColor: '#333',
      borderColor: '#ccc',
      borderWidth: 1,
    }
  },
  scales: {
    x: {
      type: 'time',
      position: 'bottom',
      time: {
        unit: 'second',
        tooltipFormat: 'dd MMM yyyy HH:mm:ss',
        displayFormats: {
          minute: 'HH:mm',
          hour: 'HH:mm',
          day: 'MMM d',
        }
      },
      title: {
        display: true,
        text: '(ms)',
        color: '#111',
        font: { size: 14, weight: 'bold' }
      }
    },
    y: {
      ticks: { color: '#444' },
      title: {
        display: true,
        text: 'Value',
        color: '#111',
        font: { size: 14, weight: 'bold' }
      }
    }
  }
};

/**
 * CustomChart component renders a chart based on the given table data.
 * 
 * @param {Object} props
 * @param {Array} props.table - A 2D array with headers in the first row and data points in subsequent rows.
 * @param {string} [props.defaultColor='#2196f3'] - The default color for the chart's line and points.
 */
const CustomChart = memo(({ table, defaultColor = '#2196f3' }) => { // Avoid re-render on parent render if table and setChartImage do not change.
  // table: [[header, header], [x1, y1], [x2, y2], [x3, y3]]

  const chartRef = useRef(null);
  const draggableRef = useRef(null);
  const [headers, ...rows] = table;

  const minValue = Math.min(...rows.map(row => row[0])); //seconds
  const maxValue = Math.max(...rows.map(row => row[0]));

  const zoomRange = parseInt((maxValue * 1000 - minValue * 1000) * 0.02);

  const isLargeDataset = rows.length > MAX_DATA_LENGTH;

  const shouldCaptureImage = useRef(true);
  useEffect(() => {
    shouldCaptureImage.current = true; // Allow setChartImage, this will avoid zoomed images
  }, [table]);

  const { isDarkMode: isDark } = useContext(ThemeContext);

  const chartOptions = useMemo(() => ({
    ...baseChartOptions,
    onClick: function (evt) {
      const elements = chartRef.current.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
      if (elements.length === 0) return;

      const pointIndex = elements[0].index;
      const timestamp = chartRef.current.data.datasets[0].data[pointIndex].x;


      const highlightColor = '#fa6400';
      const charts = Object.values(ChartJS.instances).filter(chart => chart?.config?.options?.label === "signal");

      charts.forEach(chart => {
        console.log(chart)
        // Idea from: https://stackoverflow.com/questions/70987757/change-color-of-a-single-point-by-clicking-on-it-chart-js
        const dataset = chart.data.datasets[0];

        let actualColor = getActualColor(dataset.pointBackgroundColor);

        if (dataset.data.length > MAX_DATA_LENGTH) return; // No interaction to improve performance
        if (chartRef.current.data.datasets[0].data.length !== dataset.data.length) return; // No point-to-point correspondence

        dataset.pointBackgroundColor = dataset.data.map((_, i) =>
          i === pointIndex ? highlightColor : actualColor
        );

        dataset.pointBorderColor = dataset.data.map((_, i) =>
          i === pointIndex ? highlightColor : actualColor
        );

        dataset.pointRadius = dataset.data.map((_, i) =>
          i === pointIndex ? 6 : 2
        );
        chart.options.scales.x.min = timestamp - zoomRange;
        chart.options.scales.x.max = timestamp + zoomRange;

        chart.update();

      });

    },
    onHover: (event, chartElements) => {
      if (chartElements.length === 0) return;

      const elements = chartRef.current.getElementsAtEventForMode(event.native, 'nearest', { intersect: true }, false);
      if (elements.length === 0) return;

      // This part was suggested by ChatGPT and checked in source code: https://github.com/chartjs/Chart.js/blob/master/src/plugins/plugin.tooltip.js#L1106
      const index = elements[0].index;
      const charts = Object.values(ChartJS.instances).filter(chart => chart?.config?.options?.label === "signal");

      charts.forEach(chart => {
        if (chartRef.current !== chart) {
          if (chartRef.current.data.datasets[0].data.length !== chart.data.datasets[0].data.length) return; // No point-to-point correspondence
          chart.tooltip.setActiveElements(
            [{ datasetIndex: 0, index }],
            { x: event.native.x, y: event.native.y }
          );
          chart.update();
        }
      });
    },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        backgroundColor: isDark ? '#333' : '#fff',
        titleColor: isDark ? '#fff' : '#222',
        bodyColor: isDark ? '#ddd' : '#333',
        borderColor: isDark ? '#555' : '#ccc',
      },
      zoom: {
        pan: {
          enabled: !isLargeDataset,
          mode: 'x'
        },
        zoom: {
          wheel: { enabled: !isLargeDataset },
          pinch: { enabled: !isLargeDataset },
          mode: 'x'
        }
      }
    },
    scales: {
      ...baseChartOptions.scales,
      x: {
        ...baseChartOptions.scales.x,
        type: rows[0][0] == 0.0 ? 'linear' : 'time',
        ticks: { color: isDark ? '#ffffff' : '#000000' },
        grid: { color: isDark ? '#444444' : '#e5e5e5' },
        title: {
          ...baseChartOptions.scales.x.title,
          text: rows[0][0] == 0.0 ? `${headers[0]} (ms)` : `${headers[0]} (date)`,
          color: isDark ? '#ffffff' : '#000000',
        },

        ...(rows[0][0] == 0.0 ? {} : {
          time: baseChartOptions.scales.x.time
        })
      },
      y: {
        ...baseChartOptions.scales.y,
        ticks: { color: isDark ? '#ffffff' : '#444444' },
        grid: { color: isDark ? '#444444' : '#e5e5e5' },
        title: {
          ...baseChartOptions.scales.y.title,
          text: headers[1],
          color: isDark ? '#ffffff' : '#000000',
        }
      }
    }
  }), [isDark, headers, isLargeDataset, rows]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.update();
  }, [isDark]);

  const chartData = {
    datasets: [
      {
        data: rows.map(([x, y]) => ({ x: x * 1000, y })),
        borderColor: defaultColor,
        pointRadius: isLargeDataset ? 0 : 2,
        pointBackgroundColor: defaultColor,
        fill: false
      }
    ]
  };

  return (
    <div className="text-center py-4">
      <div className="relative">
        <Line ref={chartRef} data={chartData} options={chartOptions} />

        <Draggable bounds="parent" nodeRef={draggableRef} handle=".drag-handle">
          <div ref={draggableRef} className="absolute top-0 right-0 z-10">
            <div className="relative inline-block group">
              <Menu shadow="md" width={100}>
                <Menu.Target>
                  <Button
                    size="xs"
                    variant="light"
                  >
                    <FaDownload />
                  </Button>
                </Menu.Target>
                <Menu.Dropdown className="bg-white dark:bg-gray-900 dark:border-gray-600">
                  <Menu.Label className="text-black dark:text-white">Export as</Menu.Label>
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
          <strong>Too much data</strong> – interaction is disabled to improve performance.
        </div>
      ) : (
        <div className="flex justify-center gap-4 mt-3">
          <button
            onClick={() => handleResetZoom(chartRef.current)}
            className="mt-3 flex items-center gap-2 mx-auto px-6 py-2 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-medium"
          >
            <FaSearch /> Reset Zoom
          </button>
          <button
            onClick={() => handleResetStyle(chartRef.current, defaultColor)}
            className="mt-3 flex items-center gap-2 mx-auto px-6 py-2 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-medium"
          >
            <FaSearch /> Reset Style
          </button>
        </div>
      )}
    </div>
  );
});

CustomChart.propTypes = {
  table: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    )
  ).isRequired,
  defaultColor: PropTypes.string,
};

export default CustomChart;