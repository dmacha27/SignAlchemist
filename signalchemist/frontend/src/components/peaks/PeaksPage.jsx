import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { usePapaParse } from "react-papaparse";
import { FaBullseye, FaChartLine, FaSignal, FaTools } from "react-icons/fa";
import toast from "react-hot-toast";

import CustomChart from "../common/CustomChart";
import InfoTable from "../common/InfoTable";
import LoaderMessage from "../common/LoaderMessage";
import SignalSummary from "../common/SignalSummary";
import { FormFieldLabel, SimplePagination } from "../common/ui";
import {
  WorkspacePage,
  WorkspaceHero,
  WorkspaceSection,
  WorkspaceCard,
  WorkspaceInnerCard,
  WorkspaceEmptyState,
  WorkspacePrimaryButton,
} from "../workspace/WorkspaceShell";
import { buildUtilitySourceData } from "../workspace/utilityData";
import {
  buildPeakMarkers,
  getDefaultDetector,
  getDefaultMinDistance,
  requestPeaksDetection,
} from "./peaksShared";

const fieldClass =
  "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500";

const DownloadPeakIndices = ({ peaks }) => {
  const handleDownload = () => {
    const content = peaks.map((peak) => peak.index + 1).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "peaks_indices.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-[1rem] bg-slate-50/80 p-4 text-slate-900 dark:bg-gray-950/60 dark:text-white">
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        Download the row indices from the original CSV where peaks were detected.
      </p>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Download indices
        </button>
      </div>
    </div>
  );
};

const PeaksTable = ({ peaks }) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(peaks.length / rowsPerPage);
  const paginatedPeaks = peaks.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [peaks]);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead className="bg-white dark:bg-gray-800">
            <tr className="border border-gray-200 dark:border-gray-600">
              <th className="border border-gray-200 px-3 py-2 text-left text-black dark:border-gray-600 dark:text-white">
                #
              </th>
              <th className="border border-gray-200 px-3 py-2 text-left text-black dark:border-gray-600 dark:text-white">
                Time
              </th>
              <th className="border border-gray-200 px-3 py-2 text-left text-black dark:border-gray-600 dark:text-white">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedPeaks.map((peak) => (
              <tr
                key={`${peak.index}-${peak.timestamp}`}
                className="border border-gray-200 odd:bg-white even:bg-gray-100 dark:border-gray-600 dark:odd:bg-gray-800 dark:even:bg-gray-700"
              >
                <td className="border border-gray-200 px-3 py-2 text-black dark:border-gray-600 dark:text-white">
                  {peak.index + 1}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-black dark:border-gray-600 dark:text-white">
                  {peak.timestamp.toFixed(4)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-black dark:border-gray-600 dark:text-white">
                  {peak.value.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 overflow-x-auto">
          <SimplePagination page={page} onChange={setPage} totalPages={totalPages} />
        </div>
      ) : null}
    </div>
  );
};

