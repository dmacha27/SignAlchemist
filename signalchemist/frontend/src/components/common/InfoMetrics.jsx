import { memo } from "react";
import PropTypes from "prop-types";
import { FaArrowDown, FaArrowRight, FaArrowUp } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import LoaderMessage from "./LoaderMessage";
import { SimpleTooltip } from "./ui";

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

const stripMetricPreferenceText = (description = "") =>
  description
    .replace(/\s*Higher is better\.?/i, "")
    .replace(/\s*Lower is better\.?/i, "")
    .trim();

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
      icon: FaArrowRight,
      label: t("metrics.noChange"),
      className:
        "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-gray-800",
    };
  }

  const improved =
    preference === "higher"
      ? currentValue > originalValue
      : currentValue < originalValue;

  return improved
    ? {
        icon: preference === "higher" ? FaArrowUp : FaArrowDown,
        label: t("metrics.improved"),
        className:
          "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10",
      }
    : {
        icon: preference === "higher" ? FaArrowDown : FaArrowUp,
        label: t("metrics.worse"),
        className:
          "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/10",
      };
};

const MetricCards = ({ metrics, baselineMetrics = null, showTrend = false }) => {
  const { t } = useTranslation();

  return (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {Object.entries(metrics).map(([name, { value, description }], index) => (
      <SimpleTooltip
        key={name}
        label={[
          stripMetricPreferenceText(description),
          getMetricPreferenceLabel(getMetricPreference(description), t),
        ]
          .filter(Boolean)
          .join(" · ")}
      >
          <button
            type="button"
            className="rounded-[1rem] bg-slate-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800/70"
            title={description}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {name}
                </h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t("metrics.metricNumber", { index: index + 1 })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                  {value.toFixed(4)}
                </span>
                {showTrend ? (() => {
                  const trend = getMetricTrend(
                    getMetricPreference(description),
                    value,
                    baselineMetrics?.[name]?.value,
                    t
                  );

                  if (!trend) {
                    return null;
                  }

                  const TrendIcon = trend.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${trend.className}`}
                    >
                      <TrendIcon size={10} />
                      {trend.label}
                    </span>
                  );
                })() : null}
              </div>
            </div>
          </button>
      </SimpleTooltip>
    ))}
  </div>
  );
};

const MetricsPanel = ({ title, content }) => (
  <div>
    <div className="mb-4">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
    </div>
    {content}
  </div>
);

const InfoMetrics = memo(
  ({ metricsOriginal, metricsProcessed, isRequesting = false }) => {
    const { t } = useTranslation();

    return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <MetricsPanel
        title={t("metrics.originalTitle")}
        content={
          metricsOriginal ? (
            <MetricCards metrics={metricsOriginal} />
          ) : (
            <LoaderMessage message={t("metrics.calculating")} />
          )
        }
      />
      <MetricsPanel
        title={t("metrics.processedTitle")}
        content={
          isRequesting ? (
            <LoaderMessage message={t("common.processingRequest")} />
          ) : metricsProcessed ? (
            <MetricCards
              metrics={metricsProcessed}
              baselineMetrics={metricsOriginal}
              showTrend
            />
          ) : (
            <div className="rounded-[1rem] bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500 dark:bg-gray-800/70 dark:text-slate-400">
              {t("metrics.empty")}
            </div>
          )
        }
      />
    </div>
    );
  }
);

MetricCards.propTypes = {
  metrics: PropTypes.objectOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      description: PropTypes.string.isRequired,
    })
  ).isRequired,
  baselineMetrics: PropTypes.objectOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      description: PropTypes.string.isRequired,
    })
  ),
  showTrend: PropTypes.bool,
};

MetricCards.defaultProps = {
  baselineMetrics: null,
  showTrend: false,
};

MetricsPanel.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.node.isRequired,
};

InfoMetrics.propTypes = {
  metricsOriginal: PropTypes.objectOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      description: PropTypes.string.isRequired,
    })
  ),
  metricsProcessed: PropTypes.objectOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      description: PropTypes.string.isRequired,
    })
  ),
  isRequesting: PropTypes.bool,
};

InfoMetrics.defaultProps = {
  metricsOriginal: null,
  metricsProcessed: null,
  isRequesting: false,
};

export default InfoMetrics;
