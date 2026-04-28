import { memo } from "react";
import PropTypes from "prop-types";
import { Popover, Text } from "@mantine/core";

import LoaderMessage from "./LoaderMessage";

const MetricCards = ({ metrics }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {Object.entries(metrics).map(([name, { value, description }], index) => (
      <Popover
        key={name}
        position="top"
        withArrow
        shadow="md"
        width={220}
        arrowSize={10}
      >
        <Popover.Target>
          <button
            type="button"
            className="rounded-[1rem] bg-slate-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {name}
                </h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Metric {index + 1}
                </p>
              </div>
              <span className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                {value.toFixed(4)}
              </span>
            </div>
          </button>
        </Popover.Target>
        <Popover.Dropdown className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white">
          <Text size="sm" className="font-semibold dark:text-white">
            {name}
          </Text>
          <Text size="xs" className="mt-1 text-slate-500 dark:text-slate-400">
            {description}
          </Text>
        </Popover.Dropdown>
      </Popover>
    ))}
  </div>
);

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
  ({ metricsOriginal, metricsProcessed, isRequesting = false }) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <MetricsPanel
        title="Original Metrics"
        content={
          metricsOriginal ? (
            <MetricCards metrics={metricsOriginal} />
          ) : (
            <LoaderMessage message="Calculating..." />
          )
        }
      />
      <MetricsPanel
        title="Processed Metrics"
        content={
          isRequesting ? (
            <LoaderMessage message="Processing request..." />
          ) : metricsProcessed ? (
            <MetricCards metrics={metricsProcessed} />
          ) : (
            <div className="rounded-[1rem] bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500 dark:bg-gray-800/70 dark:text-slate-400">
              Please run processing to see results.
            </div>
          )
        }
      />
    </div>
  )
);

MetricCards.propTypes = {
  metrics: PropTypes.objectOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      description: PropTypes.string.isRequired,
    })
  ).isRequired,
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
