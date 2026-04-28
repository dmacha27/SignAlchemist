import { memo, useContext, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import ReactECharts from "echarts-for-react";
import { Button, Menu } from "@mantine/core";
import { FaCircleNotch, FaDownload, FaImage, FaSearch } from "react-icons/fa";

import { ThemeContext } from "../../contexts/ThemeContext";
import { exportToPNG, handleResetStyle, handleResetZoom } from "../utils/chartUtils";
import { ChartFrame } from "./chartShell";
import { toRgba } from "./echartsBridge";

const MAX_DATA_LENGTH = 5000;
const chartActionButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800";

const ComparisonChart = memo(({ table1, table2, name2, name1 = "Original" }) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.isDarkMode ?? false;
  const chartComponentRef = useRef(null);
  const bridgeRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [zoomWindow, setZoomWindow] = useState(null);

  const [headers1, ...rows1] = table1;
  const rows2 = table2.slice(1);
  const points1 = useMemo(() => rows1.map(([x, y]) => [x * 1000, y]), [rows1]);
  const points2 = useMemo(() => rows2.map(([x, y]) => [x * 1000, y]), [rows2]);
  const xAxisType = rows1[0][0] === 0 && rows2[0][0] === 0 ? "value" : "time";
  const isLargeDataset = rows1.length > MAX_DATA_LENGTH || rows2.length > MAX_DATA_LENGTH;
  const minX = points1[0]?.[0] ?? 0;
  const maxX = points1[points1.length - 1]?.[0] ?? 0;
  const zoomRangeX = Math.max((maxX - minX) * 0.02, 1);

  const option = useMemo(() => {
    const focus1 = focusedIndex !== null && points1[focusedIndex] ? [points1[focusedIndex]] : [];
    const focus2 = focusedIndex !== null && points2[focusedIndex] ? [points2[focusedIndex]] : [];
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
        axisPointer: {
          type: "line",
          snap: true,
          lineStyle: { color: "#f97316", width: 1 },
        },
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
        type: xAxisType,
        min: zoomWindow?.[0],
        max: zoomWindow?.[1],
        splitNumber: 6,
        axisLine: { lineStyle: { color: axisLineColor, width: 1 } },
        axisTick: { show: true, length: 6, lineStyle: { color: axisLineColor } },
        axisLabel: { color: axisColor, margin: 12 },
        splitLine: { show: true, lineStyle: { color: splitLineColor } },
        name: xAxisType === "value" ? `${headers1[0]} (ms)` : `${headers1[0]} (date)`,
        nameLocation: "middle",
        nameGap: 34,
        nameTextStyle: { color: axisColor, fontSize: 12, fontWeight: 500 },
      },
      yAxis: {
        type: "value",
        splitNumber: 6,
        axisLine: { lineStyle: { color: axisLineColor, width: 1 } },
        axisTick: { show: true, length: 6, lineStyle: { color: axisLineColor } },
        axisLabel: { color: axisColor, margin: 10 },
        splitLine: { show: true, lineStyle: { color: splitLineColor } },
        name: headers1[1],
        nameLocation: "middle",
        nameGap: 46,
        nameTextStyle: { color: axisColor, fontSize: 12, fontWeight: 500 },
      },
      dataZoom: isLargeDataset ? [] : [{ type: "inside", xAxisIndex: 0, filterMode: "none" }],
      series: [
        {
          name: name1,
          type: "line",
          data: points1,
          showSymbol: false,
          smooth: 0.05,
          lineStyle: { color: "#38bdf8", width: 2.2 },
          areaStyle: { color: toRgba("#38bdf8", isDark ? 0.04 : 0.08) },
        },
        {
          name: name2,
          type: "line",
          data: points2,
          showSymbol: false,
          smooth: 0.05,
          lineStyle: { color: "#34d399", width: 2.2 },
          areaStyle: { color: toRgba("#34d399", isDark ? 0.03 : 0.07) },
        },
        {
          type: "scatter",
          data: focus1,
          symbolSize: 8,
          itemStyle: { color: "#f97316" },
          silent: true,
        },
        {
          type: "scatter",
          data: focus2,
          symbolSize: 8,
          itemStyle: { color: "#f97316" },
          silent: true,
        },
      ],
    };
  }, [focusedIndex, headers1, isDark, isLargeDataset, name1, name2, points1, points2, xAxisType, zoomWindow]);

  bridgeRef.current = {
    __kind: "echarts",
    toBase64Image: () =>
      chartComponentRef.current
        ?.getEchartsInstance()
        ?.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: isDark ? "#020617" : "#ffffff" }),
    resetZoom: () => setZoomWindow(null),
    resetStyle: () => setFocusedIndex(null),
  };

  const handleClick = (params) => {
    if (typeof params.dataIndex !== "number") return;
    const xValue = points1[params.dataIndex]?.[0];
    setFocusedIndex(params.dataIndex);
    setZoomWindow([xValue - zoomRangeX, xValue + zoomRangeX]);
  };

  return (
    <ChartFrame
      badge="Compare"
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
              <Button
                size="xs"
                variant="subtle"
                aria-label="export"
                className="rounded-full border border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:bg-gray-800"
              >
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
          <ReactECharts
            ref={chartComponentRef}
            option={option}
            notMerge
            lazyUpdate
            style={{ height: 360, width: "100%" }}
            onEvents={{ click: handleClick }}
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

ComparisonChart.propTypes = {
  table1: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  table2: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  name1: PropTypes.string,
  name2: PropTypes.string.isRequired,
};

export default ComparisonChart;
