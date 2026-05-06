import { useContext, useState } from "react";
import PropTypes from "prop-types";
import {
  FaBalanceScale,
  FaChartLine,
  FaColumns,
  FaDownload,
  FaImage,
  FaSignal,
  FaWaveSquare,
} from "react-icons/fa";

import { ThemeContext } from "../../contexts/ThemeContext";
import {
  exportChartsSideBySidePNG,
  exportSingleChartWithTitlePNG,
} from "../utils/chartUtils";
import CustomChart from "./CustomChart";
import ComparisonChart from "./ComparisonChart";
import ComparisonSpectrumChart from "./ComparisonSpectrumChart";
import SpectrumChart from "./SpectrumChart";
import LoaderMessage from "./LoaderMessage";
import { SimpleMenu } from "./ui";

const surfaceButtonClass =
  "flex w-full items-start gap-3 rounded-[1.1rem] border px-4 py-3 text-left transition";
const selectedSurfaceButtonClass =
  "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900";
const idleSurfaceButtonClass =
  "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200 dark:hover:border-gray-600 dark:hover:bg-gray-800";
const modeButtonClass =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition";
const selectedModeButtonClass =
  "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900";
const idleModeButtonClass =
  "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-300 dark:hover:bg-gray-800";

const topViews = [
  {
    key: "signal",
    title: "Signal",
    description: "Raw and processed waveform",
    icon: <FaChartLine />,
  },
  {
    key: "spectrum",
    title: "Spectrum",
    description: "FFT and frequency comparison",
    icon: <FaWaveSquare />,
  },
];

const comparisonViews = [
  {
    key: "split",
    title: "Side by side",
    icon: <FaColumns size={13} />,
  },
  {
    key: "overlay",
    title: "Compare",
    icon: <FaBalanceScale size={13} />,
  },
];

const ViewFrame = ({ title, icon, children }) => (
  <section>
    <div className="mb-3 flex items-center justify-center gap-2 text-center">
      <div className="text-sm text-cyan-600 dark:text-cyan-300">{icon}</div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
    </div>
    {children}
  </section>
);

const EmptyState = ({ message }) => (
  <div className="flex min-h-[240px] items-center justify-center rounded-[1.25rem] bg-slate-50 px-6 py-8 text-center text-sm text-slate-500 dark:bg-gray-900 dark:text-slate-400">
    {message}
  </div>
);

const ProcessedContent = ({
  isRequesting,
  chartDataProcessed,
  rightTitle,
  children,
}) => {
  if (isRequesting) {
    return <LoaderMessage message="Processing request..." />;
  }

  if (chartDataProcessed) {
    return children;
  }

  return (
    <EmptyState
      message={`Please run processing to see ${rightTitle.toLowerCase()} results.`}
    />
  );
};

