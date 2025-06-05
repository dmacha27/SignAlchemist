import PropTypes from "prop-types";
import { Tabs } from "@mantine/core";
import CustomChart from "./CustomChart";
import ComparisonChart from "./ComparisonChart";
import ComparisonSpectrumChart from "./ComparisonSpectrumChart";
import SpectrumChart from "./SpectrumChart";
import {
  FaBalanceScale,
  FaColumns,
  FaExchangeAlt,
  FaSignal,
} from "react-icons/fa";
import LoaderMessage from "./LoaderMessage";

/**
 * SignalTabs component renders tabbed views to display signal charts and spectrum analysis.
 *
 * @param {Object} props
 * @param {string} props.rightTitle - The title displayed for the right panel (e.g., "Processed").
 * @param {JSX.Element} props.rightIcon - The icon displayed in the right panel header.
 * @param {Array|Object} props.chartDataOriginal - Data for the original signal chart.
 * @param {Array|Object} props.chartDataProcessed - Data for the processed signal chart.
 * @param {number} props.samplingRate - Sampling rate used for spectrum charts.
 * @param {boolean} [props.isRequesting=false] - Whether the processed data is being requested.
 */
const SignalTabs = ({
  rightTitle,
  rightIcon,
  chartDataOriginal,
  chartDataProcessed,
  samplingRate,
  isRequesting = false,
}) => {
  return (
    <Tabs color="violet" variant="pills" defaultValue="charts" className="mt-2">
      <Tabs.List justify="center">
        <Tabs.Tab value="charts" className="flex-1">
          Charts
        </Tabs.Tab>
        <Tabs.Tab value="spectrum" className="flex-1">
          Spectrum
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="charts">
        <Tabs
          color="indigo"
          variant="pills"
          defaultValue="dual"
          className="mt-2"
        >
          <Tabs.List justify="center">
            <Tabs.Tab
              value="dual"
              className="w-[140px]"
              leftSection={<FaColumns size={14} />}
            >
              Dual View
            </Tabs.Tab>
            <Tabs.Tab
              value="comparison"
              className="w-[140px]"
              leftSection={<FaExchangeAlt size={14} />}
            >
              Comparison
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="dual" pt="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
                  <FaSignal className="my-auto text-blue-500" />
                  Original Signal
                </div>
                <div className="p-4">
                  {chartDataOriginal ? (
                    <CustomChart table={chartDataOriginal} />
                  ) : (
                    <LoaderMessage message="Waiting for request..." />
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
                  {rightIcon}
                  {rightTitle} Signal
                </div>
                <div className="p-4">
                  {isRequesting ? (
                    <LoaderMessage message="Processing request..." />
                  ) : chartDataProcessed ? (
                    <CustomChart
                      table={chartDataProcessed}
                      defaultColor="#50C878"
                    />
                  ) : (
                    <div className="p-5 text-center text-gray-500 dark:text-gray-400">
                      Please run processing to see results.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="comparison" pt="md">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
                <FaBalanceScale className="my-auto text-cyan-500" />
                Comparison View
              </div>
              <div>
                {isRequesting ? (
                  <LoaderMessage message="Processing request..." />
                ) : chartDataOriginal && chartDataProcessed ? (
                  <ComparisonChart
                    table1={chartDataOriginal}
                    table2={chartDataProcessed}
                    name2={rightTitle}
                  />
                ) : (
                  <div className="p-5 text-center text-gray-500 dark:text-gray-400">
                    Please run processing to see results.
                  </div>
                )}
              </div>
            </div>
          </Tabs.Panel>
        </Tabs>
      </Tabs.Panel>

      <Tabs.Panel value="spectrum">
        <Tabs
          color="indigo"
          variant="pills"
          defaultValue="dual"
          className="mt-2"
        >
          <Tabs.List justify="center">
            <Tabs.Tab
              value="dual"
              className="w-[140px]"
              leftSection={<FaColumns size={14} />}
            >
              Dual View
            </Tabs.Tab>
            <Tabs.Tab
              value="comparison"
              className="w-[140px]"
              leftSection={<FaExchangeAlt size={14} />}
            >
              Comparison
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="dual" pt="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
                  <FaSignal className="my-auto text-blue-500" />
                  Original Signal
                </div>
                <div className="p-4">
                  {chartDataOriginal ? (
                    <SpectrumChart
                      table={chartDataOriginal}
                      samplingRate={samplingRate}
                    />
                  ) : (
                    <LoaderMessage message="Waiting for request..." />
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
                  {rightIcon}
                  {rightTitle} Signal
                </div>
                <div className="p-4">
                  {isRequesting ? (
                    <LoaderMessage message="Processing request..." />
                  ) : chartDataProcessed ? (
                    <SpectrumChart
                      table={chartDataProcessed}
                      samplingRate={samplingRate}
                      defaultColor="#50C878"
                    />
                  ) : (
                    <div className="p-5 text-center text-gray-500 dark:text-gray-400">
                      Please run processing to see results.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="comparison" pt="md">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-600 shadow-md rounded-lg">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold flex justify-center gap-2 text-black dark:text-white card-hdr-border">
                <FaBalanceScale className="my-auto text-cyan-500" />
                Comparison View
              </div>
              <div>
                {isRequesting ? (
                  <LoaderMessage message="Processing request..." />
                ) : chartDataOriginal && chartDataProcessed ? (
                  <ComparisonSpectrumChart
                    table1={chartDataOriginal}
                    table2={chartDataProcessed}
                    samplingRate={samplingRate}
                    name2={rightTitle}
                  />
                ) : (
                  <div className="p-5 text-center text-gray-500 dark:text-gray-400">
                    Please run processing to see results.
                  </div>
                )}
              </div>
            </div>
          </Tabs.Panel>
        </Tabs>
      </Tabs.Panel>
    </Tabs>
  );
};

SignalTabs.propTypes = {
  rightTitle: PropTypes.string.isRequired,
  rightIcon: PropTypes.element.isRequired,
  chartDataOriginal: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  chartDataProcessed: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  samplingRate: PropTypes.number.isRequired,
  isRequesting: PropTypes.bool.isRequired,
};

export default SignalTabs;
