import { memo, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
import { FileUpload } from "primereact/fileupload";
import { usePapaParse } from "react-papaparse";
import RangeSlider from "react-range-slider-input";
import { FaArrowRight, FaCogs, FaFlask, FaUpload } from "react-icons/fa";
import {
  FaProjectDiagram,
  FaChartBar,
  FaChartLine,
  FaFilter,
  FaHeartbeat,
} from "react-icons/fa";

import { FaMountainSun } from "react-icons/fa6";

import CustomChart from "../common/CustomChart";
import {
  NO_TIMESTAMPS_LABEL,
  autoConfigureDataset,
  parseCsvFile,
} from "./homeUtils";
import { SimpleMenu } from "../common/ui";

const OUTER_CARD_CLASS =
  "rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-3.5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-gray-700 dark:bg-gray-900/85";
const INNER_CARD_CLASS =
  "rounded-[1.15rem] border border-slate-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900";
const QUICK_STEP_CARD_CLASS =
  "rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 dark:border-gray-700 dark:bg-gray-950 dark:text-slate-300";

const utilityItems = [
  {
    label: "Processing",
    icon: FaProjectDiagram,
    path: "/processing",
    featured: true,
    helper: "Build and validate a custom pipeline.",
  },
  {
    label: "Batch",
    icon: FaChartBar,
    path: "/batch",
    featured: true,
    alwaysEnabled: true,
    helper: "Run an exported pipeline on multiple CSV files.",
  },
  {
    label: "Resampling",
    icon: FaChartLine,
    path: "/resampling",
    helper: "Adjust the sampling rate of one signal.",
  },
  {
    label: "Filtering",
    icon: FaFilter,
    path: "/filtering",
    helper: "Apply a filter directly to the dataset.",
  },
  {
    label: "Peaks",
    icon: FaMountainSun,
    path: "/peaks",
    helper: "Detect relevant signal peaks.",
  },
  {
    label: "HR",
    icon: FaHeartbeat,
    path: "/hr",
    helper: "Estimate heart rate from PPG.",
  },
];

const StepBadge = ({ step }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
    {step}
  </span>
);

const SectionHeader = ({
  step,
  title,
  description,
  titleTag = "h2",
  aside = null,
}) => {
  const HeadingTag = titleTag;

  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0 text-left">
        <div className="flex items-center gap-2.5">
          {step ? <StepBadge step={step} /> : null}
          <HeadingTag className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </HeadingTag>
        </div>
        {description ? (
          <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      {aside}
    </div>
  );
};

export const HomeHero = ({ isDark }) => (
  <header className="rounded-[1.75rem] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur dark:border-gray-700 dark:bg-gray-950/75 md:px-6">
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
      <div>
        <img
          src={isDark ? "/logo_dark.png" : "/logo.png"}
          className="mx-auto h-10 md:h-12"
          alt="SignAlchemist Logo"
        />
        <h1 className="mt-2 text-[1.2rem] font-semibold text-slate-900 dark:text-white md:text-[1.45rem]">
          Load and prepare your dataset before processing
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-300">
          Upload a CSV, define timestamps and values, crop the visible range and
          preview the result before moving into the tools.
        </p>
        <div className="mt-3">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            About this project
            <FaArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/85 p-3 dark:border-gray-700 dark:bg-gray-900/80">
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white dark:bg-white dark:text-slate-900">
                Quick Start
              </span>
            </div>
          </div>

          <div>
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="grid gap-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Load a sample or upload your own CSV.",
                    "Configure signal type, columns and sampling rate.",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className={`${QUICK_STEP_CARD_CLASS} flex items-start gap-3`}
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-900">
                        {index + 1}
                      </span>
                      <p className="leading-5">{item}</p>
                    </div>
                  ))}
                </div>
                <div
                  className={`${QUICK_STEP_CARD_CLASS} flex items-start gap-3`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-900">
                    4
                  </span>
                  <p className="leading-5">
                    Continue with `Processing`, `Batch` or a focused utility.
                  </p>
                </div>
              </div>

              <div
                className={`${QUICK_STEP_CARD_CLASS} flex h-full items-start gap-3`}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-900">
                  3
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Inspect and crop
                  </p>
                  <p className="mt-1 leading-5">
                    Use the preview to validate the selected columns and trim
                    the working range before you continue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
);

