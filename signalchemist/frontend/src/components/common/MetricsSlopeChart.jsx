import { memo, useMemo } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { ChartFrame } from "./chartShell";

const IMPROVED_COLOR = "#059669";
const WORSE_COLOR = "#e11d48";
const NEUTRAL_COLOR = "#64748b";

const formatMetricValue = (value) => value.toFixed(4);
const hasNumericValue = (value) => typeof value === "number" && !Number.isNaN(value);

const getTrendColor = (trend) => {
  if (trend?.key === "improved") {
    return IMPROVED_COLOR;
  }
  if (trend?.key === "worse") {
    return WORSE_COLOR;
  }
  return NEUTRAL_COLOR;
};

const getMetricPointPositions = (originalValue, processedValue) => {
  const chartTop = 12;
  const chartBottom = 60;
  const midpoint = (chartTop + chartBottom) / 2;

  if (!hasNumericValue(processedValue)) {
    return { originalY: midpoint, processedY: midpoint };
  }

  if (originalValue === processedValue) {
    return { originalY: midpoint, processedY: midpoint };
  }

  const minValue = Math.min(originalValue, processedValue);
  const maxValue = Math.max(originalValue, processedValue);
  const range = maxValue - minValue;

  const mapValue = (value) =>
    chartBottom - ((value - minValue) / range) * (chartBottom - chartTop);

  return {
    originalY: mapValue(originalValue),
    processedY: mapValue(processedValue),
  };
};

const MetricsSlopeRow = ({ entry, trend, t }) => {
  const tone = getTrendColor(trend);
  const TrendIcon = trend?.icon;
  const hasProcessedValue = hasNumericValue(entry.processedValue);
  const { originalY, processedY } = getMetricPointPositions(
    entry.originalValue,
    entry.processedValue
  );

  return (
    <article className="mx-auto w-full max-w-[780px] border-b border-slate-200/80 py-3 last:border-b-0 dark:border-gray-800/80">
      <div className="min-w-0">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.55)] dark:shadow-[0_0_0_4px_rgba(2,6,23,0.55)]"
            style={{ backgroundColor: tone }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 text-[13px] font-semibold text-slate-900 dark:text-white">
                {entry.label}
              </h3>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2">
                <span className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-400">
                  {entry.preferenceLabel}
                </span>
                {trend ? (
                  <span
                    className={`inline-flex whitespace-nowrap items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${trend.className}`}
                  >
                    {TrendIcon ? <TrendIcon size={10} /> : null}
                    {trend.label}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        {entry.description ? (
          <p className="mt-2 max-w-2xl text-[11px] leading-4 text-slate-500 dark:text-slate-400">
            {entry.description}
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-[minmax(0,0.88fr)_148px_minmax(0,0.88fr)] lg:items-center">
        <div className="px-1 py-1.5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("metrics.originalShort")}
          </p>
          <p className="mt-1.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatMetricValue(entry.originalValue)}
          </p>
        </div>

        <div className="rounded-[0.9rem] border border-slate-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-slate-950">
          <svg
            viewBox="0 0 120 72"
            className="block h-[52px] w-full"
            aria-label={`${entry.label} slope`}
          >
            <line
              x1="12"
              y1="8"
              x2="12"
              y2="64"
              stroke="rgba(148,163,184,0.38)"
              strokeWidth="1"
            />
            <line
              x1="108"
              y1="8"
              x2="108"
              y2="64"
              stroke="rgba(148,163,184,0.38)"
              strokeWidth="1"
            />
            <line
              x1="12"
              y1={originalY}
              x2="108"
              y2={processedY}
              stroke={hasProcessedValue ? tone : "rgba(148,163,184,0.35)"}
              strokeWidth={hasProcessedValue ? "4" : "2"}
              strokeLinecap="round"
              strokeDasharray={hasProcessedValue ? undefined : "5 6"}
            />
            <circle
              cx="12"
              cy={originalY}
              r="6.5"
              fill={tone}
              stroke="white"
              strokeWidth="2.5"
            />
            {hasProcessedValue ? (
              <circle
                cx="108"
                cy={processedY}
                r="6.5"
                fill={tone}
                stroke="white"
                strokeWidth="2.5"
              />
            ) : (
              <circle
                cx="108"
                cy={processedY}
                r="6.5"
                fill="white"
                stroke="rgba(148,163,184,0.65)"
                strokeWidth="2.5"
                strokeDasharray="2 2"
              />
            )}
          </svg>
          <div className="mt-1.5 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            <span>{t("metrics.originalShort")}</span>
            <span>{t("metrics.processedShort")}</span>
          </div>
        </div>

        <div className="px-1 py-1.5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("metrics.processedShort")}
          </p>
          {hasProcessedValue ? (
            <>
              <p className="mt-1.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatMetricValue(entry.processedValue)}
              </p>
              <p
                className="mt-1.5 text-[11px] font-semibold"
                style={{ color: tone }}
              >
                {t("metrics.delta")}: {entry.deltaPrefix}{formatMetricValue(entry.delta)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-sm font-semibold text-slate-400 dark:text-slate-500">
                {t("metrics.pending")}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {t("metrics.pendingDescription")}
              </p>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

const MetricsSlopeChart = memo(({ entries, getMetricTrend, getMetricPreferenceLabel }) => {
  const { t } = useTranslation();

  const chartEntries = useMemo(
    () =>
      entries
        .filter((entry) => hasNumericValue(entry.originalValue))
        .map((entry) => {
          const hasProcessedValue = hasNumericValue(entry.processedValue);
          const trend = hasProcessedValue
            ? getMetricTrend(
                entry.preference,
                entry.processedValue,
                entry.originalValue,
                t
              )
            : null;
          const delta = hasProcessedValue
            ? entry.processedValue - entry.originalValue
            : null;

          return {
            ...entry,
            trend,
            delta,
            deltaPrefix: hasProcessedValue && delta >= 0 ? "+" : "",
            preferenceLabel: getMetricPreferenceLabel(entry.preference, t),
          };
        }),
    [entries, getMetricPreferenceLabel, getMetricTrend, t]
  );

  return (
    <div className="mx-auto w-full max-w-[920px]">
      <ChartFrame
        badge={t("charts.compareBadge")}
        title={t("metrics.comparisonTitle")}
        canvas={(
          <div className="mx-auto w-full max-w-[860px] rounded-[0.95rem] border border-slate-200/80 bg-slate-50/55 px-3 py-1 dark:border-gray-800 dark:bg-slate-900/30">
            {chartEntries.map((entry) => (
              <MetricsSlopeRow
                key={entry.id}
                entry={entry}
                trend={entry.trend}
                t={t}
              />
            ))}
          </div>
        )}
      />
    </div>
  );
});

MetricsSlopeRow.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    preferenceLabel: PropTypes.string.isRequired,
    originalValue: PropTypes.number.isRequired,
    processedValue: PropTypes.number,
    delta: PropTypes.number,
    deltaPrefix: PropTypes.string.isRequired,
  }).isRequired,
  trend: PropTypes.shape({
    key: PropTypes.string,
    icon: PropTypes.elementType,
    label: PropTypes.string,
    className: PropTypes.string,
  }),
  t: PropTypes.func.isRequired,
};

MetricsSlopeChart.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      preference: PropTypes.oneOf(["higher", "lower", "neutral"]).isRequired,
      originalValue: PropTypes.number,
      processedValue: PropTypes.number,
    })
  ).isRequired,
  getMetricTrend: PropTypes.func.isRequired,
  getMetricPreferenceLabel: PropTypes.func.isRequired,
};

export default MetricsSlopeChart;
