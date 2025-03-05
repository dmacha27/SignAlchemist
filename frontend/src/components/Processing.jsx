import { useState, useEffect } from 'react';


import { usePapaParse } from 'react-papaparse';

import { Accordion } from 'react-bootstrap';

import { useLocation } from "react-router-dom";


import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { ImgComparisonSlider } from '@img-comparison-slider/react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);



const Processing = () => {
    const location = useLocation();
    const { file, signalType, timestampColumn, signalValues } = location.state || {};
    const [pipelines, setPipelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);
    const [chartImages, setchartImages] = useState([]);
    const { readString } = usePapaParse();
    const [selectPipeline, setselectPipeline] = useState(1);
  
    const chartOptions = {
      responsive: true,
      scales: {
        x: { type: 'linear', position: 'bottom' },
        y: { beginAtZero: true },
      },
    };
  
    useEffect(() => {
      const requestPipelines = async () => {
        if (file) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("signalType", signalType);
          formData.append("timestampColumn", timestampColumn);
          formData.append("signalValues", signalValues);
  
          try {
            const response = await fetch("http://localhost:8000/process", {
              method: "POST",
              body: formData,
            });
  
            if (response.ok) {
              const result = await response.json();
              setPipelines(result.pipelines || []);
              setLoading(false);
            } else {
              console.error("Upload error", response.statusText);
            }
          } catch (error) {
            console.error("Request error:", error);
          }
        }
      };
  
      if (loading) {
        requestPipelines();
      }
  
      if (file && !loading) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          readString(content, {
            complete: (results) => {
              const rows = results.data.slice(1);
              const minTimestamp = Math.min(...rows.map(row => parseInt(row[timestampColumn])));
  
              let datasets = [
                {
                  label: "Señal Original",
                  data: rows.map(row => ({
                    x: parseInt(row[timestampColumn]) - minTimestamp,
                    y: parseFloat(row[signalValues]),
                  })),
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  fill: false,
                },
              ];
  
              pipelines.forEach((pipeline, index) => {
                datasets.push({
                  label: pipeline.title,
                  data: pipeline.signal.map(row => ({
                    x: parseInt(row[timestampColumn]) - minTimestamp,
                    y: parseFloat(row[signalValues]),
                  })),
                  borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                  backgroundColor: `hsla(${(index * 60) % 360}, 70%, 50%, 0.2)`,
                  fill: false,
                });
              });
  
              setChartData({ datasets });
            }
          });
        };
        reader.readAsText(file);
      }
  
    }, [file, signalType, timestampColumn, signalValues, loading, readString, pipelines]);
  
  
    useEffect(() => {
  
      if (!loading && !!chartData && !chartImages.length) {
        let images = [];
  
        console.log(chartData)
        chartData.datasets.forEach(dataset => {
  
          let ctx = document.createElement('canvas').getContext('2d');
  
          const aux = new ChartJS(ctx, {
            type: 'line',
            data: {
              datasets: [dataset],
            },
            options: chartOptions,
          });
  
          images.push(aux.toBase64Image());
        });
  
        setchartImages(images);
        console.log(images);
      }
  
    });
  
    const renderPipelines = () => {
      if (loading) {
        return <div>Loading...</div>;
      } else {
        return (
          <Accordion>
            {pipelines.map((pipeline, index) => (
              <Accordion.Item key={index} eventKey={`${index}`}>
                <Accordion.Header onClick={() => (setselectPipeline(index + 1))}>{pipeline.title}</Accordion.Header>
                <Accordion.Body>
                  Calidad de la señal: {pipeline.qualityMetric}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        );
      }
    };
  
    const renderCharts = (index1, index2) => {
      if (loading || !chartData) {
        return <div>Loading chart...</div>;
      } else {
  
        const datasets = [
          chartData.datasets[index1],
          chartData.datasets[index2],
        ];
  
        return (<>
          <Line
            data={{ datasets }}
            options={chartOptions}
          />
          <ImgComparisonSlider>
            <img slot="first" src={chartImages[index1]} />
            <img slot="second" src={chartImages[index2]} />
          </ImgComparisonSlider>
        </>
        );
      }
    };
  
    return (
      <div className="container text-center">
        <h1>Processing</h1>
        <div className="row align-items-start">
          <div className="col">
            {renderCharts(0, selectPipeline)}
          </div>
          <div className="col">
            {renderPipelines()}
          </div>
        </div>
      </div>
    );
  };

  export default Processing;