export const CSVUploader = memo(({ onDatasetLoaded, onDatasetCleared }) => {
  const fileUploader = useRef(null);
  const { readString } = usePapaParse();

  const fileSelected = async (event) => {
    const selectedFile = event.files?.[0];
    if (!selectedFile) {
      return;
    }

    const dataset = await parseCsvFile(selectedFile, readString);
    if (dataset) {
      onDatasetLoaded(dataset);
    }
  };

  const fileRemoved = () => {
    onDatasetCleared();
  };

  const loadSampleFile = async (filename) => {
    const response = await fetch(`/${filename}`);
    const data = await response.blob();
    const sampleFile = new File([data], filename, { type: "text/csv" });
    const dataset = await parseCsvFile(sampleFile, readString);
    if (dataset) {
      onDatasetLoaded(autoConfigureDataset(dataset, filename));
    }
    fileUploader.current?.setFiles([sampleFile]);
  };

  const renderUploadHeader = (options) => (
    <div className="mb-1 flex items-center justify-center gap-1.5">
      {options.chooseButton}
      {options.cancelButton}
    </div>
  );

  return (
    <div className={`upload-card ${OUTER_CARD_CLASS}`}>
      <SectionHeader
        step={1}
        title="Upload signal"
        description="Load a CSV manually or use a bundled sample."
        aside={
          <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-gray-800 dark:text-slate-200">
            <FaUpload className="text-cyan-500" />
            CSV up to 50 MB
          </div>
        }
      />

      <PrimeReactProvider>
        <div className={INNER_CARD_CLASS}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Sample Data
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className="sample-eda inline-flex h-7 items-center gap-1.5 rounded-md bg-slate-900 px-2 text-[10px] font-semibold text-white shadow-none dark:bg-white dark:text-slate-900"
                onClick={() => loadSampleFile("EDA.csv")}
              >
                <FaFlask size={12} />
                EDA.csv
              </button>

              <SimpleMenu
                widthClass="w-56"
                label="Sample files"
                trigger={
                  <button
                    type="button"
                    className="sample-list h-7 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-700 shadow-none transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    More samples
                  </button>
                }
                items={[
                  {
                    label: "EDA.csv",
                    onClick: () => loadSampleFile("EDA.csv"),
                  },
                  {
                    label: "PPG.csv",
                    onClick: () => loadSampleFile("PPG.csv"),
                  },
                ]}
              />
            </div>
          </div>

          <div className="mb-2 border-t border-slate-200 dark:border-gray-700" />

          <p
            id="error-message"
            className="mb-1 min-h-4 text-[11px] font-medium text-red-500"
          ></p>
          <FileUpload
            data-testid="csv-file-dropzone"
            ref={fileUploader}
            onSelect={fileSelected}
            onClear={fileRemoved}
            onRemove={fileRemoved}
            accept=".csv"
            maxFileSize={52428868}
            className="home-fileupload"
            headerTemplate={renderUploadHeader}
            chooseLabel="Choose CSV"
            emptyTemplate={
              <div className="flex min-h-[84px] flex-col items-center justify-center rounded-[1rem] border border-dashed border-slate-300 bg-slate-50/70 px-2 py-2 text-center transition dark:border-gray-700 dark:bg-gray-950/70">
                <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  <FaUpload size={13} />
                </div>
                <p className="m-0 text-xs font-semibold text-slate-900 dark:text-white">
                  Drag and drop your CSV here
                </p>
                <p className="mt-0.5 max-w-[220px] text-[10px] leading-4 text-slate-600 dark:text-slate-300">
                  Upload your signal CSV file by dragging it here or selecting
                  it manually.
                </p>
              </div>
            }
            chooseOptions={{
              className:
                "rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow-none transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
            }}
            uploadOptions={{ className: "hidden p-fileupload-utility" }}
            cancelOptions={{
              className:
                "rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-none transition hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800",
            }}
          />
        </div>
      </PrimeReactProvider>
    </div>
  );
});

