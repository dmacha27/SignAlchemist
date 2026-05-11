import { memo, useContext, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { fft, util as fftUtil } from "fft-js";
import ReactECharts from "echarts-for-react";
import { FaCrosshairs, FaDownload, FaImage, FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ThemeContext } from "../../contexts/ThemeContext";
import { average, diff } from "../utils/dataUtils";
import {
  exportSingleChartWithTitlePNG,
  handleResetStyle,
  handleResetZoom,
} from "../utils/chartUtils";
import { ChartFrame } from "./chartShell";
import { resetEchartsZoom, toRgba } from "./echartsBridge";
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
  const { t } = useTranslation();
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
        name: t("charts.frequencyHz"),
        nameLocation: "middle",
        nameGap: 34,
        nameTextStyle: { color: axisColor, fontSize: 14, fontWeight: 600 },
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
        name: t("charts.amplitude"),
        nameLocation: "middle",
        nameGap: 46,
        nameTextStyle: { color: axisColor, fontSize: 14, fontWeight: 600 },
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
  }, [dataset1, dataset2, isDark, isLargeDataset, name1, name2, selectedA, selectedB, t, xWindow, yWindow]);

  bridgeRef.current = {
    __kind: "echarts",
    exportMeta: {
      badge: t("charts.spectrumCompareBadge"),
      title: `${name1} / ${name2}`,
    },
    toBase64Image: (exportOptions = {}) =>
      chartComponentRef.current
        ?.getEchartsInstance()
        ?.getDataURL({
          type: "png",
          pixelRatio: exportOptions.pixelRatio ?? 4,
          backgroundColor:
            exportOptions.backgroundColor ?? (isDark ? "#020617" : "#ffffff"),
        }),
    resetZoom: () => {
      resetEchartsZoom(chartComponentRef.current?.getEchartsInstance?.());
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
      badge={t("charts.spectrumCompareBadge")}
      title={`${name1} / ${name2}`}
      toolbar={
        <div className="flex items-center gap-2">
          {!isLargeDataset ? (
            <>
              <button onClick={() => handleResetZoom(bridgeRef.current)} className={chartActionButtonClass}>
                <FaSearch /> {t("common.resetZoom")}
              </button>
              <button onClick={() => handleResetStyle(bridgeRef.current, "#38bdf8")} className={chartActionButtonClass}>
                <FaCrosshairs /> {t("common.resetStyle")}
              </button>
            </>
          ) : null}
          <SimpleMenu
            widthClass="w-28"
            label={t("common.exportAs")}
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
              label: t("common.png"),
              icon: <FaImage size={12} />,
              onClick: () => exportSingleChartWithTitlePNG({
                chart: bridgeRef.current,
                title: `${name1} / ${name2}`,
                filename: "comparison-spectrum-overlay.png",
                backgroundColor: isDark ? "#020617" : "#ffffff",
                foregroundColor: isDark ? "#e2e8f0" : "#0f172a",
              }),
            }]}
          />
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
            {t("charts.largeDatasetNotice")}
          </>
        ) : null
      }
      controls={
        isLargeDataset ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("charts.exportStillAvailable")}</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex min-w-max flex-nowrap items-center justify-end gap-2">
              <SimpleTooltip label={t("charts.comparisonXFocusTooltip")}>
                <div className="flex flex-nowrap items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {t("charts.xFocus")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder={t("charts.goToX")}
                      className={uiCompactInputClass}
                      style={{ width: 82 }}
                      step="0.001"
                      min={minXValue}
                      max={maxXValue}
                      onChange={(event) => setGoToX(event.target.value === "" ? null : Number(event.target.value))}
                    />
                    <button type="button" className={uiGhostButtonClass} onClick={handleGoToX} aria-label="go-x">{t("common.go")}</button>
                  </div>
                </div>
              </SimpleTooltip>
              <SimpleTooltip label={t("charts.comparisonYBandTooltip")}>
                <div className="flex flex-nowrap items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {t("charts.yBand")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder={t("charts.yMin")}
                      className={uiCompactInputClass}
                      style={{ width: 70 }}
                      step="0.001"
                      onChange={(event) => setYMin(event.target.value === "" ? null : Number(event.target.value))}
                    />
                    <input
                      type="number"
                      placeholder={t("charts.yMax")}
                      className={uiCompactInputClass}
                      style={{ width: 70 }}
                      step="0.001"
                      onChange={(event) => setYMax(event.target.value === "" ? null : Number(event.target.value))}
                    />
                    <button type="button" className={uiGhostButtonClass} onClick={handleYMinMax} aria-label="go-y">{t("common.go")}</button>
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
