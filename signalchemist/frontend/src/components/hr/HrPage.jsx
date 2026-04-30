import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { usePapaParse } from "react-papaparse";
import {
  FaHeartbeat,
  FaSignal,
  FaTable,
  FaTools,
} from "react-icons/fa";
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
  getDefaultHeartRateMethod,
  requestHeartRateAnalysis,
} from "./hrShared";

const fieldClass =
  "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500";

const HeartRateTable = ({ rows }) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const paginatedRows = rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [rows]);

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
                HR
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr
                key={`${row[0]}-${index}`}
                className="border border-gray-200 odd:bg-white even:bg-gray-100 dark:border-gray-600 dark:odd:bg-gray-800 dark:even:bg-gray-700"
              >
                <td className="border border-gray-200 px-3 py-2 text-black dark:border-gray-600 dark:text-white">
                  {(page - 1) * rowsPerPage + index + 1}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-black dark:border-gray-600 dark:text-white">
                  {row[0].toFixed(4)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-black dark:border-gray-600 dark:text-white">
                  {row[1].toFixed(4)}
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

const HrPage = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } =
    location.state || {};
  const { readString } = usePapaParse();

  const [isRequesting, setIsRequesting] = useState(false);
  const [chartDataOriginal, setChartDataOriginal] = useState(null);
  const [heartRateTable, setHeartRateTable] = useState(null);
  const [beatCount, setBeatCount] = useState(0);
  const [method, setMethod] = useState(getDefaultHeartRateMethod());

  const isPpg = signalType === "PPG";

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

  const requestHeartRate = async () => {
    if (!chartDataOriginal || !isPpg) {
      return;
    }

    setIsRequesting(true);

    try {
      const result = await requestHeartRateAnalysis({
        signal: chartDataOriginal.slice(1),
        samplingRate,
        signalType,
        method,
      });

      setHeartRateTable([["Timestamp", "Heart Rate"], ...result.data]);
      setBeatCount(result.beatCount);
    } catch (error) {
      setHeartRateTable(null);
      setBeatCount(0);
      console.error(error.message);
      toast.error(error.message || "Error computing heart rate.");
    } finally {
      setIsRequesting(false);
    }
  };

  const heartRateRows = useMemo(
    () => (heartRateTable ? heartRateTable.slice(1) : []),
    [heartRateTable]
  );

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaHeartbeat />}
        title="Heart Rate"
        description="Estimate heart rate from a PPG signal."
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
          description="Select the heart rate algorithm."
          icon={<FaTools />}
          className="xl:sticky xl:top-4 xl:self-start"
        >
          <WorkspaceInnerCard>
            <div className="space-y-4">
              {!isPpg ? (
                <div className="rounded-[1rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  Heart rate analysis is only available for PPG signals.
                </div>
              ) : null}

              <div>
                <FormFieldLabel
                  htmlFor="heartRateMethod"
                  label="Method"
                  tooltip="Choose between the EmotiBit-style beat-to-beat estimate and NeuroKit's PPG rate pipeline."
                />
                <select
                  id="heartRateMethod"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  className={fieldClass}
                >
                  <option value="emotibit">EmotiBit</option>
                  <option value="neurokit">NeuroKit</option>
                </select>
              </div>

              <WorkspacePrimaryButton
                className="w-full"
                onClick={requestHeartRate}
                disabled={!isPpg || !chartDataOriginal}
              >
                <FaHeartbeat />
                Compute heart rate
              </WorkspacePrimaryButton>
            </div>
          </WorkspaceInnerCard>
        </WorkspaceCard>

        <WorkspaceCard
          title="Heart Rate Series"
          description="Computed heart rate values."
          icon={<FaTable />}
        >
          {isRequesting ? (
            <LoaderMessage message="Processing request..." />
          ) : heartRateRows.length ? (
            <div className="space-y-4">
              <div className="rounded-[1rem] bg-slate-50/80 p-4 text-sm text-slate-700 dark:bg-gray-950/60 dark:text-slate-200">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Beats used
                </p>
                <p className="mt-1 text-2xl font-semibold">{beatCount}</p>
              </div>
              <HeartRateTable rows={heartRateRows} />
            </div>
          ) : (
            <WorkspaceEmptyState message="Run heart rate analysis to see the result." />
          )}
        </WorkspaceCard>
      </WorkspaceSection>

      <WorkspaceSection>
        <WorkspaceCard
          title="Heart Rate Chart"
          description="Computed heart rate over time."
          icon={<FaHeartbeat />}
        >
          {heartRateTable ? (
            <CustomChart table={heartRateTable} defaultColor="#ef4444" />
          ) : (
            <WorkspaceEmptyState message="No chart available" />
          )}
        </WorkspaceCard>
      </WorkspaceSection>
    </WorkspacePage>
  );
};

HeartRateTable.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.number)
  ).isRequired,
};

export default HrPage;
