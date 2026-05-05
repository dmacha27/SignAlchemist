import { useState, memo, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { FaInfo, FaCheck, FaRegCopy } from "react-icons/fa";

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
    <SimpleDialog open={opened} onClose={close} title="Python Info">
      <div className="overflow-x-hidden text-gray-800 dark:text-white">
        <h3 className="text-xl font-semibold mb-4">filter_signal function</h3>

        <ol className="list-decimal list-inside space-y-3 text-sm">
          <li>
            <strong>Code:</strong> The Python code must be well written, with
            correct tabulations and blank spaces.
          </li>
          <li>
            <strong>Function name:</strong> The code must contain the definition
            of a function named{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
              filter_signal
            </code>{" "}
            that performs the filtering of the signal.
          </li>
          <li>
            <strong>Parameters:</strong> The function must have a single
            parameter that represents the signal values.
          </li>
          <li>
            <strong>Output:</strong> The function's output will be the processed
            (filtered) signal values (must have the same length as the input).
          </li>
          <li>
            <strong>No additional parameters:</strong> The function should not
            accept any additional parameters.
          </li>
          <li>
            <strong>Syntax Error:</strong> If there is a syntax error in the
            code, an error message will be displayed.
          </li>
          <li>
            <strong>Required for Python filter:</strong> If this field is left
            blank, the custom Python filter cannot be executed.
          </li>
          <li>
            <strong>What packages can I use? (more to come):</strong>
            <pre className={codeBlockClassName}>
              <code>{packageList}</code>
            </pre>
          </li>
          <li>
            <strong>Example (copy and paste to try!):</strong>
            <div className="relative">
              <pre className={codeBlockClassName}>
                <code>{content}</code>
              </pre>

              <SimpleTooltip label={copied ? "Copied!" : "Copy"}>
                <button
                  type="button"
                  className="absolute top-2 right-2 cursor-pointer text-gray-500 dark:text-gray-100"
                  onClick={handleCopy}
                  title="Copy"
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
            Close
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
                  placeholder={`Enter ${field}`}
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
                  title="Info"
                >
                  <FaInfo /> Info
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
