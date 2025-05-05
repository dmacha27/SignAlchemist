import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { FaInfo, FaCheck, FaClipboard } from "react-icons/fa";

import { Modal, Button, Group, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

/**
 * InfoModal component displays a modal with Python function information and example code.
 * 
 * @param {Object} props
 * @param {boolean} props.opened - Boolean that controls whether the modal is visible or not.
 * @param {function} props.close - Function to close the modal.
 */
const InfoModal = ({ opened, close }) => {
  const content = 'def filter_signal(signal): \n\tnew_values = scipy.ndimage.gaussian_filter1d(signal, sigma=30) \n\treturn new_values';

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset the state after 2 seconds
  };
  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Python Info"
      size="lg"
      centered
      withCloseButton
    >
      <div className="overflow-x-hidden text-gray-800">
        <h3 className="text-xl font-semibold mb-4">filter_signal function</h3>

        <ol className="list-decimal list-inside space-y-3 text-sm">
          <li>
            <strong>Code:</strong> The code must be written in Python.
          </li>
          <li>
            <strong>Function name:</strong> The code must contain the definition of a function named <code className="bg-gray-100 px-1 rounded">filter_signal</code> that performs the filtering of the signal.
          </li>
          <li>
            <strong>Parameters:</strong> The function must have a single parameter that represents the signal values.
          </li>
          <li>
            <strong>Output:</strong> The function's output will be the processed (filtered) signal values (must have the same length as the input).
          </li>
          <li>
            <strong>No additional parameters:</strong> The function should not accept any additional parameters.
          </li>
          <li>
            <strong>Syntax Error:</strong> If there is a syntax error in the code, an error message will be displayed.
          </li>
          <li>
            <strong>Empty Field:</strong> If the field is left blank, the filter will be executed with the other parameters from the form (this field will be ignored).
          </li>
          <li>
            <strong>¿What packages can I use? (more to come):</strong>
            <SyntaxHighlighter language="python">
              {'import numpy as np\nimport pandas as pd\nimport neurokit2\nimport scipy'}
            </SyntaxHighlighter>
          </li>
          <li>
            <strong>Example (copy and paste to try!):</strong>
            <div className="relative">
              <SyntaxHighlighter language="python">
                {content}
              </SyntaxHighlighter>

              <Tooltip label={copied ? 'Copied!' : 'Copy'} position="top-end" withArrow>
                <div
                  className="absolute top-2 right-2 cursor-pointer"
                  onClick={handleCopy}
                  title="Copy"
                >
                  {copied ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaClipboard className="text-gray-500" />
                  )}
                </div>
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
const FilterFields = ({ fields, onFieldChange }) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <InfoModal opened={opened} close={close} />

      {Object.keys(fields).map((field) => {
        const fieldConfig = fields[field];

        if (field !== "python") {
          return (
            <div key={field} className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">
                {field.charAt(0).toUpperCase() + field.slice(1)} Frequency
              </label>
              <input
                type="number"
                placeholder={`Enter ${field}`}
                value={fieldConfig.value}
                onChange={(e) => onFieldChange(field, Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              />
            </div>
          );
        } else {
          return (
            <div key={field}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-gray-700">Python code</label>
                <button
                  type="button"
                  onClick={open}
                  title="Info"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  <FaInfo></FaInfo>
                </button>
              </div>
              <textarea
                value={fieldConfig.value}
                onChange={(e) => onFieldChange(field, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200 resize-none"
              />
            </div>
          );
        }
      })}
    </>
  );

};

export default FilterFields;
