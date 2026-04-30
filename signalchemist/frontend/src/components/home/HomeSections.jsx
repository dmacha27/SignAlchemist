import { memo, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
import { FileUpload } from "primereact/fileupload";
import { usePapaParse } from "react-papaparse";
import RangeSlider from "react-range-slider-input";
import { TbHelpSquareRoundedFilled } from "react-icons/tb";
import { FaArrowRight, FaFlask, FaUpload } from "react-icons/fa";

import CustomChart from "../common/CustomChart";
import {
  NO_TIMESTAMPS_LABEL,
  SIGNAL_TYPE_OPTIONS,
  autoConfigureDataset,
  normalizeSamplingRateOnBlur,
  parseCsvFile,
} from "./homeUtils";
import { SimpleMenu, SimpleTooltip } from "../common/ui";

const OUTER_CARD_CLASS =
  "rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-3.5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-gray-700 dark:bg-gray-900/85";
const INNER_CARD_CLASS =
  "rounded-[1.15rem] border border-slate-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900";

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

export const HomeHero = ({ isDark, onStartTour }) => (
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
        <div className="flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white dark:bg-white dark:text-slate-900">
                Quick Start
              </span>
              <SimpleTooltip label="Onboarding Tutorial">
                <button
                  onClick={onStartTour}
                  className="shake rounded-xl border border-slate-300 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-800"
                  aria-label="Open onboarding tutorial"
                >
                  <TbHelpSquareRoundedFilled size={22} />
                </button>
              </SimpleTooltip>
            </div>
            <p className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-300">
              Follow the tutorial or use one of the sample files to check the
              full flow quickly.
            </p>
          </div>

          <div className="min-w-0 md:max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Workflow
            </p>
            <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {[
                "Upload a CSV or load a sample.",
                "Configure the dataset metadata.",
                "Preview and crop the signal.",
                "Select the utility for the next step.",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-900">
                    {index + 1}
                  </span>
                  <p>{item}</p>
                </div>
              ))}
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

export const DatasetConfigurationCard = ({
  signalType,
  timestampColumn,
  signalValues,
  samplingRate,
  headers,
  onSignalTypeChange,
  onTimestampChange,
  onSignalValuesChange,
  onSamplingRateChange,
}) => {
  const timestampOptions = headers.map((header, index) => ({
    label: header,
    value: index,
  }));
  const signalValueOptions = headers
    .slice(0, -1)
    .map((header, index) => ({ label: header, value: index }));
  const samplingRateDisabled =
    !headers.length || timestampColumn !== headers.length - 1;

  return (
    <div className={`config-fields ${OUTER_CARD_CLASS}`}>
      <SectionHeader
        step={2}
        title="Configure dataset"
        description="These values drive the preview and are passed to the selected utility exactly as before."
      />

      <form className="space-y-2.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldCard
            className="tuto-signalType"
            label="Signal Type"
            inputId="signalType"
          >
            <select
              id="signalType"
              value={signalType}
              onChange={(event) => onSignalTypeChange(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              {SIGNAL_TYPE_OPTIONS.map((option) => (
                <option key={option || "empty"} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldCard>

          <FieldCard
            className="tuto-timestampColumn"
            label="Timestamp Column"
            inputId="timestampColumn"
          >
            <select
              id="timestampColumn"
              value={timestampColumn}
              onChange={(event) =>
                onTimestampChange(parseInt(event.target.value, 10))
              }
              className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              {timestampOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldCard>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FieldCard
            className="tuto-samplingRate"
            label="Sampling Rate (Hz)"
            inputId="samplingRate"
            footer="Enabled when the file does not contain timestamps."
            footerClassName="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400"
          >
            <input
              type="number"
              step={1}
              min={1}
              placeholder="Enter Hz"
              id="samplingRate"
              value={samplingRate || ""}
              onChange={(event) => onSamplingRateChange(event.target.value)}
              onBlur={(event) => {
                const normalizedValue = normalizeSamplingRateOnBlur(
                  event.target.value,
                );
                event.target.value = normalizedValue;
                onSamplingRateChange(normalizedValue);
              }}
              disabled={samplingRateDisabled}
              className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </FieldCard>

          <FieldCard
            className="tuto-signalValues"
            label="Signal Values"
            inputId="signalValues"
          >
            <select
              id="signalValues"
              value={signalValues}
              onChange={(event) => onSignalValuesChange(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value=""></option>
              {signalValueOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldCard>
        </div>
      </form>
      {samplingRate && timestampColumn !== headers.length - 1 ? (
        <div className="my-2 flex justify-center">
          <div
            id="samplingRateBadge"
            className="inline-flex w-fit items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            Detected sampling rate of {samplingRate} Hz
          </div>
        </div>
      ) : null}
    </div>
  );
};

const FieldCard = ({
  className = "",
  label,
  inputId,
  children,
  footer,
  footerClassName = "",
}) => (
  <div
    className={`${className} flex min-h-[96px] flex-col justify-between rounded-[1.15rem] border border-slate-200 bg-slate-50/70 p-2.5 dark:border-gray-700 dark:bg-gray-800/70`}
  >
    <label
      htmlFor={inputId}
      className="block min-h-[32px] text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300"
    >
      {label}
    </label>
    {children}
    {footer ? <p className={footerClassName}>{footer}</p> : null}
  </div>
);

export const NextStepCard = ({ canLaunchUtility, checks, onLaunchUtility }) => {
  const pendingChecks = checks.filter((check) => !check.complete);

  return (
    <div className={`tuto-next-step ${OUTER_CARD_CLASS}`}>
      <SectionHeader
        step={4}
        title="Next step"
        titleTag="h3"
        description="Choose the utility once the dataset is ready."
      />

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-gray-700">
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-gray-800 dark:text-slate-300">
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
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {["Resampling", "Filtering", "Peaks", "HR", "Processing"].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onLaunchUtility(label === "HR" ? "/hr" : `/${label.toLowerCase()}`)}
              disabled={!canLaunchUtility}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
            >
              {label}
            </button>
          ))}
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
  onStartTour: PropTypes.func.isRequired,
};

CSVUploader.propTypes = {
  onDatasetLoaded: PropTypes.func.isRequired,
  onDatasetCleared: PropTypes.func.isRequired,
};

DatasetConfigurationCard.propTypes = {
  signalType: PropTypes.string.isRequired,
  timestampColumn: PropTypes.number.isRequired,
  signalValues: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  samplingRate: PropTypes.number,
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSignalTypeChange: PropTypes.func.isRequired,
  onTimestampChange: PropTypes.func.isRequired,
  onSignalValuesChange: PropTypes.func.isRequired,
  onSamplingRateChange: PropTypes.func.isRequired,
};

DatasetConfigurationCard.defaultProps = {
  samplingRate: null,
};

FieldCard.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  inputId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.string,
  footerClassName: PropTypes.string,
};

FieldCard.defaultProps = {
  className: "",
  footer: null,
  footerClassName: "",
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