const SignalTabs = ({
  rightTitle,
  rightIcon,
  chartDataOriginal,
  chartDataProcessed,
  processedAnnotationPoints = [],
  isRequesting = false,
}) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.isDarkMode ?? false;
  const [analysisView, setAnalysisView] = useState("signal");
  const [comparisonView, setComparisonView] = useState("split");
  const [originalBridge, setOriginalBridge] = useState(null);
  const [processedBridge, setProcessedBridge] = useState(null);

  const isSpectrum = analysisView === "spectrum";
  const renderOriginal = (data) =>
    isSpectrum ? (
      <SpectrumChart table={data} onBridgeReady={setOriginalBridge} />
    ) : (
      <CustomChart table={data} onBridgeReady={setOriginalBridge} />
    );
  const renderProcessed = (data) =>
    isSpectrum ? (
      <SpectrumChart
        table={data}
        defaultColor="#10b981"
        onBridgeReady={setProcessedBridge}
      />
    ) : (
      <CustomChart
        table={data}
        defaultColor="#10b981"
        annotationPoints={processedAnnotationPoints}
        onBridgeReady={setProcessedBridge}
      />
    );
  const renderComparison = (originalData, processedData) =>
    isSpectrum ? (
      <ComparisonSpectrumChart
        table1={originalData}
        table2={processedData}
        name2={rightTitle}
      />
    ) : (
      <ComparisonChart
        table1={originalData}
        table2={processedData}
        name2={rightTitle}
      />
    );

  return (
    <div className="space-y-5">
      <div className="p-1">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="grid gap-3 md:grid-cols-2">
            {topViews.map((view) => {
              const isSelected = analysisView === view.key;
              return (
                <button
                  key={view.key}
                  type="button"
                  onClick={() => setAnalysisView(view.key)}
                  className={`${surfaceButtonClass} ${isSelected ? selectedSurfaceButtonClass : idleSurfaceButtonClass}`}
                >
                  <div className="pt-0.5 text-base">{view.icon}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{view.title}</div>
                    <div className={`mt-1 text-xs ${isSelected ? "text-white/80 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"}`}>
                      {view.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex w-fit rounded-full border border-slate-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-950">
              {comparisonViews.map((view) => {
                const isSelected = comparisonView === view.key;
                return (
                  <button
                    key={view.key}
                    type="button"
                    onClick={() => setComparisonView(view.key)}
                    className={`${modeButtonClass} ${isSelected ? selectedModeButtonClass : idleModeButtonClass}`}
                  >
                    {view.icon}
                    {view.title}
                  </button>
                );
              })}
            </div>

            {comparisonView === "split" && chartDataOriginal && chartDataProcessed ? (
              <SimpleMenu
                widthClass="w-60"
                label="Export"
                trigger={(
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-300 dark:hover:bg-gray-800"
                  >
                    <FaDownload size={12} />
                    Export
                  </button>
                )}
                items={[
                  {
                    label: isSpectrum ? "Original spectrum" : "Original signal",
                    icon: <FaImage size={12} />,
                    onClick: async () => {
                      await exportSingleChartWithTitlePNG({
                        chart: originalBridge,
                        title: isSpectrum ? "Original Spectrum" : "Original Signal",
                        filename: isSpectrum ? "original-spectrum.png" : "original-signal.png",
                        backgroundColor: isDark ? "#020617" : "#ffffff",
                        foregroundColor: isDark ? "#e2e8f0" : "#0f172a",
                      });
                    },
                  },
                  {
                    label: isSpectrum ? `${rightTitle} spectrum` : `${rightTitle} signal`,
                    icon: <FaImage size={12} />,
                    onClick: async () => {
                      await exportSingleChartWithTitlePNG({
                        chart: processedBridge,
                        title: isSpectrum ? `${rightTitle} Spectrum` : `${rightTitle} Signal`,
                        filename: isSpectrum ? "processed-spectrum.png" : "processed-signal.png",
                        backgroundColor: isDark ? "#020617" : "#ffffff",
                        foregroundColor: isDark ? "#e2e8f0" : "#0f172a",
                      });
                    },
                  },
                  {
                    label: "Side by side",
                    icon: <FaColumns size={12} />,
                    onClick: async () => {
                      await exportChartsSideBySidePNG({
                        leftChart: originalBridge,
                        rightChart: processedBridge,
                        leftTitle: isSpectrum ? "Original Spectrum" : "Original Signal",
                        rightTitle: isSpectrum ? `${rightTitle} Spectrum` : `${rightTitle} Signal`,
                        filename: isSpectrum
                          ? "comparison-spectrum-side-by-side.png"
                          : "comparison-signal-side-by-side.png",
                        backgroundColor: isDark ? "#020617" : "#ffffff",
                        foregroundColor: isDark ? "#e2e8f0" : "#0f172a",
                      });
                    },
                  },
                ]}
              />
            ) : null}
          </div>
        </div>
      </div>

      {comparisonView === "split" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ViewFrame title="Original Signal" icon={<FaSignal />}>
            {chartDataOriginal ? (
              renderOriginal(chartDataOriginal)
            ) : (
              <LoaderMessage message="Waiting for request..." />
            )}
          </ViewFrame>

          <ViewFrame title={`${rightTitle} Signal`} icon={rightIcon}>
            <ProcessedContent
              isRequesting={isRequesting}
              chartDataProcessed={chartDataProcessed}
              rightTitle={rightTitle}
            >
              {renderProcessed(chartDataProcessed)}
            </ProcessedContent>
          </ViewFrame>
        </div>
      ) : (
        <ViewFrame title="Comparison View" icon={<FaBalanceScale />}>
          <ProcessedContent
            isRequesting={isRequesting}
            chartDataProcessed={chartDataProcessed}
            rightTitle={rightTitle}
          >
            {chartDataOriginal && chartDataProcessed
              ? renderComparison(chartDataOriginal, chartDataProcessed)
              : null}
          </ProcessedContent>
        </ViewFrame>
      )}
    </div>
  );
};

ViewFrame.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.element.isRequired,
  children: PropTypes.node.isRequired,
};

EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
};

ProcessedContent.propTypes = {
  isRequesting: PropTypes.bool.isRequired,
  chartDataProcessed: PropTypes.array,
  rightTitle: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

ProcessedContent.defaultProps = {
  chartDataProcessed: null,
};

SignalTabs.propTypes = {
  rightTitle: PropTypes.string.isRequired,
  rightIcon: PropTypes.element.isRequired,
  chartDataOriginal: PropTypes.array,
  chartDataProcessed: PropTypes.array,
  processedAnnotationPoints: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.number)
  ),
  isRequesting: PropTypes.bool,
};

SignalTabs.defaultProps = {
  chartDataOriginal: null,
  chartDataProcessed: null,
  processedAnnotationPoints: [],
  isRequesting: false,
};

export default SignalTabs;
