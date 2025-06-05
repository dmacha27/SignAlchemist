import { useState, memo, useContext } from "react";
import PropTypes from "prop-types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaInfo, FaCheck, FaClipboard } from "react-icons/fa";

import {
  Modal,
  Button,
  Group,
  Tooltip,
  Text,
  NumberInput,
  Checkbox,
  Textarea,
  Stack,
  Box,
  Code,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { ThemeContext } from "../../contexts/ThemeContext";

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

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset the state after 2 seconds
  };

  // Detect dark mode
  const { isDarkMode: isDark } = useContext(ThemeContext);

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Python Info"
      size="lg"
      centered
      withCloseButton
      classNames={{
        header:
          "bg-white dark:bg-gray-900 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700",
        body: "bg-white dark:bg-gray-900 text-gray-800 dark:text-white",
        title: "text-gray-800 dark:text-white",
      }}
    >
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
            <strong>Empty Field:</strong> If the field is left blank, the filter
            will be executed with the other parameters from the form (this field
            will be ignored).
          </li>
          <li>
            <strong>What packages can I use? (more to come):</strong>
            <SyntaxHighlighter
              language="python"
              style={isDark ? materialDark : undefined}
            >
              {
                "import numpy as np\nimport pandas as pd\nimport neurokit2\nimport scipy"
              }
            </SyntaxHighlighter>
          </li>
          <li>
            <strong>Example (copy and paste to try!):</strong>
            <div className="relative">
              <SyntaxHighlighter
                language="python"
                style={isDark ? materialDark : undefined}
              >
                {content}
              </SyntaxHighlighter>

              <Tooltip
                label={copied ? "Copied!" : "Copy"}
                position="top-end"
                withArrow
              >
                <button
                  className="absolute top-2 right-2 cursor-pointer text-gray-500 dark:text-gray-100"
                  onClick={handleCopy}
                  title="Copy"
                >
                  {copied ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaClipboard className="text-gray-500" />
                  )}
                </button>
              </Tooltip>
            </div>
          </li>
        </ol>

        <Group justify="flex-end" className="mt-6">
          <Button variant="light" color="red" onClick={close}>
            Close
          </Button>
        </Group>
      </div>
    </Modal>
  );
};

/**
 * FilterFields component renders form fields for different filter parameters and displays a modal for Python code information.
 *
 * @param {Object} props
 * @param {Object} props.fields - An object containing the filter fields and their configuration.
 * @param {function} props.onFieldChange - A callback function to handle field value changes.
 */
const FilterFields = memo(({ fields, onFieldChange }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [enabledFields, setEnabledFields] = useState({});

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
      <InfoModal opened={opened} close={close} />

      {Object.keys(fields).map((field) => {
        const fieldConfig = fields[field];

        if (field !== "python") {
          return (
            <div key={field} className="mb-4">
              <label
                htmlFor={field}
                className="block mb-1 font-medium text-black dark:text-white"
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <Group align="center" spacing="sm">
                <NumberInput
                  id={field}
                  placeholder={`Enter ${field}`}
                  value={fieldConfig}
                  min={1}
                  onBlur={(event) => {
                    if (event.target.value === "") {
                      onFieldChange(field, 1);
                    }
                  }}
                  onChange={(value) => onFieldChange(field, value)}
                  disabled={
                    (field === "lowcut" || field === "highcut") &&
                    !enabledFields[field]
                  }
                  style={{ flex: 1 }}
                  className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg shadow-sm text-black dark:text-white"
                  classNames={{
                    input:
                      "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600",
                  }}
                />

                {(field === "lowcut" || field === "highcut") && (
                  <Checkbox
                    defaultChecked={false}
                    onChange={(e) => onCheckboxChange(field, e.target.checked)}
                    size="md"
                  />
                )}
              </Group>
            </div>
          );
        } else {
          return (
            <div key={field}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700 dark:text-white">
                  Python code
                </span>
                <Button variant="subtle" size="xs" onClick={open} title="Info">
                  <FaInfo /> Info
                </Button>
              </div>
              <Textarea
                value={fieldConfig.value}
                onChange={(e) => onFieldChange(field, e.target.value)}
                minRows={3}
                autosize
                classNames={{
                  input:
                    "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600",
                }}
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
  fields: PropTypes.objectOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    })
  ).isRequired,
  onFieldChange: PropTypes.func.isRequired,
};

export default FilterFields;