const PeaksPage = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } =
    location.state || {};
  const { readString } = usePapaParse();

  const [isRequesting, setIsRequesting] = useState(false);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [peaks, setPeaks] = useState([]);
  const [detector, setDetector] = useState(getDefaultDetector(signalType));
  const [minDistanceSeconds, setMinDistanceSeconds] = useState(
    getDefaultMinDistance(signalType)
  );
  const [height, setHeight] = useState("");

  useEffect(() => {
    setMinDistanceSeconds(getDefaultMinDistance(signalType));
  }, [signalType]);

  useEffect(() => {
    setDetector(getDefaultDetector(signalType));
  }, [signalType]);

  useEffect(() => {
    if (!file) {
      return;
    }

    const loadOriginalData = async () => {
      try {
        const sourceData = await buildUtilitySourceData({
          file,
          readString,
          timestampColumn,
          signalValues,
          samplingRate,
        });

        setChartDataOriginal(sourceData.chartData);
      } catch (error) {
        console.error(error.message);
        toast.error(error.message);
      }
    };

    loadOriginalData();
  }, [file, readString, samplingRate, signalValues, timestampColumn]);

  const peakMarkers = useMemo(
    () => buildPeakMarkers(peaks),
    [peaks]
  );

  const requestPeaks = async () => {
    if (!chartDataOriginal) {
      return;
    }

    setIsRequesting(true);

    try {
      const detectedPeaks = await requestPeaksDetection({
        signal: chartDataOriginal.slice(1),
        samplingRate,
        detector,
        signalType,
        minDistanceSeconds,
        height,
      });

      setPeaks(detectedPeaks);
    } catch (error) {
      setPeaks([]);
      console.error("Error detecting peaks:", error);
      toast.error(error.message || "Error detecting peaks.");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaBullseye />}
        title="Peak Detection"
        description="Detect peaks in the signal."
        badge={`Signal type: ${signalType}`}
        action={<SignalSummary table={chartDataOriginal} />}
      />

      <WorkspaceSection className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.72fr)_minmax(0,0.95fr)]">
        <WorkspaceCard
          title="Original Signal"
          description="Input signal."
          icon={<FaSignal />}
        >
          {chartDataOriginal ? (
            <InfoTable table={chartDataOriginal} onlyTable={true} />
          ) : (
            <WorkspaceEmptyState message="No data available" />
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title="Settings"
          description="Detector and detection parameters."
          icon={<FaTools />}
          className="xl:sticky xl:top-4 xl:self-start"
        >
          <WorkspaceInnerCard>
            <div className="space-y-4">
              <div>
                <FormFieldLabel
                  htmlFor="peakDetector"
                  label="Detector"
                  tooltip="Choose between a more automatic NeuroKit detector or a more manual SciPy detector."
                />
                <select
                  id="peakDetector"
                  value={detector}
                  onChange={(event) => setDetector(event.target.value)}
                  className={fieldClass}
                >
                  <option value="neurokit">NeuroKit</option>
                  <option value="scipy">SciPy</option>
                </select>
              </div>

              {detector === "neurokit" ? (
                <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-gray-700 dark:bg-gray-950/60 dark:text-slate-300">
                  NeuroKit uses presets adapted to the selected signal type.
                </div>
              ) : null}

              {detector === "scipy" ? (
                <>
              <div>
                <FormFieldLabel
                  htmlFor="minDistanceSeconds"
                  label="Min distance (s)"
                  tooltip="Minimum time allowed between two detected peaks. Increase it to avoid detecting peaks that are too close together."
                />
                <input
                  id="minDistanceSeconds"
                  type="number"
                  min={0}
                  step="0.01"
                  value={minDistanceSeconds}
                  onChange={(event) => setMinDistanceSeconds(event.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <FormFieldLabel
                  htmlFor="height"
                  label="Min height"
                  tooltip="Minimum signal value required for a point to count as a peak."
                />
                <input
                  id="height"
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                  className={fieldClass}
                />
              </div>
                </>
              ) : null}

              <WorkspacePrimaryButton
                className="w-full"
                onClick={requestPeaks}
              >
                <FaBullseye />
                Detect peaks
              </WorkspacePrimaryButton>
            </div>
          </WorkspaceInnerCard>
        </WorkspaceCard>

        <WorkspaceCard
          title="Detected Peaks"
          description="Detected peaks."
          icon={<FaBullseye />}
        >
          {isRequesting ? (
            <LoaderMessage message="Processing request..." />
          ) : peaks.length ? (
            <div className="space-y-4">
              <div className="rounded-[1rem] bg-slate-50/80 p-4 text-sm text-slate-700 dark:bg-gray-950/60 dark:text-slate-200">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Peak Count
                </p>
                <p className="mt-1 text-2xl font-semibold">{peaks.length}</p>
              </div>
              <PeaksTable peaks={peaks} />
              <DownloadPeakIndices peaks={peaks} />
            </div>
          ) : (
            <WorkspaceEmptyState message="Run detection to see the result." />
          )}
        </WorkspaceCard>
      </WorkspaceSection>

      <WorkspaceSection>
        <WorkspaceCard
          title="Annotated Signal"
          description="Signal with detected peaks."
          icon={<FaChartLine />}
        >
          {chartDataOriginal ? (
            <CustomChart
              table={chartDataOriginal}
              annotationPoints={peakMarkers}
              annotationColor="#f97316"
            />
          ) : (
            <WorkspaceEmptyState message="No chart available" />
          )}
        </WorkspaceCard>
      </WorkspaceSection>
    </WorkspacePage>
  );
};

export default PeaksPage;

PeaksTable.propTypes = {
  peaks: PropTypes.arrayOf(
    PropTypes.shape({
      index: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
};

DownloadPeakIndices.propTypes = {
  peaks: PropTypes.arrayOf(
    PropTypes.shape({
      index: PropTypes.number.isRequired,
    })
  ).isRequired,
};
