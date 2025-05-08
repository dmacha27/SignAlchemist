import { useMemo, memo, useRef, useEffect, useState } from 'react';

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
import { Menu, NumberInput, Button, Group } from '@mantine/core';
import { FaSearch, FaDownload, FaImage } from 'react-icons/fa';
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
    TimeScale,
);

const MAX_DATA_LENGTH = 5000;

const baseChartOptions = {
    label: "spectrum",
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
            type: 'linear',
            position: 'bottom',
            title: {
                display: true,
                text: 'Frequence (Hz)',
                color: '#111',
                font: { size: 14, weight: 'bold' }
            }
        },
        y: {
            beginAtZero: true,
            ticks: { color: '#444' },
            title: {
                display: true,
                text: 'Amplitude',
                color: '#111',
                font: { size: 14, weight: 'bold' }
            }
        }
    }
};

function getActualColor(pointBackgroundColor) {
    if (typeof pointBackgroundColor === 'string') {
        return pointBackgroundColor;
    }

    for (let i = 0; i < pointBackgroundColor.length; i++) {
        const color = pointBackgroundColor[i];
        if (color !== '#fa6400' && color !== 'gray') { // Exlude orange (highlight) and gray
            return color;
        }
    }
    return pointBackgroundColor[0] || null;
}

