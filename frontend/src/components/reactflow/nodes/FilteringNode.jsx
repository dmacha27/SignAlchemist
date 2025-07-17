import { useState, useEffect } from "react";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { Card, Button, Select, Tooltip } from "@mantine/core";
import FilterFields from "../../common/FilterFields";
import { FaFilter, FaTrash, FaEye } from "react-icons/fa";
import ExecutionIcon from "../../common/ExecutionIcon";
import toast from "react-hot-toast";
import HandleLimit from "../edges/HandleLimit";
import { diff, average } from "../../utils/dataUtils";

const filtersFields = {
  butterworth: {
    order: 2,
    lowcut: null,
    highcut: null,
    python: "",
  },
  bessel: {
    lowcut: null,
    highcut: null,
    python: "",
  },
  fir: {
    lowcut: null,
    highcut: null,
    python: "",
  },
  savgol: {
    order: 2,
    lowcut: null,
    highcut: null,
    window_size: 999,
    python: "",
  },
};

/**
 * FilteringNode component
 * This component represents a filtering operation node in a flow diagram.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.id - The unique identifier for the current node
 * @param {Object} props.data - Data for the node, including functions for deleting the node and updating chart data
 * @returns {JSX.Element} Visual representation of the filtering node with UI for selecting a filter, configuring parameters, and executing the filtering operation
 */
