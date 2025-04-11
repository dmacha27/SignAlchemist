import { useRef } from 'react';
import { Button, Container, Alert } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
ChartJS.register(zoomPlugin, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


const max_length_lag = 5000;

const chartOptions = {
  responsive: true,
  plugins: {},
  scales: {
    x: {
      type: 'linear', position: 'bottom',
      title: {
        display: true,
        text: "(s)"
      }
    },
    y: { beginAtZero: true },
  },
};

/**
 * CustomChart component renders a chart based on the given table data.
 * 
 * @param {Object} props
 * @param {Array} props.table - A 2D array with headers in the first row and data points in subsequent rows.
 * @param {function} props.setChartImage - A function that sets the chart image as a base64 string when the animation completes.
 */
const CustomChart = ({ table, setChartImage }) => {
  // table: [[header, header], [x1, y1], [x2, y2], [x3, y3]]

  const headers = table[0];
  const data = table.slice(1);

  const chartRef = useRef(null);

  const isLargeDataset = data.length > max_length_lag;

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  const specificOptions = {
    ...chartOptions,
    plugins: {
      zoom: {
        pan: {
          enabled: !isLargeDataset,
          mode: "x"
        },
        zoom: {
          wheel: { enabled: !isLargeDataset },
          pinch: { enabled: !isLargeDataset },
          mode: "x"
        },
      },
    },
    animation: {
      onComplete: () => {
        if (chartRef.current) {
          const imageUrl = chartRef.current.toBase64Image();
          setChartImage(imageUrl);
        }
      },
    },
  }

  specificOptions.scales.x.title = { display: true, text: headers[0] + " (s)" }; // x axe
  specificOptions.scales.y.title = { display: true, text: headers[1] }; //y axe

  const datasets = [
    {
      label: "Signal",
      pointRadius: isLargeDataset ? 0 : 2,
      data: data.map((row) => ({
        x: row[0],
        y: row[1],
      })),
      borderColor: "rgb(75, 192, 192)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      fill: false,
    },
  ];

  return (
    <Container className="text-center">
      <Line ref={chartRef} data={{ datasets }} options={specificOptions} />

      {
        isLargeDataset ?
          <Alert variant="warning" className="w-75 m-auto" role="alert">
            Data is too large to interact.
          </Alert> :
          <Button variant="secondary" className="mt-3" onClick={resetZoom}>
            Reset Zoom
          </Button>
      }
    </Container>
  );
};

export default CustomChart;