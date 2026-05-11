import { useState, memo, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { FaInfo, FaCheck, FaRegCopy } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { ThemeContext } from "../../contexts/ThemeContext";
import {
  SimpleDialog,
  SimpleTooltip,
  FormFieldLabel,
  uiButtonClass,
  uiCompactInputClass,
} from "./ui";

/**
 * InfoModal component displays a modal with Python function information and example code.
 *
 * @param {Object} props
 * @param {boolean} props.opened - Boolean that controls whether the modal is visible or not.
 * @param {function} props.close - Function to close the modal.
 */
const InfoModal = ({ opened, close }) => {
  const { t } = useTranslation();
  const content =
    "def filter_signal(signal): \n\tnew_values = scipy.ndimage.gaussian_filter1d(signal, sigma=30) \n\treturn new_values";
  const packageList =
    "import numpy as np\nimport pandas as pd\nimport neurokit2\nimport scipy";

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset the state after 2 seconds
  };

  // Detect dark mode
  const { isDarkMode: isDark } = useContext(ThemeContext);
  const codeBlockClassName = isDark
    ? "mt-2 overflow-x-auto rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-100"
    : "mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm text-slate-100";

  return (
    <SimpleDialog open={opened} onClose={close} title={t("filtering.modal.title")}>
      <div className="overflow-x-hidden text-gray-800 dark:text-white">
        <h3 className="mb-4 text-xl font-semibold">{t("filtering.modal.functionTitle")}</h3>

        <ol className="list-decimal list-inside space-y-3 text-sm">
          <li>
            {t("filtering.modal.rules.code")}
          </li>
          <li>
            {t("filtering.modal.rules.functionName")}
          </li>
          <li>
            {t("filtering.modal.rules.parameters")}
          </li>
          <li>
            {t("filtering.modal.rules.output")}
          </li>
          <li>
            {t("filtering.modal.rules.noAdditional")}
          </li>
          <li>
            {t("filtering.modal.rules.syntax")}
          </li>
          <li>
            {t("filtering.modal.rules.required")}
          </li>
          <li>
            <strong>{t("filtering.modal.rules.packages")}</strong>
            <pre className={codeBlockClassName}>
              <code>{packageList}</code>
            </pre>
          </li>
          <li>
            <strong>{t("filtering.modal.rules.example")}</strong>
            <div className="relative">
              <pre className={codeBlockClassName}>
                <code>{content}</code>
              </pre>

              <SimpleTooltip label={copied ? t("common.copied") : t("common.copy")}>
                <button
                  type="button"
                  className="absolute top-2 right-2 cursor-pointer text-gray-500 dark:text-gray-100"
                  onClick={handleCopy}
                  title={t("common.copy")}
                >
                  {copied ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaRegCopy className="text-gray-500" />
                  )}
                </button>
              </SimpleTooltip>
            </div>
          </li>
        </ol>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="btn min-h-0 h-auto rounded-xl border-0 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-none hover:bg-red-700"
            onClick={close}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </SimpleDialog>
  );
};

/**
 * FilterFields component renders form fields for different filter parameters and displays a modal for Python code information.
 *
 * @param {Object} props
 * @param {Object} props.fields - An object containing the filter fields and their configuration.
 * @param {function} props.onFieldChange - A callback function to handle field value changes.
 */
const FilterFields = memo(({ filter, fields, fieldDefinitions, onFieldChange }) => {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const [enabledFields, setEnabledFields] = useState({});

  useEffect(() => {
    const nextEnabledFields = Object.fromEntries(
      Object.entries(fieldDefinitions)
        .filter(([, definition]) => definition.optional)
        .map(([fieldName]) => [fieldName, fields[fieldName] !== null])
    );

    setEnabledFields(nextEnabledFields);
  }, [fieldDefinitions, fields, filter]);

  const onCheckboxChange = (field, checked) => {
    setEnabledFields((prev) => ({
      ...prev,
      [field]: checked,
    }));

    if (checked) {
      onFieldChange(field, 1);
    } else {
      onFieldChange(field, null);
    }
  };

  return (
    <>
      <InfoModal opened={opened} close={() => setOpened(false)} />

      {Object.entries(fieldDefinitions).map(([field, fieldDefinition]) => {
        const fieldValue = fields[field];

        if (fieldDefinition.type !== "textarea") {
          return (
            <div
              key={field}
              className="rounded-[1rem] border border-slate-200 bg-slate-50/70 p-3 dark:border-gray-700 dark:bg-gray-800/70"
            >
              <div className="mb-2">
                <FormFieldLabel
                  htmlFor={field}
                  label={fieldDefinition.label}
                  tooltip={fieldDefinition.tooltip}
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  key={`${filter}_${field}`}
                  id={field}
                  type="number"
                  placeholder={fieldDefinition.label}
                  value={fieldValue ?? ""}
                  min={fieldDefinition.min ?? 0}
                  onBlur={(event) => {
                    if (event.target.value === "" || Number.isNaN(Number(event.target.value))) {
                      onFieldChange(field, fieldDefinition.min ?? 1);
                    }
                  }}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    onFieldChange(field, nextValue === "" ? "" : Number(nextValue));
                  }}
                  disabled={fieldDefinition.optional && !enabledFields[field]}
                  className={`flex-1 ${uiCompactInputClass}`}
                />

                {fieldDefinition.optional && (
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={!!enabledFields[field]}
                    onChange={(e) => onCheckboxChange(field, e.target.checked)}
                  />
                )}
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={field}
              className="rounded-[1rem] border border-slate-200 bg-slate-50/70 p-3 dark:border-gray-700 dark:bg-gray-800/70"
            >
              <div className="flex items-center justify-between mb-1">
                <FormFieldLabel
                  htmlFor={field}
                  label={fieldDefinition.label}
                  tooltip={fieldDefinition.tooltip}
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                />
                <button
                  type="button"
                  className={`${uiButtonClass} px-2 py-1 text-xs`}
                  onClick={() => setOpened(true)}
                  title={t("common.info")}
                >
                  <FaInfo /> {t("common.info")}
                </button>
              </div>
              <textarea
                id={field}
                key={`${filter}_${field}`}
                value={fieldValue}
                onChange={(e) => onFieldChange(field, e.target.value)}
                rows={4}
                className="textarea textarea-bordered min-h-[110px] w-full rounded-xl border-slate-300 bg-white text-sm text-slate-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
          );
        }
      })}
    </>
  );
});

InfoModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
};

FilterFields.propTypes = {
  filter: PropTypes.string.isRequired,
  fields: PropTypes.object.isRequired,
  fieldDefinitions: PropTypes.object.isRequired,
  onFieldChange: PropTypes.func.isRequired,
};

export default FilterFields;