export const NextStepCard = ({ canLaunchUtility, checks, onLaunchUtility }) => {
  const pendingChecks = checks.filter((check) => !check.complete);
  const featuredUtilities = utilityItems.filter((item) => item.featured);
  const secondaryUtilities = utilityItems.filter((item) => !item.featured);

  return (
    <div className={`tuto-next-step ${OUTER_CARD_CLASS}`}>
      <SectionHeader
        step={4}
        title="Next step"
        titleTag="h3"
        description="Choose the utility once the dataset is ready."
      />

      <div className="mt-3 flex flex-col gap-2.5">
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-[13px] text-slate-600 dark:bg-gray-800 dark:text-slate-300">
          {canLaunchUtility ? (
            "Everything is ready. Choose where you want to continue."
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Missing:
              </span>
              {pendingChecks.map((check) => (
                <span
                  key={check.label}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-300"
                >
                  {check.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {featuredUtilities.map((item) => {
              const Icon = item.icon;
              const isDisabled = item.alwaysEnabled ? false : !canLaunchUtility;
              const featuredClass = item.label === "Batch"
                ? "border-cyan-200 bg-cyan-50/90 text-cyan-900 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100 dark:hover:bg-cyan-500/20"
                : "border-amber-200 bg-amber-50/90 text-amber-900 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 dark:hover:bg-amber-500/20";

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onLaunchUtility(item.path)}
                  disabled={isDisabled}
                  className={`flex min-h-[64px] items-start gap-2.5 rounded-[1.05rem] border px-3.5 py-2 text-left transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 ${featuredClass}`}
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/75 text-[15px] shadow-sm dark:bg-gray-950/70">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-4">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 opacity-80">
                      {item.helper}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Single Utilities
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {secondaryUtilities.map((item) => {
                const Icon = item.icon;
                const isDisabled = item.alwaysEnabled ? false : !canLaunchUtility;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onLaunchUtility(item.path)}
                    disabled={isDisabled}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1.5 overflow-visible rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-100 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                  >
                    {Icon ? (
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-visible leading-none">
                        <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
                      </span>
                    ) : null}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SignalPreviewCard = ({
  chartDataOriginal,
  fileRows,
  headers,
  timestampColumn,
  signalValues,
  cropValues,
  onCropChange,
  onApplyCrop,
  hasAppliedCrop,
}) => {
  const parsedSignalIndex =
    signalValues === "" ? -1 : parseInt(signalValues, 10);
  const hasSelectedTimestamp =
    Array.isArray(headers) &&
    timestampColumn >= 0 &&
    timestampColumn < headers.length;
  const hasSelectedSignal =
    Array.isArray(headers) &&
    parsedSignalIndex >= 0 &&
    parsedSignalIndex < headers.length;
  const previewHeaders = [
    hasSelectedTimestamp
      ? headers[timestampColumn] === NO_TIMESTAMPS_LABEL
        ? "Time"
        : headers[timestampColumn]
      : "Time",
    hasSelectedSignal ? headers[parsedSignalIndex] : "Value",
  ];
  const previewMessage = !fileRows
    ? "Waiting for file..."
    : !chartDataOriginal
      ? "Waiting for parameters..."
      : null;
  const previewTable = chartDataOriginal ?? [previewHeaders];

  return (
    <div className="tuto-chart">
      <div>
        <div className="px-3 pb-3 pt-2">
          <div className="relative">
            <CustomChart table={previewTable} />
            {previewMessage ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
                <div className="rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/90 dark:text-slate-300">
                  {previewMessage}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {fileRows ? (
          <div className="tuto-range-slider px-4 py-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-300">
                {cropValues
                  ? `Rows ${cropValues[0] + 1} - ${cropValues[1]}`
                  : "Rows"}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCropChange([0, fileRows.length]);
                    onApplyCrop();
                  }}
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onApplyCrop}
                  disabled={!cropValues || hasAppliedCrop}
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                >
                  Crop
                </button>
              </div>
            </div>

            <RangeSlider
              key={fileRows.length}
              className="my-1"
              id="range-slider"
              step={1}
              min={0}
              max={fileRows.length}
              value={cropValues || [0, fileRows.length]}
              onInput={onCropChange}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const PreviewWorkspaceCard = ({ children }) => (
  <div className={OUTER_CARD_CLASS}>
    <SectionHeader
      step={3}
      title="Preview"
      description="Visualize and crop your signal data before proceeding."
    />
    <div className="space-y-5">{children}</div>
  </div>
);

HomeHero.propTypes = {
  isDark: PropTypes.bool.isRequired,
};

CSVUploader.propTypes = {
  onDatasetLoaded: PropTypes.func.isRequired,
  onDatasetCleared: PropTypes.func.isRequired,
};

NextStepCard.propTypes = {
  canLaunchUtility: PropTypes.bool.isRequired,
  checks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      complete: PropTypes.bool.isRequired,
    }),
  ).isRequired,
  onLaunchUtility: PropTypes.func.isRequired,
};

SignalPreviewCard.propTypes = {
  chartDataOriginal: PropTypes.array,
  fileRows: PropTypes.array,
  headers: PropTypes.arrayOf(PropTypes.string),
  timestampColumn: PropTypes.number,
  signalValues: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  cropValues: PropTypes.arrayOf(PropTypes.number),
  onCropChange: PropTypes.func.isRequired,
  onApplyCrop: PropTypes.func.isRequired,
  hasAppliedCrop: PropTypes.bool.isRequired,
};

SignalPreviewCard.defaultProps = {
  chartDataOriginal: null,
  fileRows: null,
  headers: [],
  timestampColumn: -1,
  signalValues: -1,
  cropValues: null,
};

PreviewWorkspaceCard.propTypes = {
  children: PropTypes.node.isRequired,
};
