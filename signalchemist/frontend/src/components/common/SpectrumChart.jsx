import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { fft, util as fftUtil } from "fft-js";
import ReactECharts from "echarts-for-react";
import { FaCrosshairs, FaDownload, FaImage, FaSearch } from "react-icons/fa";

import { ThemeContext } from "../../contexts/ThemeContext";
import { average, diff } from "../utils/dataUtils";
import {
  exportSingleChartWithTitlePNG,
  handleResetStyle,
  handleResetZoom,
} from "../utils/chartUtils";
import { ChartFrame } from "./chartShell";
import { getCharts, registerChart, resetEchartsZoom, toRgba, unregisterChart } from "./echartsBridge";
import {
  SimpleMenu,
  SimpleTooltip,
  uiCompactInputClass,
  uiGhostButtonClass,
} from "./ui";

const MAX_DATA_LENGTH = 5000;
const chartActionButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800";

function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function padToPowerOfTwo(signal) {
  const desiredLength = nextPowerOfTwo(signal.length);
  return signal.concat(Array(desiredLength - signal.length).fill(0));
}

const SpectrumChart = memo(({ table, defaultColor = "#2196f3", onBridgeReady = null }) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.isDarkMode ?? false;
  const chartComponentRef = useRef(null);
  const bridgeRef = useRef(null);
  const [goToX, setGoToX] = useState(null);
  const [yMin, setYMin] = useState(null);
  const [yMax, setYMax] = useState(null);
  const [xWindow, setXWindow] = useState(null);
  const [yWindow, setYWindow] = useState(null);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null);

  const signal = useMemo(() => table.slice(1).map((row) => row[1]), [table]);
  const timestamps = useMemo(() => table.slice(1).map((row) => row[0]), [table]);

  const { points, minXValue, maxXValue, minYValue, maxYValue, zoomRangeX } =
    useMemo(() => {
      const samplingRate = 1 / average(diff(timestamps));
      const paddedSignal = padToPowerOfTwo(signal);
      const phasors = fft(paddedSignal);
      const frequencies = fftUtil.fftFreq(phasors, samplingRate);
      const magnitudes = fftUtil.fftMag(phasors);
      const allPoints = frequencies.map((x, index) => [x, magnitudes[index]]);

      return {
        points: allPoints,
        minXValue: frequencies[0],
        maxXValue: frequencies[frequencies.length - 1],
        minYValue: Math.min(...magnitudes),
        maxYValue: Math.max(...magnitudes),
        zoomRangeX: (frequencies[frequencies.length - 1] - frequencies[0]) * 0.02,
      };
    }, [signal, timestamps]);

  const isLargeDataset = points.length > MAX_DATA_LENGTH;
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
      grid: { left: 64, right: 24, top: 24, bottom: 56 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: "#f97316", width: 1 } },
        backgroundColor: tooltipBackground,
        borderColor: tooltipBorder,
        borderWidth: 1,
        textStyle: { color: tooltipText },
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
          type: "line",
          data: points,
          showSymbol: false,
          smooth: 0.05,
          lineStyle: { color: defaultColor, width: 2.2 },
          areaStyle: { color: toRgba(defaultColor, isDark ? 0.03 : 0.08) },
        },
        {
          type: "scatter",
          data: selectedPoints,
          symbolSize: 7,
          itemStyle: { color: "#f97316" },
          silent: true,
        },
        {
          type: "scatter",
          data:
            hoverIndex !== null && points[hoverIndex]
              ? [points[hoverIndex]]
              : [],
          symbolSize: 8,
          itemStyle: {
            color: isDark ? "#f8fafc" : "#ffffff",
            borderColor: defaultColor,
            borderWidth: 2,
          },
          silent: true,
        },
      ],
    };
  }, [defaultColor, hoverIndex, isDark, isLargeDataset, points, selectedPoints, xWindow, yWindow]);

  useEffect(() => {
    const bridge = {
      __kind: "echarts",
      exportMeta: {
        badge: "Spectrum",
        title: "FFT",
      },
      toBase64Image: (exportOptions = {}) =>
        chartComponentRef.current
          ?.getEchartsInstance()
          ?.getDataURL({
            type: "png",
            pixelRatio: exportOptions.pixelRatio ?? 4,
            backgroundColor: exportOptions.backgroundColor ?? (isDark ? "#020617" : "#ffffff"),
          }),
      resetZoom: () => {
        resetEchartsZoom(chartComponentRef.current?.getEchartsInstance?.());
        setXWindow(null);
        setYWindow(null);
      },
      resetStyle: () => {
        setSelectedPoints([]);
        setHoverIndex(null);
      },
      applyXFocus: (value) => {
        setXWindow([value - zoomRangeX, value + zoomRangeX]);
        setSelectedPoints(points.filter(([x]) => Math.abs(x - value) <= zoomRangeX));
      },
      applyYBand: (min, max) => {
        const zoomRangeY = (max - min) * 0.02;
        setYWindow([min - zoomRangeY, max + zoomRangeY]);
        setSelectedPoints(points.filter(([, y]) => y >= min && y <= max));
      },
      showTooltipAtX: (xValue) => {
        const index = points.findIndex(([x]) => x >= xValue);
        const safeIndex = index === -1 ? points.length - 1 : index;
        if (safeIndex < 0) return;
        setHoverIndex(safeIndex);
        chartComponentRef.current?.getEchartsInstance()?.dispatchAction({
          type: "showTip",
          seriesIndex: 0,
          dataIndex: safeIndex,
        });
      },
      hideTooltip: () => {
        setHoverIndex(null);
        chartComponentRef.current?.getEchartsInstance()?.dispatchAction({
          type: "hideTip",
        });
      },
    };
    bridgeRef.current = bridge;
    onBridgeReady?.(bridge);
    registerChart("spectrum", bridge);

    const instance = chartComponentRef.current?.getEchartsInstance();
    const zr = instance?.getZr?.();
    const handleHoverMove = (event) => {
      if (points.length > MAX_DATA_LENGTH) return;

      const pixel = [event.offsetX, event.offsetY];
      if (!instance?.containPixel?.({ gridIndex: 0 }, pixel)) {
        getCharts("spectrum").forEach((chart) => chart.hideTooltip?.());
        return;
      }

      const axisValue = instance?.convertFromPixel?.({ xAxisIndex: 0 }, pixel);
      const xValue = Array.isArray(axisValue) ? axisValue[0] : axisValue;

      if (typeof xValue !== "number" || Number.isNaN(xValue)) return;

      getCharts("spectrum").forEach((chart) => {
        chart.showTooltipAtX?.(xValue);
      });
    };
    const handleHoverOut = () => {
      getCharts("spectrum").forEach((chart) => chart.hideTooltip?.());
    };

    zr?.on?.("mousemove", handleHoverMove);
    zr?.on?.("globalout", handleHoverOut);

    return () => {
      onBridgeReady?.(null);
      zr?.off?.("mousemove", handleHoverMove);
      zr?.off?.("globalout", handleHoverOut);
      unregisterChart("spectrum", bridge);
    };
  }, [isDark, onBridgeReady, points, zoomRangeX]);

  const handleGoToX = (both = false) => {
    if (goToX === null || goToX < minXValue || goToX > maxXValue) return;
    const charts = both ? getCharts("spectrum") : [bridgeRef.current];
    charts.forEach((chart) => {
      handleResetZoom(chart);
      handleResetStyle(chart, defaultColor);
      chart.applyXFocus(goToX);
    });
  };

  const handleYMinMax = (both = false) => {
    if (
      yMin === null ||
      yMax === null ||
      yMin > yMax ||
      yMin < minYValue ||
      yMax > maxYValue
    ) {
      return;
    }

    const charts = both ? getCharts("spectrum") : [bridgeRef.current];
    charts.forEach((chart) => {
      handleResetZoom(chart);
      handleResetStyle(chart, defaultColor);
      chart.applyYBand(yMin, yMax);
    });
  };

  return (
    <ChartFrame
      badge="Spectrum"
      title="FFT"
      toolbar={
        <div className="flex items-center gap-2">
          {!isLargeDataset ? (
            <>
              <button onClick={() => handleResetZoom(bridgeRef.current)} className={chartActionButtonClass}>
                <FaSearch /> Reset Zoom
              </button>
              <button onClick={() => handleResetStyle(bridgeRef.current, defaultColor)} className={chartActionButtonClass}>
                <FaCrosshairs /> Reset Style
              </button>
            </>
          ) : null}
          <SimpleMenu
            widthClass="w-28"
            label="Export as"
            trigger={(
              <button
                type="button"
                aria-label="export"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
              >
                <FaDownload size={12} />
              </button>
            )}
            items={[{
              label: "PNG",
              icon: <FaImage size={12} />,
              onClick: () => exportSingleChartWithTitlePNG({
                chart: bridgeRef.current,
                title: "FFT",
                filename: "spectrum-chart.png",
                backgroundColor: isDark ? "#020617" : "#ffffff",
                foregroundColor: isDark ? "#e2e8f0" : "#0f172a",
              }),
            }]}
          />
        </div>
      }
      canvas={
        <div className="relative min-h-[360px] overflow-hidden rounded-[0.7rem] border border-slate-200 bg-white p-1 dark:border-gray-800 dark:bg-slate-950">
          <ReactECharts
            ref={chartComponentRef}
            option={option}
            notMerge
            lazyUpdate
            style={{ height: 360, width: "100%" }}
          />
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
              <SimpleTooltip label="Focus the chart around one frequency value. 'Both' applies it to all spectrum views.">
                <div className="flex flex-nowrap items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    X Focus
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Go to X"
                      className={uiCompactInputClass}
                      style={{ width: 82 }}
                      step="0.001"
                      min={minXValue}
                      max={maxXValue}
                      onChange={(event) => setGoToX(event.target.value === "" ? null : Number(event.target.value))}
                    />
                    <button type="button" className={uiGhostButtonClass} onClick={() => handleGoToX()} aria-label="go-x">Go</button>
                    <button type="button" className={uiGhostButtonClass} onClick={() => handleGoToX(true)} aria-label="both-x">Both</button>
                  </div>
                </div>
              </SimpleTooltip>
              <SimpleTooltip label="Highlight a Y range and zoom around that amplitude band. 'Both' applies it to all spectrum views.">
                <div className="flex flex-nowrap items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Y Band
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Y min"
                      className={uiCompactInputClass}
                      style={{ width: 70 }}
                      step="0.001"
                      onChange={(event) => setYMin(event.target.value === "" ? null : Number(event.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="Y max"
                      className={uiCompactInputClass}
                      style={{ width: 70 }}
                      step="0.001"
                      onChange={(event) => setYMax(event.target.value === "" ? null : Number(event.target.value))}
                    />
                    <button type="button" className={uiGhostButtonClass} onClick={() => handleYMinMax()} aria-label="go-y">Go</button>
                    <button type="button" className={uiGhostButtonClass} onClick={() => handleYMinMax(true)} aria-label="both-y">Both</button>
                  </div>
                </div>
              </SimpleTooltip>
            </div>
          </div>
        )
      }
    />
  );
});

SpectrumChart.propTypes = {
  table: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  defaultColor: PropTypes.string,
  onBridgeReady: PropTypes.func,
};

export default SpectrumChart;
