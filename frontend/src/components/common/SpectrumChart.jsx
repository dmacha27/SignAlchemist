import { memo, useRef, useEffect } from 'react';
import { Button, Container, Alert } from 'react-bootstrap';

import { fft, util as fftUtil } from 'fft-js';

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
        },
        zoom: {
            pan: {
                enabled: true,
                mode: 'x'
            },
            zoom: {
                wheel: {
                    enabled: true,
                    mode: 'x'
                },
                pinch: {
                    enabled: true,
                    mode: 'x'
                },
                mode: 'x'
            }
        }
    },
    scales: {
        x: {
            type: 'linear',
            position: 'bottom',
            title: {
                display: true,
                text: 'Freq',
                color: '#111',
                font: { size: 14, weight: 'bold' }
            }
        },
        y: {
            beginAtZero: true,
            ticks: { color: '#444' },
            title: {
                display: true,
                text: 'Mag',
                color: '#111',
                font: { size: 14, weight: 'bold' }
            }
        }
    }
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

const SpectrumChart = memo(({ signal, samplingRate, setChartImage, parallel = true, defaultColor = '#2196f3' }) => {
    const chartRef = useRef(null);

    var phasors = fft(padToPowerOfTwo(signal));
    var frequencies = fftUtil.fftFreq(phasors, samplingRate);
    var magnitudes = fftUtil.fftMag(phasors);

    var both = frequencies.map(function (f, ix) {
        return { frequency: f, magnitude: magnitudes[ix] };
    });


    const chartData = {
        datasets: [
            {
                data: both.map(({ frequency, magnitude }) => ({
                    x: frequency,
                    y: magnitude
                })),
                borderColor: defaultColor,
                pointRadius: 2,
                pointBackgroundColor: defaultColor,
                fill: false
            }
        ]
    };

    return (
        <Container className="text-center py-4">
            <Line ref={chartRef} data={chartData} options={baseChartOptions} />
        </Container>
    );
});

export default SpectrumChart;
