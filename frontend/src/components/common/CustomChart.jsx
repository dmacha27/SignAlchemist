import { memo, useRef, useEffect } from 'react';
import { Button, Container, Alert } from 'react-bootstrap';
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
import { FaSearch } from 'react-icons/fa';

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
 * CustomChart component renders a chart based on the given table data.
 * 
 * @param {Object} props
 * @param {Array} props.table - A 2D array with headers in the first row and data points in subsequent rows.
 * @param {function} props.setChartImage - A function that sets the chart image as a base64 string when the animation completes.
 */
const CustomChart = memo(({ table, setChartImage, parallel = true }) => { // Avoid re-render on parent render if table and setChartImage do not change.
  // table: [[header, header], [x1, y1], [x2, y2], [x3, y3]]

  const chartRef = useRef(null);
  const [headers, ...rows] = table;

  const minValue = Math.min(...rows.map(row => row[0])); //seconds
  const maxValue = Math.max(...rows.map(row => row[0]));

  const zoomRange = parseInt((maxValue*1000 - minValue*1000) * 0.02);

  const isLargeDataset = rows.length > MAX_DATA_LENGTH;

  const shouldCaptureImage = useRef(true);
  useEffect(() => {
    shouldCaptureImage.current = true;
  }, [table]);

  const handleResetZoom = () => {
    if (chartRef.current) {

      chartRef.current.options.scales.x.min = minValue * 1000;
      chartRef.current.options.scales.x.max = maxValue * 1000;
      chartRef.current.update();
    }
  };

  const handleResetStyle = () => {
    if (chartRef.current) {

      const dataset = chartRef.current.data.datasets[0];
      dataset.pointBackgroundColor = dataset.data.map((_, i) => '#2196f3');

      dataset.pointBorderColor = dataset.data.map((_, i) => '#2196f3');

      dataset.pointRadius = dataset.data.map((_, i) => 2);
      chartRef.current.update();
    }
  };

  const chartOptions = {
    ...baseChartOptions,
    onClick: function (evt) {
      const elements = chartRef.current.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
      if (elements.length === 0) return;

      const pointIndex = elements[0].index;
      const timestamp = chartRef.current.data.datasets[0].data[pointIndex].x;


      const highlightColor = '#fa6400';
      const defaultColor = '#2196f3';
      const charts = parallel ? Object.values(ChartJS.instances): [chartRef.current];

      charts.forEach(chart => {

        // Idea from: https://stackoverflow.com/questions/70987757/change-color-of-a-single-point-by-clicking-on-it-chart-js
        const dataset = chart.data.datasets[0];
        dataset.pointBackgroundColor = dataset.data.map((_, i) =>
          i === pointIndex ? highlightColor : defaultColor
        );

        dataset.pointBorderColor = dataset.data.map((_, i) =>
          i === pointIndex ? highlightColor : defaultColor
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
      const charts = parallel ? Object.values(ChartJS.instances): [chartRef.current];
      charts.forEach(chart => {
        if (chartRef.current !== chart) {
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
    animation: {
      onComplete: () => {
        if (shouldCaptureImage.current && chartRef.current) {
          const imageUrl = chartRef.current.toBase64Image();
          setChartImage(imageUrl);
          shouldCaptureImage.current = false;
        }
      }
    },
    scales: {
      ...baseChartOptions.scales,
      x: {
        ...baseChartOptions.scales.x,
        type: rows[0][0] == 0.0 ? 'linear' : 'time',
        title: {
          ...baseChartOptions.scales.x.title,
          text: rows[0][0] == 0.0 ? `${headers[0]} (ms)` : `${headers[0]} (date)`
        },

        ...(rows[0][0] == 0.0 ? {} : {
          time: baseChartOptions.scales.x.time
        })
      },
      y: {
        ...baseChartOptions.scales.y,
        title: {
          ...baseChartOptions.scales.y.title,
          text: headers[1]
        }
      }
    }
  };

  const chartData = {
    datasets: [
      {
        data: rows.map(([x, y]) => ({ x: x * 1000, y })),
        borderColor: 'rgba(33, 150, 243, 1)',
        pointRadius: isLargeDataset ? 0 : 2,
        pointBackgroundColor: '#2196f3',
        fill: false
      }
    ]
  };

  return (
    <Container className="text-center py-4">
      <Line ref={chartRef} data={chartData} options={chartOptions} />

      {isLargeDataset ? (
        <Alert variant="warning" className="w-75 m-auto mt-3" role="alert">
          <strong>Too much data</strong> – interaction is disabled to improve performance.
        </Alert>
      ) : (
        <div className='d-flex justify-content-center'>
          <Button
            variant="outline-primary"
            className="mt-3 d-flex align-items-center gap-2 mx-auto"
            onClick={handleResetZoom}
            style={{
              borderRadius: '50px',
              padding: '0.5rem 1.5rem',
              fontWeight: '500'
            }}
          >
            <FaSearch /> Reset Zoom
          </Button>
          <Button
            variant="outline-primary"
            className="mt-3 d-flex align-items-center gap-2 mx-auto"
            onClick={handleResetStyle}
            style={{
              borderRadius: '50px',
              padding: '0.5rem 1.5rem',
              fontWeight: '500'
            }}
          >
            <FaSearch /> Reset Style
          </Button>
        </div>
      )}
    </Container>
  );
});

export default CustomChart;