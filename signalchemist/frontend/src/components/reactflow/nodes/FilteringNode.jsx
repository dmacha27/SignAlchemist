import { useState, useEffect, useRef, useCallback, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import FilterFields from "../../common/FilterFields";
import { FaFilter } from "react-icons/fa";
import toast from "react-hot-toast";
import HandleLimit from "../edges/HandleLimit";
import { inferSamplingRate } from "../../utils/dataUtils";
import { NodeOutputPreview, NodeRunButton, NodeSection, NodeShell } from "./NodeShell";
import { uiSelectClass } from "../../common/ui";
import {
  createFilterDefaults,
  filterDefinitions,
  getFilterOptions,
} from "../../filtering/filteringConfig";
import { parseTechniqueConfig } from "../../processing/processingNodeUtils";
import {
  dispatchWindowEvent,
  getDeleteTablesEventName,
  getExecuteEventName,
} from "../../processing/processingEvents";
import { requestFiltering } from "../../processing/processingRequests";

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
  const { t } = useTranslation();
  const tableRef = useRef(null);
  const samplingRateRef = useRef(data.samplingRate);
  const initialConfig = parseTechniqueConfig(data.technique, {
    name: data.filter,
    fields: data.fields,
  });
  const baseFilterDefaults = createFilterDefaults(data.samplingRate);
  const filterDefaultsRef = useRef(createFilterDefaults(data.samplingRate));

  const { updateNodeData } = useReactFlow();
  const [filter, setFilter] = useState(initialConfig?.name ?? "butterworth");
  const [fields, setFields] = useState(
    initialConfig?.fields
      ? {
          ...baseFilterDefaults[initialConfig.name],
          ...initialConfig.fields,
        }
      : baseFilterDefaults[initialConfig?.name ?? "butterworth"]
  );
  const [executionState, setExecutionState] = useState("waiting");

  const connections = useNodeConnections({ type: "target" });
  const sourceNodeId = connections?.find((conn) => conn.target === id)?.source ?? null;
  const targetNodeId = connections?.find((conn) => conn.source === id)?.target ?? null;

  const currentNodeData = useNodesData(id);
  const sourceNodeData = useNodesData(sourceNodeId);
  const incomingTable = sourceNodeData?.data?.table;
  const outputTable = currentNodeData?.data?.table;

  useEffect(() => {
    if (incomingTable) {
      tableRef.current = incomingTable;
      samplingRateRef.current =
        inferSamplingRate(incomingTable) ?? data.samplingRate;
      filterDefaultsRef.current = createFilterDefaults(samplingRateRef.current);
      return;
    }

    tableRef.current = null;
    samplingRateRef.current = null;
    filterDefaultsRef.current = createFilterDefaults(data.samplingRate);
  }, [data.samplingRate, incomingTable]);

  useEffect(() => {
    updateNodeData(id, (prev) => ({
      ...prev,
      technique: JSON.stringify({
        name: filter,
        fields,
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

    if (filter === "python" && !fields.python?.trim()) {
      toast.error("Python code is required for the Python filter");
      setExecutionState("error");
      return null;
    }

    setExecutionState("running");

    const signalOnly = table.slice(1); // Exclude headers

    const filterConfig = {
      method: filter,
      ...fields,
    };

    if (targetNodeId) {
      dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
    }

    try {
      const result = await requestFiltering({
        signal: signalOnly,
        samplingRate,
        filterConfig,
      });

      const new_table = [table[0]].concat(result.data); // Add headers back

      updateNodeData(id, (prev) => ({
        ...prev,
        table: new_table,
      }));

      setExecutionState("executed");
      return new_table;
    } catch (error) {
      const message = error.message || "Failed to apply filter";
      console.error(message);
      toast.error(message);

      setExecutionState("error");
      return null;
    }
  }, [fields, filter, id, targetNodeId, updateNodeData]);

  const handleDeleteTable = useEffectEvent(() => {
    updateNodeData(id, (prev) => ({
      ...prev,
      table: null,
    }));

    setExecutionState("waiting");

    if (targetNodeId) {
      dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
    }
  });

  const handleExecute = useEffectEvent(async (event) => {
    const tableSource = event.detail.table;

    if (!tableSource) {
      return;
    }

    tableRef.current = tableSource;
    samplingRateRef.current =
      inferSamplingRate(tableSource) ?? data.samplingRate;
    filterDefaultsRef.current = createFilterDefaults(samplingRateRef.current);

    const nextTable = await requestFilter();

    if (targetNodeId && nextTable) {
      dispatchWindowEvent(getExecuteEventName(targetNodeId), {
        table: nextTable,
      });
    }
  });

  useEffect(() => {
    const executeEventName = getExecuteEventName(id);
    const deleteEventName = getDeleteTablesEventName(id);
    const onExecute = (event) => {
      void handleExecute(event);
    };
    const onDelete = () => {
      handleDeleteTable();
    };

    window.addEventListener(executeEventName, onExecute);
    window.addEventListener(deleteEventName, onDelete);

    return () => {
      window.removeEventListener(executeEventName, onExecute);
      window.removeEventListener(deleteEventName, onDelete);
    };
  }, [id]);

  /**
   * Trigger a delete event when filter configuration changes.
   */
  useEffect(() => {
    dispatchWindowEvent(getDeleteTablesEventName(id));
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
      title={t("pipeline.nodes.FilteringNode.label", { defaultValue: "Filtering" })}
      eyebrow={t("pipeline.eyebrow.node", { defaultValue: "Node" })}
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
          disabled={!incomingTable}
          onClick={requestFilter}
          accent="emerald"
        >
          {t("pages.filtering.apply")}
        </NodeRunButton>
      }
    >
      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />

      <NodeSection
        label={t("pages.filtering.technique")}
        tooltip={t("pages.filtering.techniqueTooltip")}
        fieldId="filtering-technique"
      >
        <select
          id="filtering-technique"
          data-testid="Select filter"
          value={filter}
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              setFilter(value);
              setFields(filterDefaultsRef.current[value]);
            }
          }}
          className={uiSelectClass}
        >
          {getFilterOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </NodeSection>

      <div>
        <FilterFields
          filter={filter}
          fields={fields}
          fieldDefinitions={filterDefinitions[filter].fields}
          onFieldChange={handleFieldChange}
        />
      </div>

      <NodeOutputPreview
        ready={Boolean(outputTable)}
        rows={outputTable ? outputTable.length - 1 : 0}
        onClick={() => {
          if (outputTable) {
            data.showProcessedPreview(outputTable);
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