function FilteringNode({ id, data }) {
  let samplingRate = data.samplingRate;

  let window_size = Math.round(samplingRate / 3);
  if (window_size % 2 === 0) {
    window_size += 1;
  }
  filtersFields.savgol.window_size = window_size;

  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [filter, setFilter] = useState("butterworth");
  const [fields, setFields] = useState(filtersFields[filter]);
  const [executionState, setExecutionState] = useState("waiting");

  const connections = useNodeConnections({ type: "target" });
  const { python, ...rest } = fields;
  data["technique"] = JSON.stringify({
    name: filter,
    fields: python == "" ? rest : { python: python },
  });
  data["target"] = targetNodeId;

  // Set source and target node IDs based on the current connections
  useEffect(() => {
    const sourceId = connections?.find((conn) => conn.target === id)?.source;
    const targetId = connections?.find((conn) => conn.source === id)?.target;
    setSourceNodeId(sourceId);
    setTargetNodeId(targetId);
  }, [connections]);

  const currentNodeData = useNodesData(id);
  const sourceNodeData = useNodesData(sourceNodeId);
  let table = sourceNodeData?.data?.table;

  if (table) {
    samplingRate = 1 / average(diff(table.slice(1).map((x) => x[0])));

    window_size = Math.round(samplingRate / 3);
    if (window_size % 2 === 0) {
      window_size += 1;
    }
  }

  useEffect(() => {
    /**
     * Handler to delete the current node's table and propagate the event to the next node.
     */
    const handleDeleteTable = () => {
      updateNodeData(id, (prev) => ({
        ...prev,
        table: null,
      }));

      setExecutionState("waiting");

      const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
      window.dispatchEvent(event);
    };

    /**
     * Handler to execute the filtering process when an event is triggered.
     * @param {Event} e - The event containing the table data to be filtered.
     */
    const handleExecute = async (e) => {
      const table_source = e.detail.table;

      if (table_source) {
        table = table_source;

        samplingRate =
          1 / average(diff(table_source.slice(1).map((x) => x[0])));

        window_size = Math.round(samplingRate / 3);
        if (window_size % 2 === 0) {
          window_size += 1;
        }
        const new_table = await requestFilter();

        if (targetNodeId) {
          const customEvent = new CustomEvent(`execute-node${targetNodeId}`, {
            detail: { table: new_table },
          });
          window.dispatchEvent(customEvent);
        }
      }
    };

    window.addEventListener(`execute-node${id}`, handleExecute);
    window.addEventListener(`delete-source-tables${id}`, handleDeleteTable);

    return () => {
      // Clean up events when dependencies change (avoid multiple listeners of the same type)
      window.removeEventListener(`execute-node${id}`, handleExecute);
      window.removeEventListener(
        `delete-source-tables${id}`,
        handleDeleteTable
      );
    };
  }, [targetNodeId, filter, fields]);

  /**
   * Trigger a delete event when filter configuration changes.
   */
  useEffect(() => {
    const event = new CustomEvent(`delete-source-tables${id}`);
    window.dispatchEvent(event);
  }, [filter, fields]);

  /**
   * Makes a request to the server to filter the table data.
   * @returns {Array} The new filtered table.
   */
  const requestFilter = async () => {
    if (!table) return;

    setExecutionState("running");

    const formData = new FormData();

    const signalOnly = table.slice(1); // Exclude headers

    formData.append("signal", JSON.stringify(signalOnly));
    formData.append("sampling_rate", Math.round(samplingRate));

    const filterConfig = {
      method: filter,
      ...fields,
    };

    formData.append("filter_config", JSON.stringify(filterConfig));

    const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
    window.dispatchEvent(event);

    try {
      const response = await fetch("/api/filtering", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData.error);
        toast.error(errorData.error);
        throw new Error(errorData.error);
      }

      const result = await response.json();

      const new_table = [table[0]].concat(result.data); // Add headers back

      updateNodeData(id, (prev) => ({
        ...prev,
        table: new_table,
      }));

      setExecutionState("executed");
      return new_table;
    } catch (error) {
      console.error("Failed to apply filter:", error);
      toast.error("Failed to apply filter");
      updateNodeData(id, (prev) => ({
        ...prev,
        table: table, // Reset to original table on error
      }));

      setExecutionState("error");
      return table;
    }
  };

  /**
   * Handle changes in the filter fields.
   * @param {string} field - The name of the field being updated
   * @param {any} new_value - The new value for the field
   */
  const handleFieldChange = (field, new_value) => {
    setFields((prevFields) => ({ ...prevFields, [field]: new_value }));
  };

  return (
    <Card className="bg-white dark:bg-gray-900 shadow-lg dark:shadow-xl rounded-lg p-4 mt-2 relative overflow-visible border-0 dark:border dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FaFilter className="text-green-600" size={20} />
          <span className="font-bold text-lg text-gray-800 dark:text-white">
            Filtering
          </span>

          {/* Node execution state icon */}
          <Tooltip label={executionState} withArrow position="bottom">
            <div
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer"
              onClick={() => {
                toast.custom(
                  <div className="toast-status bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white">
                    <div>Status:</div>
                    <div>
                      <ExecutionIcon executionState={executionState} />
                    </div>
                    <div>{executionState}</div>
                  </div>
                );
              }}
            >
              <ExecutionIcon executionState={executionState} />
            </div>
          </Tooltip>

          {/* Button to see the node output */}
          <Tooltip label="See output" withArrow position="bottom">
            <div
              data-testid={`output${id}`}
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer"
              onClick={() => {
                if (currentNodeData?.data?.table) {
                  data.setChartDataProcessed(currentNodeData.data.table);
                } else {
                  console.error("Execute node first");
                  toast.error("Execute node first");
                }
              }}
            >
              <FaEye className="text-black dark:text-white" />
            </div>
          </Tooltip>

          {/* Button to delete the node */}
          <Tooltip label="Delete node" withArrow position="bottom">
            <div
              data-testid={`delete${id}`}
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer"
              onClick={() => {
                data.deleteNode(id);
              }}
            >
              <FaTrash className="text-red-500" />
            </div>
          </Tooltip>
        </div>
      </div>

      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />

      <div className="p-4 space-y-2">
        <label
          htmlFor="filterTechnique"
          className="block font-medium text-black dark:text-white"
        >
          Filtering technique
        </label>
        <Select
          size="sm"
          data-testid="Select filter"
          value={filter}
          onChange={(value) => {
            if (value) {
              setFilter(value);
              setFields(filtersFields[value]);
            }
          }}
          data={Object.keys(filtersFields).map((key) => ({
            value: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
          }))}
          className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg shadow-sm text-black dark:text-white"
          classNames={{
            input:
              "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600",
            dropdown:
              "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600",
            option: `
                                      hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white
                                      data-[selected]:bg-blue-100 dark:data-[selected]:bg-blue-600
                                      data-[selected]:text-black dark:data-[selected]:text-white
                                    `,
          }}
        />

        <FilterFields
          filter={filter}
          fields={fields}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* Button */}
      <div className="w-full">
        <Button
          variant="subtle"
          size="sm"
          disabled={!table}
          onClick={requestFilter}
          className={`rounded-lg font-semibold w-full dark:bg-gray-800 dark:hover:bg-gray-700 ${
            !table ? "" : "dark:text-white"
          }`}
        >
          Filter
        </Button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="custom-handle"
      />
    </Card>
  );
}

export default FilteringNode;
