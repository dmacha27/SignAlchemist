import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePapaParse } from "react-papaparse";
import PropTypes from "prop-types";
import {
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaFileImport,
  FaLayerGroup,
  FaPlay,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { FaCircleExclamation } from "react-icons/fa6";
import toast from "react-hot-toast";

import PipelineSteps from "../common/PipelineSteps";
import { FormFieldLabel } from "../common/ui";
import {
  WorkspaceCard,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceInnerCard,
  WorkspacePage,
  WorkspacePrimaryButton,
  WorkspaceSecondaryButton,
  WorkspaceSection,
} from "../workspace/WorkspaceShell";
import {
  autoConfigureDataset,
  NO_TIMESTAMPS_LABEL,
  parseCsvFile,
  SIGNAL_TYPE_OPTIONS,
} from "../home/homeUtils";
import {
  buildBatchTableFromDataset,
  createPipelinePreviewNodes,
  downloadTableAsCsv,
  executePipelineForDataset,
  validatePipelineDefinition,
} from "./batchShared";

const fieldClass =
  "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white";

const statusTone = {
  queued:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-300",
  running:
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
};

const statusIcon = {
  queued: FaClock,
  running: FaPlay,
  success: FaCheckCircle,
  error: FaCircleExclamation,
};

const ProgressBar = ({ value }) => (
  <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-800">
    <div
      className="h-full rounded-full bg-cyan-500 transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

const BatchPage = () => {
  const location = useLocation();
  const { readString } = usePapaParse();
  const pipelineInputRef = useRef(null);

  const defaultState = location.state || {};

  const [pipelineDefinition, setPipelineDefinition] = useState(null);
  const [pipelineFilename, setPipelineFilename] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [signalType, setSignalType] = useState(defaultState.signalType ?? "");
  const [timestampColumn, setTimestampColumn] = useState(
    Number.isInteger(defaultState.timestampColumn) ? defaultState.timestampColumn : -1
  );
  const [signalValues, setSignalValues] = useState(
    defaultState.signalValues ?? -1
  );
  const [samplingRate, setSamplingRate] = useState(defaultState.samplingRate ?? "");
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const headers = datasets[0]?.headers ?? [];
  const pipelineNodes = useMemo(
    () => (pipelineDefinition ? createPipelinePreviewNodes(pipelineDefinition) : []),
    [pipelineDefinition]
  );

  useEffect(() => {
    if (!datasets.length) {
      return;
    }

    const configuredDataset = autoConfigureDataset(datasets[0], datasets[0].name);

    setSignalType((current) => current || configuredDataset.signalType || "");
    setTimestampColumn((current) => (
      current >= 0 ? current : configuredDataset.timestampColumn
    ));
    setSignalValues((current) => (
      current !== -1 && current !== "" ? current : configuredDataset.signalValues
    ));
  }, [datasets]);

  const hasHeaderMismatch = useMemo(() => {
    if (datasets.length <= 1) {
      return false;
    }

    const firstHeaders = JSON.stringify(datasets[0].headers);
    return datasets.some((dataset) => JSON.stringify(dataset.headers) !== firstHeaders);
  }, [datasets]);

  const canRun = Boolean(
    pipelineDefinition &&
    datasets.length &&
    timestampColumn >= 0 &&
    signalValues !== -1 &&
    signalValues !== "" &&
    signalType &&
    (timestampColumn !== headers.length - 1 || Number(samplingRate) > 0)
  );

  const completedRuns = results.filter((result) => result.status === "success").length;
  const failedRuns = results.filter((result) => result.status === "error").length;
  const progressValue = datasets.length
    ? Math.round(((completedRuns + failedRuns) / datasets.length) * 100)
    : 0;

  const handlePipelineImport = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    try {
      const raw = await selectedFile.text();
      const parsed = validatePipelineDefinition(JSON.parse(raw));

      setPipelineDefinition(parsed);
      setPipelineFilename(selectedFile.name);
      toast.success("Pipeline imported");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Invalid pipeline file");
    }
  };

  const handleDatasetSelection = async (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    try {
      const parsedDatasets = await Promise.all(
        selectedFiles.map(async (file, index) => {
          const dataset = await parseCsvFile(file, readString);

          if (!dataset) {
            throw new Error(`Could not parse ${file.name}`);
          }

          return {
            ...dataset,
            id: `${file.name}-${index}`,
            name: file.name,
            file,
          };
        })
      );

      setDatasets(parsedDatasets);
      setResults([]);
      toast.success(`${parsedDatasets.length} CSV files loaded`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Could not load the selected CSV files");
    }
  };

  const handleRunBatch = async () => {
    if (!canRun || isRunning) {
      return;
    }

    const initialResults = datasets.map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      status: "queued",
      message: "Waiting to run",
      outputTable: null,
      outputRows: 0,
      peakCount: null,
      beatCount: null,
    }));

    setResults(initialResults);
    setIsRunning(true);

    try {
      for (const dataset of datasets) {
        setResults((current) => current.map((result) => (
          result.id === dataset.id
            ? { ...result, status: "running", message: "Executing pipeline..." }
            : result
        )));

        try {
          const sourceTable = buildBatchTableFromDataset({
            fileRows: dataset.fileRows,
            headers: dataset.headers,
            timestampColumn,
            signalValues,
            samplingRate: Number(samplingRate),
          });

          const output = await executePipelineForDataset({
            pipeline: pipelineDefinition,
            table: sourceTable,
            signalType,
            samplingRate: Number(samplingRate),
          });

          setResults((current) => current.map((result) => (
            result.id === dataset.id
              ? {
                  ...result,
                  status: "success",
                  message: `${output.stepCount} steps completed`,
                  outputTable: output.table,
                  outputRows: output.outputRows,
                  peakCount: output.peakCount,
                  beatCount: output.beatCount,
                }
              : result
          )));
        } catch (error) {
          setResults((current) => current.map((result) => (
            result.id === dataset.id
              ? {
                  ...result,
                  status: "error",
                  message: error.message || "Execution failed",
                }
              : result
          )));
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaLayerGroup />}
        title="Batch Processing"
        description="Import a validated pipeline, queue multiple CSV files and run them sequentially."
        badge={pipelineFilename ? `Pipeline: ${pipelineFilename}` : "Pipeline: not loaded"}
      />

      <WorkspaceSection className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
        <WorkspaceCard
          title="Pipeline"
          description="Import the JSON exported from Processing."
          icon={<FaFileImport />}
          actions={(
            <div className="flex gap-2">
              <WorkspaceSecondaryButton onClick={() => pipelineInputRef.current?.click()}>
                <FaFileImport />
                Import pipeline
              </WorkspaceSecondaryButton>
              <input
                ref={pipelineInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handlePipelineImport}
              />
            </div>
          )}
        >
          {pipelineDefinition ? (
            <WorkspaceInnerCard>
              <PipelineSteps
                nodes={pipelineNodes}
                edges={pipelineDefinition.edges}
              />
            </WorkspaceInnerCard>
          ) : (
            <WorkspaceEmptyState message="Import a pipeline JSON exported from Processing." />
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title="Batch Setup"
          description="Choose the shared dataset configuration for all files."
          icon={<FaUpload />}
          className="xl:sticky xl:top-4 xl:self-start"
        >
          <WorkspaceInnerCard>
            <div className="space-y-4">
              <div>
                <FormFieldLabel
                  htmlFor="batchFiles"
                  label="CSV files"
                  tooltip="All selected files will run with the same imported pipeline."
                />
                <input
                  id="batchFiles"
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleDatasetSelection}
                  className={fieldClass}
                />
              </div>

              <div>
                <FormFieldLabel htmlFor="batchSignalType" label="Signal Type" />
                <select
                  id="batchSignalType"
                  value={signalType}
                  onChange={(event) => setSignalType(event.target.value)}
                  className={fieldClass}
                >
                  {SIGNAL_TYPE_OPTIONS.map((option) => (
                    <option key={option || "empty"} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FormFieldLabel htmlFor="batchTimestampColumn" label="Timestamp Column" />
                <select
                  id="batchTimestampColumn"
                  value={timestampColumn}
                  onChange={(event) => setTimestampColumn(parseInt(event.target.value, 10))}
                  className={fieldClass}
                  disabled={!headers.length}
                >
                  {!headers.length ? <option value={-1}>Load CSV files first</option> : null}
                  {headers.map((header, index) => (
                    <option key={header} value={index}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FormFieldLabel htmlFor="batchSignalValues" label="Signal Values" />
                <select
                  id="batchSignalValues"
                  value={signalValues}
                  onChange={(event) => setSignalValues(event.target.value)}
                  className={fieldClass}
                  disabled={!headers.length}
                >
                  {!headers.length ? <option value={-1}>Load CSV files first</option> : null}
                  <option value={-1}></option>
                  {headers.slice(0, -1).map((header, index) => (
                    <option key={header} value={index}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FormFieldLabel
                  htmlFor="batchSamplingRate"
                  label="Sampling Rate (Hz)"
                  tooltip="Required when the files do not include timestamps."
                />
                <input
                  id="batchSamplingRate"
                  type="number"
                  min={1}
                  step={1}
                  value={samplingRate}
                  onChange={(event) => setSamplingRate(event.target.value)}
                  disabled={!headers.length || timestampColumn !== headers.length - 1}
                  className={fieldClass}
                />
              </div>

              {hasHeaderMismatch ? (
                <div className="rounded-[1rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  The selected CSV files do not all share the same headers. Batch execution assumes a common structure.
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <WorkspacePrimaryButton onClick={handleRunBatch} disabled={!canRun || isRunning}>
                  <FaPlay />
                  {isRunning ? "Running..." : "Run batch"}
                </WorkspacePrimaryButton>
                <WorkspaceSecondaryButton
                  onClick={() => {
                    setDatasets([]);
                    setResults([]);
                  }}
                >
                  <FaTrash />
                  Clear files
                </WorkspaceSecondaryButton>
              </div>
            </div>
          </WorkspaceInnerCard>
        </WorkspaceCard>
      </WorkspaceSection>

      <WorkspaceSection className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(360px,1fr)]">
        <WorkspaceCard
          title="Queue"
          description="Files ready to run with the imported pipeline."
          icon={<FaLayerGroup />}
        >
          {datasets.length ? (
            <WorkspaceInnerCard className="space-y-3">
              {datasets.map((dataset, index) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {dataset.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      File {index + 1} of {datasets.length}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-slate-950 dark:text-slate-300">
                    {dataset.fileRows.length - 1} rows
                  </span>
                </div>
              ))}
            </WorkspaceInnerCard>
          ) : (
            <WorkspaceEmptyState message="Load several CSV files to create the batch queue." />
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title="Progress"
          description="Execution status for each CSV."
          icon={<FaChartBar />}
        >
          <WorkspaceInnerCard className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span>{completedRuns} completed</span>
                <span>{failedRuns} failed</span>
              </div>
              <ProgressBar value={progressValue} />
            </div>

            {results.length ? (
              <div className="space-y-3">
                {results.map((result) => {
                  const StatusIcon = statusIcon[result.status];

                  return (
                    <div
                      key={result.id}
                      className="rounded-[1rem] border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {result.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {result.message}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone[result.status]}`}>
                          <StatusIcon size={12} />
                          {result.status}
                        </span>
                      </div>

                      {(result.outputRows || result.peakCount !== null || result.beatCount !== null) ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {result.outputRows ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-slate-950 dark:text-slate-300">
                              {result.outputRows} output rows
                            </span>
                          ) : null}
                          {result.peakCount !== null ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-slate-950 dark:text-slate-300">
                              {result.peakCount} peaks
                            </span>
                          ) : null}
                          {result.beatCount !== null ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-slate-950 dark:text-slate-300">
                              {result.beatCount} beats
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {result.status === "success" && result.outputTable ? (
                        <div className="mt-3 flex justify-end">
                          <WorkspaceSecondaryButton
                            onClick={() => downloadTableAsCsv(
                              result.outputTable,
                              `${result.name.replace(/\.csv$/i, "")}_processed.csv`
                            )}
                          >
                            <FaUpload />
                            Download output
                          </WorkspaceSecondaryButton>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <WorkspaceEmptyState message="Run the batch to see progress and download each result." />
            )}
          </WorkspaceInnerCard>
        </WorkspaceCard>
      </WorkspaceSection>
    </WorkspacePage>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
};

export default BatchPage;
