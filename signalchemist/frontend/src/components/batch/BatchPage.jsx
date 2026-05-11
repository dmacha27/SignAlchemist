import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePapaParse } from "react-papaparse";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaFileImport,
  FaLayerGroup,
  FaMagic,
  FaPlay,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { FaCircleExclamation } from "react-icons/fa6";
import toast from "react-hot-toast";

import ComparisonChart from "../common/ComparisonChart";
import DatasetConfigurationCard from "../dataset/DatasetConfigurationCard";
import PipelineSteps from "../common/PipelineSteps";
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
  buildChartPreview,
  normalizeSamplingRateInput,
  parseCsvFile,
} from "../home/homeUtils";
import {
  buildBatchTableFromDataset,
  downloadBatchResultsAsZip,
  createPipelinePreviewNodes,
  downloadTableAsCsv,
  executePipelineForDataset,
  validatePipelineDefinition,
} from "./batchShared";
import { PIPELINE_PRESETS } from "../processing/pipelinePresets";
import { SimpleMenu, uiToolbarButtonClass } from "../common/ui";

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

const QUEUE_LIST_HEIGHT_CLASS = "max-h-[148px]";
const PROGRESS_LIST_HEIGHT_CLASS = "max-h-[248px]";

const BatchPage = () => {
  const location = useLocation();
  const { t } = useTranslation();
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
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);

  const headers = datasets[0]?.headers ?? [];
  const pipelineNodes = useMemo(
    () => (pipelineDefinition ? createPipelinePreviewNodes(pipelineDefinition) : []),
    [pipelineDefinition]
  );

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
    (timestampColumn !== headers.length - 1 || Number(effectiveSamplingRate) > 0)
  );

  const completedRuns = results.filter((result) => result.status === "success").length;
  const failedRuns = results.filter((result) => result.status === "error").length;
  const hasDownloadableBatchResults = results.some(
    (result) => result.status === "success" && Array.isArray(result.outputTable)
  );
  const downloadableResultsCount = results.filter(
    (result) => result.status === "success" && Array.isArray(result.outputTable)
  ).length;
  const pendingRuns = Math.max(datasets.length - completedRuns - failedRuns, 0);
  const downloadHelpText = [
    t("pages.batch.downloadAllHelp", { ready: downloadableResultsCount }),
    pendingRuns > 0
      ? t("pages.batch.downloadAllPending", { pending: pendingRuns })
      : null,
  ].filter(Boolean).join(" ");
  const progressValue = datasets.length
    ? Math.round(((completedRuns + failedRuns) / datasets.length) * 100)
    : 0;
  const selectedDataset = datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null;
  const selectedResult = results.find((result) => result.id === selectedDatasetId) ?? null;
  const selectedPreview = useMemo(() => {
    if (!selectedDataset) {
      return null;
    }

    return buildChartPreview({
      fileRows: selectedDataset.fileRows,
      headers: selectedDataset.headers,
      timestampColumn,
      signalValues,
      samplingRate,
    });
  }, [selectedDataset, signalValues, samplingRate, timestampColumn]);
  const effectiveSamplingRate = selectedPreview?.calculatedSamplingRate ?? samplingRate;

  const selectedSourceTable = useMemo(() => {
    if (!selectedDataset || timestampColumn < 0 || signalValues === -1 || signalValues === "") {
      return null;
    }

    try {
      return buildBatchTableFromDataset({
        fileRows: selectedDataset.fileRows,
        headers: selectedDataset.headers,
        timestampColumn,
        signalValues,
        samplingRate: Number(effectiveSamplingRate),
      });
    } catch {
      return null;
    }
  }, [effectiveSamplingRate, selectedDataset, signalValues, timestampColumn]);

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
      toast.success(t("pages.batch.toasts.imported"));
    } catch (error) {
      console.error(error);
      toast.error(error.message || t("pages.batch.toasts.invalidPipeline"));
    }
  };

  const applyRecommendedPipeline = (presetKey) => {
    const preset = PIPELINE_PRESETS[presetKey];
    if (!preset) {
      return;
    }

    setPipelineDefinition(preset);
    setPipelineFilename(`${presetKey.toLowerCase()}-preset.json`);
    toast.success(t("pages.batch.toasts.presetLoaded", { preset: presetKey }));
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
      const firstDataset = parsedDatasets[0]
        ? autoConfigureDataset(parsedDatasets[0], parsedDatasets[0].name)
        : null;

      setDatasets(parsedDatasets);
      setResults([]);
      setSelectedDatasetId(parsedDatasets[0]?.id ?? null);
      setSignalType(defaultState.signalType ?? firstDataset?.signalType ?? "");
      setTimestampColumn(
        Number.isInteger(defaultState.timestampColumn)
          ? defaultState.timestampColumn
          : firstDataset?.timestampColumn ?? -1
      );
      setSignalValues(
        defaultState.signalValues ?? firstDataset?.signalValues ?? -1
      );
      setSamplingRate(defaultState.samplingRate ?? "");
      toast.success(t("pages.batch.toasts.loadedFiles", { count: parsedDatasets.length }));
    } catch (error) {
      console.error(error);
      toast.error(error.message || t("pages.batch.toasts.loadFilesError"));
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
      message: t("pages.batch.statuses.waiting"),
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
            ? { ...result, status: "running", message: t("pages.batch.statuses.executing") }
            : result
        )));

        try {
          const sourceTable = buildBatchTableFromDataset({
            fileRows: dataset.fileRows,
            headers: dataset.headers,
            timestampColumn,
            signalValues,
            samplingRate: Number(effectiveSamplingRate),
          });

          const output = await executePipelineForDataset({
            pipeline: pipelineDefinition,
            table: sourceTable,
            signalType,
            samplingRate: Number(effectiveSamplingRate),
          });

          setResults((current) => current.map((result) => (
            result.id === dataset.id
              ? {
                  ...result,
                  status: "success",
                  message: t("pages.batch.statuses.completedSteps", { count: output.stepCount }),
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
                  message: error.message || t("pages.batch.statuses.executionFailed"),
                }
              : result
          )));
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      await downloadBatchResultsAsZip(results);
      toast.success(t("pages.batch.toasts.zipDownloaded"));
    } catch (error) {
      console.error(error);
      toast.error(error.message || t("pages.batch.toasts.zipError"));
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHero
        icon={<FaLayerGroup />}
        title={t("pages.batch.title")}
        description={t("pages.batch.description")}
        badge={pipelineFilename
          ? t("common.pipelineBadgeLoaded", { filename: pipelineFilename })
          : t("common.pipelineBadgeEmpty")}
      />

      <WorkspaceSection className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
        <WorkspaceCard
          title={t("pages.batch.pipelineTitle")}
          description={t("pages.batch.pipelineDescription")}
          icon={<FaFileImport />}
          actions={(
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => pipelineInputRef.current?.click()}
                className={uiToolbarButtonClass}
              >
                <FaFileImport />
                {t("common.import")}
              </button>
              <SimpleMenu
                label={t("common.menu.recommendedPipelines")}
                widthClass="w-56"
                trigger={(
                  <button
                    type="button"
                    title={t("common.menu.recommendedPipelines")}
                    className={uiToolbarButtonClass}
                  >
                    <FaMagic />
                    {t("common.presets")}
                  </button>
                )}
                items={[
                  {
                    label: "EDA / GSR",
                    icon: <FaMagic size={12} />,
                    onClick: () => applyRecommendedPipeline("EDA"),
                  },
                  {
                    label: "PPG",
                    icon: <FaMagic size={12} />,
                    onClick: () => applyRecommendedPipeline("PPG"),
                  },
                  {
                    label: "PPG + Heart Rate",
                    icon: <FaMagic size={12} />,
                    onClick: () => applyRecommendedPipeline("PPG_HR"),
                  },
                ]}
              />
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
            <WorkspaceEmptyState message={t("pages.batch.pipelineEmpty")} />
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title={t("pages.batch.setupTitle")}
          description={t("pages.batch.setupDescription")}
          icon={<FaUpload />}
          className="xl:sticky xl:top-4 xl:self-start"
        >
          <WorkspaceInnerCard>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="batchFiles"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  {t("pages.batch.csvFiles")}
                </label>
                <input
                  id="batchFiles"
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleDatasetSelection}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <DatasetConfigurationCard
                signalType={signalType}
                timestampColumn={timestampColumn}
                signalValues={signalValues}
                samplingRate={effectiveSamplingRate}
                headers={headers}
                onSignalTypeChange={setSignalType}
                onTimestampChange={setTimestampColumn}
                onSignalValuesChange={setSignalValues}
                onSamplingRateChange={(value) =>
                  setSamplingRate(normalizeSamplingRateInput(value))
                }
                variant="embedded"
              />

              {hasHeaderMismatch ? (
                <div className="rounded-[1rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  {t("pages.batch.mismatch")}
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <WorkspacePrimaryButton onClick={handleRunBatch} disabled={!canRun || isRunning}>
                  <FaPlay />
                  {isRunning ? t("pages.batch.running") : t("pages.batch.runBatch")}
                </WorkspacePrimaryButton>
                <WorkspaceSecondaryButton
                  onClick={() => {
                    setDatasets([]);
                    setResults([]);
                    setSelectedDatasetId(null);
                    setSignalType(defaultState.signalType ?? "");
                    setTimestampColumn(
                      Number.isInteger(defaultState.timestampColumn)
                        ? defaultState.timestampColumn
                        : -1
                    );
                    setSignalValues(defaultState.signalValues ?? -1);
                    setSamplingRate(defaultState.samplingRate ?? "");
                  }}
                >
                  <FaTrash />
                  {t("pages.batch.clearFiles")}
                </WorkspaceSecondaryButton>
              </div>
            </div>
          </WorkspaceInnerCard>
        </WorkspaceCard>
      </WorkspaceSection>

      <WorkspaceSection className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <WorkspaceCard
          title={t("pages.batch.executionTitle")}
          description={t("pages.batch.executionDescription")}
          icon={<FaChartBar />}
          className="flex h-full min-h-0 flex-col overflow-hidden"
        >
          <WorkspaceInnerCard className="space-y-4">
            <div className="rounded-[1rem] border border-cyan-200 bg-cyan-50/80 p-3 dark:border-cyan-500/30 dark:bg-cyan-500/10">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cyan-950 dark:text-cyan-100">
                    {t("pages.batch.downloadProcessedZip")}
                  </p>
                  <p className="mt-1 text-xs leading-4 text-cyan-900/80 dark:text-cyan-100/80">
                    {downloadHelpText}
                  </p>
                </div>
                <WorkspaceSecondaryButton
                  onClick={handleDownloadAll}
                  disabled={!hasDownloadableBatchResults}
                  title={t("pages.batch.downloadAllTitle", {
                    count: downloadableResultsCount,
                  })}
                >
                  <FaDownload />
                  {t("pages.batch.downloadAllReady")}
                </WorkspaceSecondaryButton>
              </div>
            </div>

            <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-gray-700 dark:bg-gray-950/50">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {t("pages.batch.queue")}
                </p>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-300">
                  {t("pages.batch.filesCount", { count: datasets.length })}
                </span>
              </div>
              {datasets.length ? (
                <div className={`${QUEUE_LIST_HEIGHT_CLASS} space-y-2 overflow-y-auto pr-1`}>
                  {datasets.map((dataset, index) => (
                    <button
                      key={dataset.id}
                      type="button"
                      onClick={() => setSelectedDatasetId(dataset.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                        selectedDatasetId === dataset.id
                          ? "border-cyan-300 bg-cyan-50 dark:border-cyan-500/40 dark:bg-cyan-500/10"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {dataset.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t("pages.batch.fileNumber", { index: index + 1 })}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {t("common.rowCount", { count: dataset.fileRows.length - 1 })}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={QUEUE_LIST_HEIGHT_CLASS}>
                  <WorkspaceEmptyState message={t("pages.batch.queueEmpty")} />
                </div>
              )}
            </div>

            <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3 dark:border-gray-700 dark:bg-gray-950/50">
              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {t("pages.batch.progress")}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <span>{t("pages.batch.completed", { count: completedRuns })}</span>
                    <span>{t("pages.batch.failed", { count: failedRuns })}</span>
                  </div>
                </div>
                <ProgressBar value={progressValue} />
              </div>

              {results.length ? (
                <div className={`${PROGRESS_LIST_HEIGHT_CLASS} space-y-3 overflow-y-auto pr-1`}>
                  {results.map((result) => {
                    const StatusIcon = statusIcon[result.status];

                    return (
                      <div
                        key={result.id}
                        className={`rounded-[1rem] border bg-white p-3 transition dark:bg-gray-900 ${
                          selectedDatasetId === result.id
                            ? "border-cyan-300 shadow-sm dark:border-cyan-500/40"
                            : "border-slate-200 dark:border-gray-700"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedDatasetId(result.id)}
                          className="w-full text-left"
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
                              {t(`pages.batch.statuses.${result.status}`)}
                            </span>
                          </div>
                        </button>

                        {(result.outputRows || result.peakCount !== null || result.beatCount !== null) ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {result.outputRows ? (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-slate-950 dark:text-slate-300">
                                {t("pages.batch.outputRows", { count: result.outputRows })}
                              </span>
                            ) : null}
                            {result.peakCount !== null ? (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-slate-950 dark:text-slate-300">
                                {t("pages.batch.peaks", { count: result.peakCount })}
                              </span>
                            ) : null}
                            {result.beatCount !== null ? (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-slate-950 dark:text-slate-300">
                                {t("pages.batch.beats", { count: result.beatCount })}
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
                              <FaDownload />
                              {t("pages.batch.download")}
                            </WorkspaceSecondaryButton>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={PROGRESS_LIST_HEIGHT_CLASS}>
                  <WorkspaceEmptyState message={t("pages.batch.progressEmpty")} />
                </div>
              )}
            </div>
          </WorkspaceInnerCard>
        </WorkspaceCard>

        <WorkspaceCard
          title={t("pages.batch.inspectTitle")}
          description={t("pages.batch.inspectDescription")}
          icon={<FaChartBar />}
          className="flex h-full min-h-0 flex-col overflow-hidden"
        >
          <WorkspaceInnerCard className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            {selectedDataset ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedDataset.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("pages.batch.inspectHint")}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-300">
                  {selectedResult
                    ? t(`pages.batch.statuses.${selectedResult.status}`)
                    : t("pages.batch.statuses.queued")}
                </span>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-hidden">
              {selectedSourceTable && selectedResult?.outputTable ? (
                <ComparisonChart
                  table1={selectedSourceTable}
                  table2={selectedResult.outputTable}
                  name1={t("common.originalSignal")}
                  name2={t("common.processedSignal")}
                />
              ) : selectedDataset ? (
                <WorkspaceEmptyState message={t("pages.batch.inspectPending")} />
              ) : (
                <WorkspaceEmptyState message={t("pages.batch.inspectEmpty")} />
              )}
            </div>
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
