import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import ReactECharts from "echarts-for-react";
import { FaCrosshairs, FaDownload, FaImage, FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ThemeContext } from "../../contexts/ThemeContext";
import {
  exportSingleChartWithTitlePNG,
  handleResetStyle,
  handleResetZoom,
} from "../utils/chartUtils";
import { ChartFrame } from "./chartShell";
import { resetEchartsZoom, toRgba } from "./echartsBridge";
import { SimpleMenu } from "./ui";

const MAX_DATA_LENGTH = 5000;
const chartActionButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800";

const CustomChart = memo(({
  table,
  defaultColor = "#2196f3",
  annotationPoints = [],
  annotationColor = "#f97316",
  onBridgeReady = null,
}) => {
  const { t } = useTranslation();
  const theme = useContext(ThemeContext);
  const isDark = theme?.isDarkMode ?? false;
  const chartComponentRef = useRef(null);
  const bridgeRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [zoomWindow, setZoomWindow] = useState(null);

  const [headers = ["time", "value"], ...rows] = table ?? [["time", "value"]];
  const points = useMemo(
    () => rows.map(([x, y]) => [x * 1000, y]),
    [rows]
  );
  const annotations = useMemo(
    () => annotationPoints.map(([x, y]) => [x * 1000, y]),
    [annotationPoints]
  );

  const hasRows = rows.length > 0;
  const xAxisType = hasRows && rows[0] && rows[0][0] === 0 ? "value" : "time";
  const isLargeDataset = rows.length > MAX_DATA_LENGTH;
  const minX = points[0]?.[0] ?? 0;
  const maxX = points[points.length - 1]?.[0] ?? 6000;
  const zoomRangeX = Math.max((maxX - minX) * 0.02, 1);

  const option = useMemo(() => {
    const highlightedPoint =
      focusedIndex !== null && points[focusedIndex]
        ? {
            coord: points[focusedIndex],
            value: points[focusedIndex][1],
          }
        : null;
    const axisColor = isDark ? "#94a3b8" : "#475569";
    const axisLineColor = isDark ? "#475569" : "#94a3b8";
    const splitLineColor = isDark ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.28)";
    const tooltipBackground = isDark ? "#020617" : "#ffffff";
    const tooltipBorder = isDark ? "#334155" : "#cbd5e1";
    const tooltipText = isDark ? "#e2e8f0" : "#0f172a";

    return {
      animation: false,
      backgroundColor: "transparent",
      grid: {
        left: 64,
        right: 24,
        top: 24,
        bottom: 56,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line",
          snap: true,
          lineStyle: {
            color: "#f97316",
            width: 1,
          },
        },
        backgroundColor: tooltipBackground,
        borderColor: tooltipBorder,
        borderWidth: 1,
        textStyle: {
          color: tooltipText,
        },
      },
      xAxis: {
        type: xAxisType,
        min: zoomWindow?.[0] ?? (hasRows ? undefined : minX),
        max: zoomWindow?.[1] ?? (hasRows ? undefined : maxX),
        splitNumber: 6,
        axisLine: {
          lineStyle: { color: axisLineColor, width: 1 },
        },
        axisTick: {
          show: true,
          length: 6,
          lineStyle: { color: axisLineColor },
        },
        axisLabel: {
          color: axisColor,
          margin: 12,
          hideOverlap: true,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: splitLineColor,
          },
        },
        name: xAxisType === "value"
          ? t("charts.millisecondsAxis", { name: headers[0] })
          : t("charts.dateAxis", { name: headers[0] }),
        nameLocation: "middle",
        nameGap: 34,
        nameTextStyle: {
          color: axisColor,
          fontSize: 12,
          fontWeight: 500,
        },
      },
      yAxis: {
        type: "value",
        min: hasRows ? undefined : 0,
        max: hasRows ? undefined : 1,
        splitNumber: 6,
        axisLine: {
          lineStyle: { color: axisLineColor, width: 1 },
        },
        axisTick: {
          show: true,
          length: 6,
          lineStyle: { color: axisLineColor },
        },
        axisLabel: {
          color: axisColor,
          margin: 10,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: splitLineColor,
          },
        },
        name: headers[1],
        nameLocation: "middle",
        nameGap: 46,
        nameTextStyle: {
          color: axisColor,
          fontSize: 12,
          fontWeight: 500,
        },
      },
      dataZoom: isLargeDataset
        ? []
        : [
            {
              type: "inside",
              xAxisIndex: 0,
              filterMode: "none",
            },
          ],
      series: [
        {
          type: "line",
          data: points,
          showSymbol: false,
          symbol: "circle",
          silent: !hasRows,
          lineStyle: {
            color: defaultColor,
            width: 2.3,
            cap: "round",
            join: "round",
            opacity: hasRows ? 1 : 0,
          },
          emphasis: {
            focus: "series",
          },
          areaStyle: {
            color: toRgba(defaultColor, isDark ? 0.08 : 0.12),
            opacity: hasRows ? 1 : 0,
          },
          smooth: 0.05,
          markPoint: highlightedPoint
            ? {
                symbol: "circle",
                symbolSize: 9,
                label: { show: false },
                itemStyle: {
                  color: "#f97316",
                  borderColor: "#fff",
                  borderWidth: 1.5,
                },
                data: [highlightedPoint],
              }
            : undefined,
        },
        {
          type: "scatter",
          data: annotations,
          symbol: "diamond",
          symbolSize: 10,
          itemStyle: {
            color: annotationColor,
            borderColor: isDark ? "#020617" : "#ffffff",
            borderWidth: 1.5,
          },
          silent: true,
        },
      ],
    };
  }, [annotationColor, annotations, defaultColor, focusedIndex, hasRows, headers, isDark, isLargeDataset, maxX, minX, points, t, xAxisType, zoomWindow]);

  useEffect(() => {
    const bridge = {
        __kind: "echarts",
      group: "signal",
      exportMeta: {
        badge: t("charts.signalBadge"),
        title: headers[1],
      },
      dataLength: points.length,
      xValues: points.map(([x]) => x),
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
        setZoomWindow(null);
      },
      resetStyle: () => {
        setFocusedIndex(null);
      },
      highlightPoint: (pointIndex, xvalue, _highlightColor, zoomRange) => {
        if (points.length > MAX_DATA_LENGTH) return;
        if (pointIndex < 0 || pointIndex >= points.length) return;
        setFocusedIndex(pointIndex);
        setZoomWindow([xvalue - zoomRange, xvalue + zoomRange]);
      },
    };

    bridgeRef.current = bridge;
    onBridgeReady?.(bridge);

    return () => {
      onBridgeReady?.(null);
    };
  }, [headers, isDark, onBridgeReady, points, t]);

  const handlePointClick = (params) => {
    if (typeof params.dataIndex !== "number") return;
    const xValue = points[params.dataIndex]?.[0];
    if (typeof xValue !== "number" || Number.isNaN(xValue)) return;

    setFocusedIndex(params.dataIndex);
    setZoomWindow([xValue - zoomRangeX, xValue + zoomRangeX]);
  };

  return (
    <ChartFrame
      badge={t("charts.signalBadge")}
      title={headers[1]}
      toolbar={
        <div className="flex items-center gap-2">
          {!isLargeDataset ? (
            <>
              <button
                onClick={() => handleResetZoom(bridgeRef.current)}
                className={chartActionButtonClass}
              >
                <FaSearch /> {t("common.resetZoom")}
              </button>
              <button
                onClick={() => handleResetStyle(bridgeRef.current, defaultColor)}
                className={chartActionButtonClass}
              >
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
                title: headers[1],
                filename: `${headers[1] || "signal"}-chart.png`,
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
            onEvents={{ click: handlePointClick }}
          />
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
        ) : null
      }
    />
  );
});

CustomChart.propTypes = {
  table: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  defaultColor: PropTypes.string,
  annotationPoints: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.number)
  ),
  annotationColor: PropTypes.string,
  onBridgeReady: PropTypes.func,
};

CustomChart.defaultProps = {
  defaultColor: "#2196f3",
  annotationPoints: [],
  annotationColor: "#f97316",
  onBridgeReady: null,
};

export default CustomChart;
