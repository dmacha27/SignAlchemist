import { useState, useEffect, useRef, useCallback, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { FaBullseye } from "react-icons/fa";
import toast from "react-hot-toast";
import HandleLimit from "../edges/HandleLimit";
import { NodeOutputPreview, NodeRunButton, NodeSection, NodeShell } from "./NodeShell";
import { uiSelectClass } from "../../common/ui";
import { parseTechniqueConfig } from "../../processing/processingNodeUtils";
import {
  dispatchWindowEvent,
  getDeleteTablesEventName,
  getExecuteEventName,
} from "../../processing/processingEvents";
import { requestOutliers as requestOutliersData } from "../../processing/processingRequests";

/**
 * OutliersNode component
 *
 * This component represents a node in a flow diagram responsible for detecting and managing outliers in signal data.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.id - Unique identifier for the node
 * @param {Object} props.data - Additional data, including methods to delete nodes and update chart data
 * @returns {JSX.Element} Visual and functional representation of the outlier detection node
 */
function OutliersNode({ id, data }) {
  const { t } = useTranslation();
  const tableRef = useRef(null);
  const initialConfig = parseTechniqueConfig(data.technique, {
    name: data.outlierTechnique,
  });

  const { updateNodeData } = useReactFlow();
  const [outlierTechnique, setOutlierTechnique] = useState(
    initialConfig?.name ?? "hampel"
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
    tableRef.current = incomingTable ?? null;
  }, [incomingTable]);

  useEffect(() => {
    updateNodeData(id, (prev) => ({
      ...prev,
      technique: JSON.stringify({
        name: outlierTechnique,
      }),
      target: targetNodeId,
      outlierTechnique,
      executionState,
    }));
  }, [executionState, id, outlierTechnique, targetNodeId, updateNodeData]);

  const requestOutliers = useCallback(async () => {
    const table = tableRef.current;
    if (!table) return;

    setExecutionState("running");

    const signalOnly = table.slice(1); // Exclude headers

    if (targetNodeId) {
      dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
    }

    try {
      const result = await requestOutliersData({
        signal: signalOnly,
        outlierTechnique,
      });

      const new_table = [table[0]].concat(result.data); // Add headers back

      updateNodeData(id, (prev) => ({
        ...prev,
        table: new_table,
      }));

      setExecutionState("executed");
      return new_table;
    } catch (error) {
      const message = error.message || "Failed to apply outliers";
      console.error(message);
      toast.error(message);

      setExecutionState("error");
      return null;
    }
  }, [id, outlierTechnique, targetNodeId, updateNodeData]);

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

    const nextTable = await requestOutliers();

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
  }, [outlierTechnique, id]);

  return (
    <NodeShell
      icon={<FaBullseye />}
      title={t("pipeline.nodes.OutliersNode.label", { defaultValue: "Outliers" })}
      eyebrow={t("pipeline.eyebrow.node", { defaultValue: "Node" })}
      accent="amber"
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
          onClick={requestOutliers}
          accent="amber"
        >
          {t("pipeline.actions.applyOutliers", { defaultValue: "Apply Outliers" })}
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
        label={t("pipeline.nodes.OutliersNode.techniqueLabel", { defaultValue: "Detection technique" })}
        tooltip={t("pipeline.nodes.OutliersNode.techniqueTooltip", { defaultValue: "Choose how anomalous samples are identified before they are corrected or removed." })}
        fieldId="outliers-detection-technique"
      >
          <select
            id="outliers-detection-technique"
            data-testid="Select outlier"
            value={outlierTechnique}
            onChange={(event) => {
              const value = event.target.value;
              if (value) {
                setOutlierTechnique(value);
              }
            }}
            className={uiSelectClass}
          >
            <option value="hampel">Hampel</option>
            <option value="iqr">IQR</option>
          </select>
      </NodeSection>

      <NodeOutputPreview
        ready={Boolean(outputTable)}
        rows={outputTable ? outputTable.length - 1 : 0}
        onClick={() => {
          if (outputTable) {
            data.showProcessedPreview(outputTable);
          }
        }}
        accent="amber"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="custom-handle"
      />
    </NodeShell>
  );
}

export default OutliersNode;
