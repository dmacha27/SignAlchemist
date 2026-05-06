import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import {
  NO_TIMESTAMPS_LABEL,
  SIGNAL_TYPE_OPTIONS,
  normalizeSamplingRateOnBlur,
} from "../home/homeUtils";

const CARD_CLASS =
  "rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-3.5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-gray-700 dark:bg-gray-900/85";

const SectionBadge = ({ step }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
    {step}
  </span>
);

const SectionHeader = ({ step, title, description }) => (
  <div className="mb-3 flex items-start gap-3">
    <div className="min-w-0 text-left">
      <div className="flex items-center gap-2.5">
        {step ? <SectionBadge step={step} /> : null}
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
  </div>
);

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
  title,
  description,
  step,
  variant = "card",
}) => {
  const { t } = useTranslation();
  const timestampOptions = headers.map((header, index) => ({
    label: header === NO_TIMESTAMPS_LABEL ? t("home.configure.noTimestamps") : header,
    value: index,
  }));
  const signalValueOptions = headers
    .slice(0, -1)
    .map((header, index) => ({ label: header, value: index }));
  const samplingRateDisabled =
    !headers.length || timestampColumn !== headers.length - 1;

  const content = (
    <>
      <form className="space-y-2.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldCard
            className="tuto-signalType"
            label={t("home.configure.signalType")}
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
                  {t(`home.configure.signalTypes.${option || "empty"}`)}
                </option>
              ))}
            </select>
          </FieldCard>

          <FieldCard
            className="tuto-timestampColumn"
            label={t("home.configure.timestampColumn")}
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
            label={t("home.configure.samplingRate")}
            inputId="samplingRate"
            footer={t("home.configure.samplingRateFooter")}
            footerClassName="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400"
          >
            <input
              type="number"
              step={1}
              min={1}
              placeholder={t("home.configure.enterHz")}
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
            label={t("home.configure.signalValues")}
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
            {t("home.configure.detectedSamplingRate", { value: samplingRate })}
          </div>
        </div>
      ) : null}
    </>
  );

  if (variant === "embedded") {
    return <div className="config-fields space-y-2.5">{content}</div>;
  }

  return (
    <div className={`config-fields ${CARD_CLASS}`}>
      <SectionHeader
        step={step ?? 2}
        title={title ?? t("home.configure.title")}
        description={description ?? t("home.configure.description")}
      />
      {content}
    </div>
  );
};

SectionBadge.propTypes = {
  step: PropTypes.number.isRequired,
};

SectionHeader.propTypes = {
  step: PropTypes.number,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
};

SectionHeader.defaultProps = {
  step: null,
  description: "",
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
  title: PropTypes.string,
  description: PropTypes.string,
  step: PropTypes.number,
  variant: PropTypes.oneOf(["card", "embedded"]),
};

DatasetConfigurationCard.defaultProps = {
  samplingRate: null,
  title: undefined,
  description: undefined,
  step: undefined,
  variant: "card",
};

export default DatasetConfigurationCard;
