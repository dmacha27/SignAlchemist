import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import ReactECharts from "echarts-for-react";
import { FaCrosshairs, FaDownload, FaImage, FaSearch } from "react-icons/fa";

import { ThemeContext } from "../../contexts/ThemeContext";
import {
  exportSingleChartWithTitlePNG,
  handleResetStyle,
  handleResetZoom,
  processChartHighlight,
} from "../utils/chartUtils";
import { ChartFrame } from "./chartShell";
import { getCharts, registerChart, resetEchartsZoom, toRgba, unregisterChart } from "./echartsBridge";
import { SimpleMenu } from "./ui";

const MAX_DATA_LENGTH = 5000;
const chartActionButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800";

function findClosestPointIndex(points, xValue) {
  if (!points.length || typeof xValue !== "number" || Number.isNaN(xValue)) {
    return -1;
  }

  let low = 0;
  let high = points.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const currentX = points[mid][0];

    if (currentX === xValue) {
      return mid;
    }

    if (currentX < xValue) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (low >= points.length) {
    return points.length - 1;
  }

  if (high < 0) {
    return 0;
  }

  return Math.abs(points[low][0] - xValue) < Math.abs(points[high][0] - xValue)
    ? low
    : high;
}

const CustomChart = memo(({
  table,
  defaultColor = "#2196f3",
  annotationPoints = [],
  annotationColor = "#f97316",
  onBridgeReady = null,
}) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.isDarkMode ?? false;
  const chartComponentRef = useRef(null);
  const bridgeRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [zoomWindow, setZoomWindow] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

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
        name: xAxisType === "value" ? `${headers[0]} (ms)` : `${headers[0]} (date)`,
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
  }, [annotationColor, annotations, defaultColor, focusedIndex, hasRows, headers, hoverIndex, isDark, isLargeDataset, maxX, minX, points, xAxisType, zoomWindow]);

  useEffect(() => {
    const bridge = {
      __kind: "echarts",
      group: "signal",
      exportMeta: {
        badge: "Signal",
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
        setHoverIndex(null);
      },
      showTooltip: (index) => {
        if (index < 0 || index >= points.length) return;
        setHoverIndex(index);
        const instance = chartComponentRef.current?.getEchartsInstance();
        instance?.dispatchAction({
          type: "showTip",
          seriesIndex: 0,
          dataIndex: index,
        });
      },
      showTooltipAtX: (xValue) => {
        const closestIndex = findClosestPointIndex(points, xValue);
        if (closestIndex < 0) return;

        setHoverIndex(closestIndex);
        chartComponentRef.current?.getEchartsInstance()?.dispatchAction({
          type: "showTip",
          seriesIndex: 0,
          dataIndex: closestIndex,
        });
      },
      hideTooltip: () => {
        setHoverIndex(null);
        chartComponentRef.current?.getEchartsInstance()?.dispatchAction({
          type: "hideTip",
        });
      },
      highlightPoint: (pointIndex, xvalue, _highlightColor, zoomRange, chartRef) => {
        if (points.length > MAX_DATA_LENGTH) return;
        const resolvedIndex =
          chartRef.current?.dataLength === points.length
            ? pointIndex
            : findClosestPointIndex(points, xvalue);
        if (resolvedIndex < 0 || resolvedIndex >= points.length) return;

        setFocusedIndex(resolvedIndex);
        setZoomWindow([xvalue - zoomRange, xvalue + zoomRange]);
      },
    };

    bridgeRef.current = bridge;
    onBridgeReady?.(bridge);
    registerChart("signal", bridge);

    return () => {
      onBridgeReady?.(null);
      unregisterChart("signal", bridge);
    };
  }, [headers, isDark, onBridgeReady, points]);

  const handleMouseMove = (params) => {
    const xValue =
      Array.isArray(params.value) && typeof params.value[0] === "number"
        ? params.value[0]
        : points[params.dataIndex]?.[0];
    if (typeof xValue !== "number" || Number.isNaN(xValue)) return;

    getCharts("signal").forEach((chart) => {
      if (chart !== bridgeRef.current) {
        chart.showTooltipAtX?.(xValue);
      }
    });
  };

  const handleMouseLeave = () => {
    getCharts("signal").forEach((chart) => {
      chart.hideTooltip?.();
    });
  };

  const handlePointClick = (params) => {
    if (typeof params.dataIndex !== "number") return;
    const xValue = points[params.dataIndex]?.[0];
    const charts = getCharts("signal");
    charts.forEach((chart) => {
      processChartHighlight(
        chart,
        params.dataIndex,
        xValue,
        "#f97316",
        zoomRangeX,
        { current: bridgeRef.current }
      );
    });
  };

  return (
    <ChartFrame
      badge="Signal"
      title={headers[1]}
      toolbar={
        <div className="flex items-center gap-2">
          {!isLargeDataset ? (
            <>
              <button
                onClick={() => handleResetZoom(bridgeRef.current)}
                className={chartActionButtonClass}
              >
                <FaSearch /> Reset Zoom
              </button>
              <button
                onClick={() => handleResetStyle(bridgeRef.current, defaultColor)}
                className={chartActionButtonClass}
              >
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
        <div
          className="relative min-h-[360px] overflow-hidden rounded-[0.7rem] border border-slate-200 bg-white p-1 dark:border-gray-800 dark:bg-slate-950"
          onMouseLeave={handleMouseLeave}
        >
          <ReactECharts
            ref={chartComponentRef}
            option={option}
            notMerge
            lazyUpdate
            style={{ height: 360, width: "100%" }}
            onEvents={{
              click: handlePointClick,
              mousemove: handleMouseMove,
            }}
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
