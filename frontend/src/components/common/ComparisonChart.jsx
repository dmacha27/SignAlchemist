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
  handleResetZoom,
  exportToPNG,
} from '../utils/chartUtils';

import { ThemeContext } from '../../App';

const MAX_DATA_LENGTH = 5000;

const baseChartOptions = {
  label: "comparison",
  responsive: true,
  plugins: {
    legend: {
      display: true
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
      beginAtZero: true,
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
 * ComparisonChart component renders a line chart that compares two datasets over time or values.
 * 
 * @param {Object} props - The props for the component.
 * @param {Array} props.table1 - The first dataset, a 2D array where each sub-array represents a pair of x and y values.
 * @param {Array} props.table2 - The second dataset, a 2D array where each sub-array represents a pair of x and y values.
 * @param {string} [props.name1="Original"] - The label for the first dataset.
 * @param {string} props.name2 - The label for the second dataset.
 * 
 */
const ComparisonChart = memo(({ table1, table2, name2, name1 = "Original" }) => {
  const chartRef = useRef(null);
  const draggableRef = useRef(null);

  const [headers1, ...rows1] = table1;
  const rows2 = table2.slice(1);

  const isLargeDataset = rows1.length > MAX_DATA_LENGTH || rows2.length > MAX_DATA_LENGTH;

  const shouldCaptureImage = useRef(true);
  useEffect(() => {
    shouldCaptureImage.current = true;
  }, [table1, table2]);

  const { isDarkMode: isDark } = useContext(ThemeContext);

  const chartOptions = useMemo(() => ({
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        display: true,
        labels: {
          color: isDark ? '#ffffff' : '#000000',
        },
      },
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
        type: rows1[0][0] === 0.0 && rows2[0][0] === 0.0 ? 'linear' : 'time',
        ticks: { color: isDark ? '#ffffff' : '#000000' },
        grid: { color: isDark ? '#444444' : '#e5e5e5' },
        title: {
          ...baseChartOptions.scales.x.title,
          text: rows1[0][0] === 0.0 ? `${headers1[0]} (ms)` : `${headers1[0]} (date)`,
          color: isDark ? '#ffffff' : '#000000',
        }
      },
      y: {
        ...baseChartOptions.scales.y,
        ticks: { color: isDark ? '#ffffff' : '#444444' },
        grid: { color: isDark ? '#444444' : '#e5e5e5' },
        title: {
          ...baseChartOptions.scales.y.title,
          text: `${headers1[1]}`,
          color: isDark ? '#ffffff' : '#000000',
        }
      }
    }
  }), [isDark, isLargeDataset]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.update();
  }, [isDark]);

  const chartData = {
    datasets: [
      {
        label: name1,
        data: rows1.map(([x, y]) => ({ x: x * 1000, y })),
        borderColor: '#2196f3',
        pointRadius: isLargeDataset ? 0 : 2,
        pointBackgroundColor: '#2196f3',
        fill: false
      },
      {
        label: name2,
        data: rows2.map(([x, y]) => ({ x: x * 1000, y })),
        borderColor: '#50C878',
        pointRadius: isLargeDataset ? 0 : 2,
        pointBackgroundColor: '#50C878',
        fill: false
      }
    ]
  };

  return (
    <div className="text-center py-4 px-2">
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
        </div>
      )}
    </div>
  );
});

ComparisonChart.propTypes = {
  table1: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    )
  ).isRequired,
  table2: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    )
  ).isRequired,
  name1: PropTypes.string,
  name2: PropTypes.string.isRequired,
};


export default ComparisonChart;
