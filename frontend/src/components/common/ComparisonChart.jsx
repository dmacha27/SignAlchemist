import { memo, useRef, useEffect } from 'react';
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
import { FaSearch, FaDownload, FaImage } from 'react-icons/fa';
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

const MAX_DATA_LENGTH = 5000;

const baseChartOptions = {
  label: "comparison-signal",
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

const ComparisonChart = memo(({ table1, table2, name2, name1 = "Original" }) => {
  const chartRef = useRef(null);
  const draggableRef = useRef(null);

  const [headers1, ...rows1] = table1;
  const [headers2, ...rows2] = table2;

  const minX = Math.min(
    ...rows1.map(row => row[0]),
    ...rows2.map(row => row[0])
  );
  const maxX = Math.max(
    ...rows1.map(row => row[0]),
    ...rows2.map(row => row[0])
  );

  const isLargeDataset = rows1.length > MAX_DATA_LENGTH || rows2.length > MAX_DATA_LENGTH;

  const shouldCaptureImage = useRef(true);
  useEffect(() => {
    shouldCaptureImage.current = true;
  }, [table1, table2]);

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.options.scales.x.min = undefined;
      chartRef.current.options.scales.x.max = undefined;
      chartRef.current.update();
    }
  };

  const exportToPNG = () => {
    if (chartRef.current) {
      const imageUrl = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'comparison-chart.png';
      link.click();
    }
  };

  const chartOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
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
        title: {
          ...baseChartOptions.scales.x.title,
          text: rows1[0][0] === 0.0 ? `${headers1[0]} (ms)` : `${headers1[0]} (date)`
        }
      },
      y: {
        ...baseChartOptions.scales.y,
        title: {
          ...baseChartOptions.scales.y.title,
          text: `${headers1[1]}`
        }
      }
    }
  };

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
            <div className="drag-handle w-9 h-2 bg-gray-300 rounded-t-md cursor-move mx-auto" />
            <Menu shadow="md" width={100}>
              <Menu.Target>
                <Button><FaDownload /></Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Export as</Menu.Label>
                <Menu.Item leftSection={<FaImage size={12} />} onClick={exportToPNG}>
                  PNG
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
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
            onClick={handleResetZoom}
            className="mt-3 flex items-center gap-2 mx-auto px-6 py-2 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-medium"
          >
            <FaSearch /> Reset Zoom
          </button>
        </div>
      )}
    </div>
  );
});

export default ComparisonChart;
