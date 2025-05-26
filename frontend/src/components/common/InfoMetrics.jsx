import { memo } from "react";
import PropTypes from "prop-types";
import { Popover, Text } from "@mantine/core";
import LoaderMessage from "./LoaderMessage";

/**
 * MetricCards Component
 *
 * Renders a responsive grid of metric cards, each displaying a metric name and its formatted value.
 * On hover or click, a tooltip (Popover) is shown with additional details.
 *
 * @component
 * @param {Object} props
 * @param {Object.<string, { value: number, description: string }>} props.metrics
 */
const MetricCards = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {Object.entries(metrics).map(([name, { value, description }], index) => {
        const metricValue = value.toFixed(4);
        return (
          <div key={name} className="flex justify-center items-center">
            <Popover
              position="top"
              withArrow
              shadow="md"
              width={220}
              arrowSize={12}
              arrowRadius={3}
            >
              <Popover.Target>
                <div className="bg-white dark:bg-gray-900 shadow-xl rounded-lg p-6 cursor-pointer hover:scale-105 transform transition-all ease-in-out border-0 dark:border dark:border-gray-600">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {name}
                    </h3>
                    <div className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      <span className="text-teal-500">{metricValue}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Metric {index + 1}
                    </p>
                  </div>
                </div>
              </Popover.Target>
              <Popover.Dropdown className="bg-blue-50 dark:bg-[#1e3a8a] text-blue-600 dark:text-white rounded-lg shadow-lg text-sm p-4 border-0">
                <Text size="sm" className="font-bold text-lg dark:text-white">
                  {name}
                </Text>
                <Text
                  size="xs"
                  className="text-gray-500 dark:text-gray-400 mb-2"
                >
                  {description}
                </Text>
              </Popover.Dropdown>
            </Popover>
          </div>
        );
      })}
    </div>
  );
};

/**
 * InfoMetrics Component
 *
 * Displays two metric panels side-by-side: one for original metrics and one for processed metrics.
 *
 * @component
 * @param {Object} props
 * @param {Object.<string, { value: number, description: string }>} [props.metricsOriginal] - Metrics of the original signal.
 * @param {Object.<string, { value: number, description: string }>} [props.metricsProcessed] - Metrics of the processed signal.
 */
const InfoMetrics = memo(({ metricsOriginal, metricsProcessed }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 mt-6">
      <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg p-4">
        {metricsOriginal ? (
          <MetricCards metrics={metricsOriginal} />
        ) : (
          <LoaderMessage message="Waiting for request..." />
        )}
      </div>
      <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg p-4">
        {metricsProcessed ? (
          <MetricCards metrics={metricsProcessed} />
        ) : (
          <LoaderMessage message="Waiting for request..." />
        )}
      </div>
    </div>
  );
});

MetricCards.propTypes = {
  metrics: PropTypes.objectOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      description: PropTypes.string.isRequired,
    })
  ).isRequired,
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
};

export default InfoMetrics;
