import { memo, useContext, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { fft, util as fftUtil } from "fft-js";
import ReactECharts from "echarts-for-react";
import { Button, Group, Menu, NumberInput, Tooltip } from "@mantine/core";
import { FaCircleNotch, FaDownload, FaImage, FaSearch } from "react-icons/fa";

import { ThemeContext } from "../../contexts/ThemeContext";
import { average, diff } from "../utils/dataUtils";
import { exportToPNG, handleResetStyle, handleResetZoom } from "../utils/chartUtils";
import { ChartFrame } from "./chartShell";
import { toRgba } from "./echartsBridge";

const MAX_DATA_LENGTH = 5000;
const chartActionButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800";
const chartInputClassNames = {
  input:
    "h-7 rounded-full border-slate-300 bg-white px-2.5 text-[10px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:placeholder:text-slate-500",
};

function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function padToPowerOfTwo(signal) {
  const desiredLength = nextPowerOfTwo(signal.length);
  return signal.concat(Array(desiredLength - signal.length).fill(0));
}

function processFFT(table) {
  const signal = table.slice(1).map((row) => row[1]);
  const timestamps = table.slice(1).map((row) => row[0]);
  const samplingRate = 1 / average(diff(timestamps));
  const padded = padToPowerOfTwo(signal);
  const phasors = fft(padded);
  const frequencies = fftUtil.fftFreq(phasors, samplingRate);
  const magnitudes = fftUtil.fftMag(phasors);
  return frequencies.map((x, index) => [x, magnitudes[index]]);
}

const ComparisonSpectrumChart = memo(({ table1, table2, name2, name1 = "Original" }) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.isDarkMode ?? false;
  const chartComponentRef = useRef(null);
  const bridgeRef = useRef(null);
  const [goToX, setGoToX] = useState(null);
  const [yMin, setYMin] = useState(null);
  const [yMax, setYMax] = useState(null);
  const [xWindow, setXWindow] = useState(null);
  const [yWindow, setYWindow] = useState(null);
  const [selectedA, setSelectedA] = useState([]);
  const [selectedB, setSelectedB] = useState([]);

  const dataset1 = useMemo(() => processFFT(table1), [table1]);
  const dataset2 = useMemo(() => processFFT(table2), [table2]);
  const isLargeDataset = dataset1.length > MAX_DATA_LENGTH || dataset2.length > MAX_DATA_LENGTH;
  const allX = [...dataset1, ...dataset2].map(([x]) => x);
  const allY = [...dataset1, ...dataset2].map(([, y]) => y);
  const minXValue = Math.min(...allX);
  const maxXValue = Math.max(...allX);
  const minYValue = Math.min(...allY);
  const maxYValue = Math.max(...allY);
  const zoomRangeX = (maxXValue - minXValue) * 0.02;
  const option = useMemo(() => {
    const axisColor = isDark ? "#94a3b8" : "#475569";
    const axisLineColor = isDark ? "#475569" : "#94a3b8";
    const splitLineColor = isDark ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.28)";
    const tooltipBackground = isDark ? "#020617" : "#ffffff";
    const tooltipBorder = isDark ? "#334155" : "#cbd5e1";
    const tooltipText = isDark ? "#e2e8f0" : "#0f172a";

    return {
      animation: false,
      backgroundColor: "transparent",
      grid: { left: 64, right: 24, top: 32, bottom: 56 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: "#f97316", width: 1 } },
        backgroundColor: tooltipBackground,
        borderColor: tooltipBorder,
        borderWidth: 1,
        textStyle: { color: tooltipText },
      },
      legend: {
        show: true,
        top: 0,
        right: 8,
        textStyle: { color: axisColor, fontSize: 11 },
      },
      xAxis: {
        type: "value",
        min: xWindow?.[0],
        max: xWindow?.[1],
        splitNumber: 6,
        axisLine: { lineStyle: { color: axisLineColor, width: 1 } },
        axisTick: { show: true, length: 6, lineStyle: { color: axisLineColor } },
        axisLabel: { color: axisColor, margin: 12 },
        splitLine: { show: true, lineStyle: { color: splitLineColor } },
        name: "Frequency (Hz)",
        nameLocation: "middle",
        nameGap: 34,
        nameTextStyle: { color: axisColor, fontSize: 12, fontWeight: 500 },
      },
      yAxis: {
        type: "value",
        min: yWindow?.[0],
        max: yWindow?.[1],
        splitNumber: 6,
        axisLine: { lineStyle: { color: axisLineColor, width: 1 } },
        axisTick: { show: true, length: 6, lineStyle: { color: axisLineColor } },
        axisLabel: { color: axisColor, margin: 10 },
        splitLine: { show: true, lineStyle: { color: splitLineColor } },
        name: "Amplitude",
        nameLocation: "middle",
        nameGap: 46,
        nameTextStyle: { color: axisColor, fontSize: 12, fontWeight: 500 },
      },
      dataZoom: isLargeDataset ? [] : [{ type: "inside", xAxisIndex: 0, filterMode: "none" }],
      series: [
        {
          name: name1,
          type: "line",
          data: dataset1,
          showSymbol: false,
          smooth: 0.05,
          lineStyle: { color: "#38bdf8", width: 2.2 },
          areaStyle: { color: toRgba("#38bdf8", isDark ? 0.03 : 0.07) },
        },
        {
          name: name2,
          type: "line",
          data: dataset2,
          showSymbol: false,
          smooth: 0.05,
          lineStyle: { color: "#34d399", width: 2.2 },
          areaStyle: { color: toRgba("#34d399", isDark ? 0.02 : 0.06) },
        },
        {
          type: "scatter",
          data: selectedA,
          symbolSize: 7,
          itemStyle: { color: "#f97316" },
          silent: true,
        },
        {
          type: "scatter",
          data: selectedB,
          symbolSize: 7,
          itemStyle: { color: "#f97316" },
          silent: true,
        },
      ],
    };
  }, [dataset1, dataset2, isDark, isLargeDataset, name1, name2, selectedA, selectedB, xWindow, yWindow]);

  bridgeRef.current = {
    __kind: "echarts",
    toBase64Image: () =>
      chartComponentRef.current
        ?.getEchartsInstance()
        ?.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: isDark ? "#020617" : "#ffffff" }),
    resetZoom: () => {
      setXWindow(null);
      setYWindow(null);
    },
    resetStyle: () => {
      setSelectedA([]);
      setSelectedB([]);
    },
  };

  const handleGoToX = () => {
    if (goToX === null || goToX < minXValue || goToX > maxXValue) return;
    handleResetZoom(bridgeRef.current);
    setXWindow([goToX - zoomRangeX, goToX + zoomRangeX]);
    setSelectedA(dataset1.filter(([x]) => Math.abs(x - goToX) <= zoomRangeX));
    setSelectedB(dataset2.filter(([x]) => Math.abs(x - goToX) <= zoomRangeX));
  };

  const handleYMinMax = () => {
    if (
      yMin === null ||
      yMax === null ||
      yMin > yMax ||
      yMin < minYValue ||
      yMax > maxYValue
    ) {
      return;
    }
    handleResetZoom(bridgeRef.current);
    const zoomRangeY = (yMax - yMin) * 0.02;
    setYWindow([yMin - zoomRangeY, yMax + zoomRangeY]);
    setSelectedA(dataset1.filter(([, y]) => y >= yMin && y <= yMax));
    setSelectedB(dataset2.filter(([, y]) => y >= yMin && y <= yMax));
  };

  return (
    <ChartFrame
      badge="Spectrum Compare"
      title={`${name1} / ${name2}`}
      toolbar={
        <div className="flex items-center gap-2">
          {!isLargeDataset ? (
            <>
              <button onClick={() => handleResetZoom(bridgeRef.current)} className={chartActionButtonClass}>
                <FaSearch /> Reset Zoom
              </button>
              <button onClick={() => handleResetStyle(bridgeRef.current, "#38bdf8")} className={chartActionButtonClass}>
                <FaCircleNotch /> Reset Style
              </button>
            </>
          ) : null}
          <Menu shadow="md" width={100}>
            <Menu.Target>
              <Button size="xs" variant="subtle" aria-label="export" className="rounded-full border border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800">
                <FaDownload size={12} />
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Export as</Menu.Label>
              <Menu.Item leftSection={<FaImage size={12} />} onClick={() => exportToPNG(bridgeRef.current)}>
                PNG
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      }
      canvas={
        <div className="relative min-h-[360px] overflow-hidden rounded-[0.7rem] border border-slate-200 bg-white p-1 dark:border-gray-800 dark:bg-slate-950">
          <ReactECharts ref={chartComponentRef} option={option} notMerge lazyUpdate style={{ height: 360, width: "100%" }} />
        </div>
      }
      notice={
        isLargeDataset ? (
          <>
            Large dataset. Interaction off.
          </>
        ) : null
      }
      controls={
        isLargeDataset ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Export is still available.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex min-w-max flex-nowrap items-center justify-end gap-2">
              <Tooltip label="Focus the comparison around one frequency value." withArrow>
                <div className="flex flex-nowrap items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    X Focus
                  </span>
                  <Group gap={6} wrap="nowrap">
                    <NumberInput placeholder="Go to X" size="xs" style={{ width: 82 }} classNames={chartInputClassNames} hideControls step={0.001} precision={3} min={minXValue} max={maxXValue} onChange={(value) => setGoToX(value)} />
                    <Button size="compact-xs" radius="xl" onClick={handleGoToX} aria-label="go-x">Go</Button>
                  </Group>
                </div>
              </Tooltip>
              <Tooltip label="Highlight and zoom the comparison around an amplitude band." withArrow>
                <div className="flex flex-nowrap items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Y Band
                  </span>
                  <Group gap={6} wrap="nowrap">
                    <NumberInput placeholder="Y min" size="xs" style={{ width: 70 }} classNames={chartInputClassNames} hideControls precision={3} step={0.001} min={-Infinity} max={Infinity} onChange={(value) => setYMin(value)} />
                    <NumberInput placeholder="Y max" size="xs" style={{ width: 70 }} classNames={chartInputClassNames} hideControls precision={3} step={0.001} min={-Infinity} max={Infinity} onChange={(value) => setYMax(value)} />
                    <Button size="compact-xs" radius="xl" onClick={handleYMinMax} aria-label="go-y">Go</Button>
                  </Group>
                </div>
              </Tooltip>
            </div>
          </div>
        )
      }
    />
  );
});

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
