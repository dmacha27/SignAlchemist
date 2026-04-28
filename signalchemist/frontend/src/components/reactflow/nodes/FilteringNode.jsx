import { useState, useEffect, useRef, useCallback } from "react";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { Select } from "@mantine/core";
import FilterFields from "../../common/FilterFields";
import { FaFilter } from "react-icons/fa";
import toast from "react-hot-toast";
import HandleLimit from "../edges/HandleLimit";
import { diff, average } from "../../utils/dataUtils";
import { NodeOutputPreview, NodeRunButton, NodeSection, NodeShell } from "./NodeShell";

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
  const tableRef = useRef(null);
  const samplingRateRef = useRef(data.samplingRate);
  const initialConfig = typeof data.technique === "string"
    ? JSON.parse(data.technique)
    : {
        name: data.filter,
        fields: data.fields,
      };
  const windowSizeRef = useRef(
    Math.round(data.samplingRate / 3) % 2 === 0
      ? Math.round(data.samplingRate / 3) + 1
      : Math.round(data.samplingRate / 3)
  );

  filtersFields.savgol.window_size = windowSizeRef.current;

  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [filter, setFilter] = useState(initialConfig?.name ?? "butterworth");
  const [fields, setFields] = useState(
    initialConfig?.fields
      ? { ...filtersFields[initialConfig.name], ...initialConfig.fields }
      : filtersFields[initialConfig?.name ?? "butterworth"]
  );
  const [executionState, setExecutionState] = useState("waiting");

  const connections = useNodeConnections({ type: "target" });

  // Set source and target node IDs based on the current connections
  useEffect(() => {
    const sourceId = connections?.find((conn) => conn.target === id)?.source;
    const targetId = connections?.find((conn) => conn.source === id)?.target;
    setSourceNodeId(sourceId);
    setTargetNodeId(targetId);
  }, [connections, id]);

  const currentNodeData = useNodesData(id);
  const sourceNodeData = useNodesData(sourceNodeId);
  const incomingTable = sourceNodeData?.data?.table;
  const outputTable = currentNodeData?.data?.table;

  if (incomingTable) {
    tableRef.current = incomingTable;

    samplingRateRef.current =
      1 / average(diff(incomingTable.slice(1).map((x) => x[0])));

    windowSizeRef.current = Math.round(samplingRateRef.current / 3);
    if (windowSizeRef.current % 2 === 0) {
      windowSizeRef.current += 1;
    }
  } else {
    tableRef.current = null;
    samplingRateRef.current = null;
    windowSizeRef.current = null;
  }

  useEffect(() => {
    const { python, ...rest } = fields;
    updateNodeData(id, (prev) => ({
      ...prev,
      technique: JSON.stringify({
        name: filter,
        fields: python === "" ? rest : { python },
      }),
      target: targetNodeId,
      filter,
      fields,
      samplingRate: data.samplingRate,
      executionState,
    }));
  }, [
    data.samplingRate,
    executionState,
    fields,
    filter,
    id,
    targetNodeId,
    updateNodeData,
  ]);

  const requestFilter = useCallback(async () => {
    const table = tableRef.current;
    const samplingRate = samplingRateRef.current;

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

      setExecutionState("error");
      return null;
    }
  }, [fields, filter, id, targetNodeId, updateNodeData]);

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
        tableRef.current = table_source;

        samplingRateRef.current =
          1 / average(diff(table_source.slice(1).map((x) => x[0])));

        windowSizeRef.current = Math.round(samplingRateRef.current / 3);
        if (windowSizeRef.current % 2 === 0) {
          windowSizeRef.current += 1;
        }

        const new_table = await requestFilter();

        if (targetNodeId && new_table) {
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
  }, [id, requestFilter, targetNodeId, updateNodeData]);

  /**
   * Trigger a delete event when filter configuration changes.
   */
  useEffect(() => {
    const event = new CustomEvent(`delete-source-tables${id}`);
    window.dispatchEvent(event);
  }, [filter, fields, id]);

  /**
   * Handle changes in the filter fields.
   * @param {string} field - The name of the field being updated
   * @param {any} new_value - The new value for the field
   */
  const handleFieldChange = (field, new_value) => {
    setFields((prevFields) => ({ ...prevFields, [field]: new_value }));
  };

  return (
    <NodeShell
      icon={<FaFilter />}
      title="Filtering"
      eyebrow="Node"
      accent="emerald"
      executionState={executionState}
      onStatusClick={() => {
        toast.custom(
          <div className="toast-status bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white">
            <div>Status:</div>
            <div>{executionState}</div>
          </div>
        );
      }}
      onDeleteClick={() => {
        data.deleteNode(id);
      }}
      deleteTestId={`delete${id}`}
      footer={
        <NodeRunButton
          disabled={!tableRef.current}
          onClick={requestFilter}
          accent="emerald"
        >
          Filter
        </NodeRunButton>
      }
    >
      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />

      <NodeSection label="Filtering technique">
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
              "rounded-xl border border-slate-300 bg-white text-slate-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white",
            dropdown:
              "bg-white dark:bg-gray-900 text-black dark:text-white border border-slate-300 dark:border-gray-700",
            option:
              "hover:bg-slate-100 dark:hover:bg-gray-800 data-[checked]:bg-emerald-50 data-[checked]:text-slate-900 dark:data-[checked]:bg-emerald-500/15 dark:data-[checked]:text-white",
          }}
        />
      </NodeSection>

      <NodeSection label="Parameters">
        <FilterFields
          filter={filter}
          fields={fields}
          onFieldChange={handleFieldChange}
        />
      </NodeSection>

      <NodeOutputPreview
        ready={Boolean(outputTable)}
        rows={outputTable ? outputTable.length - 1 : 0}
        onClick={() => {
          if (outputTable) {
            data.setChartDataProcessed(outputTable);
          }
        }}
        accent="emerald"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="custom-handle"
      />
    </NodeShell>
  );
}

export default FilteringNode;
