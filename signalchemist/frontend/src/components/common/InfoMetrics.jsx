import { memo, useMemo } from "react";
import PropTypes from "prop-types";
import { FaArrowDown, FaArrowRight, FaArrowUp } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import LoaderMessage from "./LoaderMessage";
import MetricsSlopeChart from "./MetricsSlopeChart";

const getMetricPreference = (description = "") => {
  const normalizedDescription = description.toLowerCase();
  if (normalizedDescription.includes("higher is better")) {
    return "higher";
  }
  if (normalizedDescription.includes("lower is better")) {
    return "lower";
  }
  return "neutral";
};

const getResolvedMetricPreference = (metric) => {
  if (
    metric?.preference === "higher" ||
    metric?.preference === "lower" ||
    metric?.preference === "neutral"
  ) {
    return metric.preference;
  }

  return getMetricPreference(metric?.description ?? "");
};

const stripMetricPreferenceText = (description = "") =>
  description
    .replace(/\s*Higher is better\.?/i, "")
    .replace(/\s*Lower is better\.?/i, "")
    .trim();

const getMetricDescription = (metric, t) => {
  const metricId = metric?.metric_id;
  if (!metricId) {
    return stripMetricPreferenceText(metric?.description ?? "");
  }

  return t(`metrics.items.${metricId}.description`, {
    defaultValue: stripMetricPreferenceText(metric?.description ?? ""),
  });
};

const getMetricPreferenceLabel = (preference, t) => {
  if (preference === "higher") {
    return t("common.higherIsBetter");
  }
  if (preference === "lower") {
    return t("common.lowerIsBetter");
  }
  return t("metrics.noPreference");
};

const getMetricTrend = (preference, currentValue, originalValue, t) => {
  if (
    preference === "neutral" ||
    typeof originalValue !== "number" ||
    Number.isNaN(originalValue)
  ) {
    return null;
  }

  if (currentValue === originalValue) {
    return {
      key: "unchanged",
      icon: FaArrowRight,
      label: t("metrics.noChange"),
      className:
        "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-gray-800",
      color: "#64748b",
    };
  }

  const improved =
    preference === "higher"
      ? currentValue > originalValue
      : currentValue < originalValue;

  return improved
    ? {
        key: "improved",
        icon: preference === "higher" ? FaArrowUp : FaArrowDown,
        label: t("metrics.improved"),
        className:
          "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10",
        color: "#059669",
      }
    : {
        key: "worse",
        icon: preference === "higher" ? FaArrowDown : FaArrowUp,
        label: t("metrics.worse"),
        className:
          "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/10",
        color: "#e11d48",
      };
};

const normalizeMetricEntries = (metricsOriginal, metricsProcessed, t) => {
  const entries = [];
  const byId = new Map();

  const upsertMetric = (sourceMetrics, sourceKey) => {
    Object.entries(sourceMetrics ?? {}).forEach(([name, metric], index) => {
      const metricId = metric?.metric_id ?? `${sourceKey}:${name}`;
      const existing = byId.get(metricId);
      const nextEntry = existing ?? {
        id: metricId,
        sortOrder: `${sourceKey}-${String(index).padStart(3, "0")}`,
        label: name,
        description: getMetricDescription(metric, t),
        preference: getResolvedMetricPreference(metric),
        originalValue: undefined,
        processedValue: undefined,
      };

      nextEntry.label = nextEntry.label || name;
      nextEntry.description =
        nextEntry.description || getMetricDescription(metric, t);
      nextEntry.preference =
        nextEntry.preference || getResolvedMetricPreference(metric);

      if (sourceKey === "original") {
        nextEntry.originalValue = metric.value;
      } else {
        nextEntry.processedValue = metric.value;
      }

      if (!existing) {
        byId.set(metricId, nextEntry);
        entries.push(nextEntry);
      }
    });
  };

  upsertMetric(metricsOriginal, "original");
  upsertMetric(metricsProcessed, "processed");

  return entries.sort((left, right) => left.sortOrder.localeCompare(right.sortOrder));
};

const InfoMetrics = memo(
  ({
    metricsOriginal,
    metricsProcessed,
    isRequesting = false,
  }) => {
    const { t } = useTranslation();

    const comparisonEntries = useMemo(
      () => normalizeMetricEntries(metricsOriginal, metricsProcessed, t),
      [metricsOriginal, metricsProcessed, t]
    );

    return (() => {
      if (!metricsOriginal) {
        return <LoaderMessage message={t("metrics.calculating")} />;
      }

      if (isRequesting) {
        return <LoaderMessage message={t("common.processingRequest")} />;
      }

      return (
        <MetricsSlopeChart
          entries={comparisonEntries}
          getMetricTrend={getMetricTrend}
          getMetricPreferenceLabel={getMetricPreferenceLabel}
        />
      );
    })();
  }
);

const metricShape = PropTypes.shape({
  value: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired,
  metric_id: PropTypes.string,
  preference: PropTypes.oneOf(["higher", "lower", "neutral"]),
});

InfoMetrics.propTypes = {
  metricsOriginal: PropTypes.objectOf(metricShape),
  metricsProcessed: PropTypes.objectOf(metricShape),
  isRequesting: PropTypes.bool,
};

InfoMetrics.defaultProps = {
  metricsOriginal: null,
  metricsProcessed: null,
  isRequesting: false,
};

export default InfoMetrics;