function nextPowerOfTwo(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

function padToPowerOfTwo(signal) {
    const desiredLength = nextPowerOfTwo(signal.length);
    const paddingLength = desiredLength - signal.length;
    const paddedSignal = signal.concat(Array(paddingLength).fill(0));
    return paddedSignal;
}

const SpectrumChart = memo(({ table, samplingRate, setChartImage, defaultColor = '#2196f3' }) => {

    const signal = useMemo(() => table.slice(1).map(row => row[1]), [table]);

    const chartRef = useRef(null);
    const draggableRef = useRef(null);
    const [goToX, setGoToX] = useState(null);
    const [yMin, setYMin] = useState(null);
    const [yMax, setYMax] = useState(null);
    const shouldCaptureImage = useRef(true);
    useEffect(() => {
        shouldCaptureImage.current = true; // Allow setChartImage, this will avoid zoomed images
    }, [signal]);

    const { both_data, minXValue, maxXValue, minYValue, maxYValue, zoomRangeX, zoomRangeY } = useMemo(() => {
        const paddedSignal = padToPowerOfTwo(signal);
        const phasors = fft(paddedSignal);
        const frequencies = fftUtil.fftFreq(phasors, samplingRate);
        const magnitudes = fftUtil.fftMag(phasors);

        const both_data = frequencies.map((f, ix) => ({
            frequency: f,
            magnitude: magnitudes[ix]
        }));

        const minXValue = Math.min(...frequencies);
        const maxXValue = Math.max(...frequencies);
        const minYValue = Math.min(...magnitudes);
        const maxYValue = Math.max(...magnitudes);

        const zoomRangeX = (maxXValue - minXValue) * 0.02;
        const zoomRangeY = (maxYValue - minYValue) * 0.02;

        return { both_data, minXValue, maxXValue, minYValue, maxYValue, zoomRangeX, zoomRangeY };
    }, [signal, samplingRate]);

    const isLargeDataset = signal.length > MAX_DATA_LENGTH;

    const handleResetZoom = (ref) => {
        if (ref) {
            ref.options.scales.x.min = undefined;
            ref.options.scales.x.max = undefined;

            ref.options.scales.y.min = undefined;
            ref.options.scales.y.max = undefined;
            ref.update();
        }
    };

    const handleResetStyle = (ref, color = defaultColor) => {
        if (ref) {
            const dataset = ref.data.datasets[0];

            dataset.pointBackgroundColor = dataset.data.map(() => color);
            dataset.pointBorderColor = dataset.data.map(() => color);
            dataset.pointRadius = dataset.data.map(() => 2);

            dataset.segment = {
                borderColor: () => color,
                backgroundColor: () => color
            };

            ref.update();
        }
    };

    const exportToPNG = () => {
        if (chartRef.current) {
            const imageUrl = chartRef.current.toBase64Image();
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = 'chart.png';
            link.click();
        }
    };

    const chartOptions = useMemo(() => ({
        ...baseChartOptions,
        onClick: function (evt) {
            const elements = chartRef.current.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (elements.length === 0) return;

            const pointIndex = elements[0].index;
            const frequence = chartRef.current.data.datasets[0].data[pointIndex].x;

            const highlightColor = '#fa6400';
            const charts = Object.values(ChartJS.instances).filter(chart => chart?.config?.options?.label === "spectrum");

            charts.forEach(chart => {

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
                chart.options.scales.x.min = frequence - zoomRangeX;
                chart.options.scales.x.max = frequence + zoomRangeX;

                chart.update();

            });

        },
        onHover: (event, chartElements) => {
            if (chartElements.length === 0) return;

            const elements = chartRef.current.getElementsAtEventForMode(event.native, 'nearest', { intersect: true }, false);
            if (elements.length === 0) return;

            // This part was suggested by ChatGPT and checked in source code: https://github.com/chartjs/Chart.js/blob/master/src/plugins/plugin.tooltip.js#L1106
            const index = elements[0].index;
            const charts = Object.values(ChartJS.instances);
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
        animation: {
            onComplete: () => {
                if (shouldCaptureImage.current && chartRef.current) {
                    const imageUrl = chartRef.current.toBase64Image();
                    setChartImage(imageUrl);
                    shouldCaptureImage.current = false;
                }
            }
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
                    mode: 'x',
                    onZoomComplete: ({ chart }) => {
                        chart.options.scales.y.min = undefined;
                        chart.options.scales.y.max = undefined;
                        chart.update();
                    }
                },

            }
        }
    }), [isLargeDataset, setChartImage])

    const chartData = useMemo(() => ({
        datasets: [
            {
                data: both_data.map(({ frequency, magnitude }) => ({
                    x: frequency,
                    y: magnitude
                })),
                borderColor: defaultColor,
                pointRadius: 2,
                pointBackgroundColor: defaultColor,
                fill: false
            }
        ]
    }), [both_data, defaultColor])


    const handleGoToX = (both = false) => {
        if (chartRef.current && goToX !== null) {
            if (minXValue <= goToX <= maxXValue) {
                const charts = both ? Object.values(ChartJS.instances).filter(chart => chart?.config?.options?.label === "spectrum") : [chartRef.current];

                charts.forEach(chart => {
                    handleResetZoom(chart);
                    const dataset = chart.data.datasets[0];
                    let actualColor = getActualColor(dataset.pointBackgroundColor);
                    handleResetStyle(chart, actualColor);

                    chart.options.scales.x.min = goToX - zoomRangeX;
                    chart.options.scales.x.max = goToX + zoomRangeX;
                    chart.update();
                });
            }
        }
    };

    const handleYMinMax = (both = false) => {
        if (chartRef.current && yMin !== null && yMax !== null) {
            if ((minYValue <= yMin <= maxYValue) && (minYValue <= yMax <= maxYValue) && (yMin <= yMax)) {

                const charts = both ? Object.values(ChartJS.instances).filter(chart => chart?.config?.options?.label === "spectrum") : [chartRef.current];
                charts.forEach(chart => {
                    handleResetZoom(chart);
                    const dataset = chart.data.datasets[0];
                    let actualColor = getActualColor(dataset.pointBackgroundColor);
                    handleResetStyle(chart, actualColor);

                    console.log(dataset.pointBackgroundColor)

                    dataset.pointBackgroundColor = dataset.data.map(({ y }) => {
                        return y >= yMin && y <= yMax ? actualColor : 'gray'
                    }
                    );

                    dataset.pointBorderColor = dataset.data.map(({ y }) => {
                        return y >= yMin && y <= yMax ? actualColor : 'gray'
                    });


                    dataset.segment = {
                        borderColor: ({ p0, p1 }) => {
                            const y0 = p0.parsed.y;
                            const y1 = p1.parsed.y;
                            return (y0 >= yMin && y0 <= yMax && y1 >= yMin && y1 <= yMax)
                                ? actualColor
                                : 'gray';
                        },
                        backgroundColor: ({ p0, p1 }) => {
                            const y0 = p0.parsed.y;
                            const y1 = p1.parsed.y;
                            return (y0 >= yMin && y0 <= yMax && y1 >= yMin && y1 <= yMax)
                                ? actualColor
                                : 'gray';
                        }
                    };

                    chart.options.scales.y.min = yMin - zoomRangeY;
                    chart.options.scales.y.max = yMax + zoomRangeX;
                    chart.update();

                });

            }
        }
    };

    return (
        <div className="text-center py-4">
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
                                <Button size="xs" onClick={() => handleGoToX(false)}>Go</Button>
                                <Button size="xs" onClick={() => handleGoToX(true)}>Both</Button>
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
                                <Button size="xs" onClick={() => handleYMinMax(false)}>Go</Button>
                                <Button size="xs" onClick={() => handleYMinMax(true)}>Both</Button>
                            </div>
                        </Group>
                    </div>

                    <button
                        onClick={() => handleResetStyle(chartRef.current)}
                        className="flex items-center gap-2 px-4 py-1 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white text-sm"
                    >
                        <FaSearch /> Reset Style
                    </button>
                </div>
            )}
        </div>
    );
});

export default SpectrumChart;
