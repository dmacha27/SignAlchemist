import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { FaBalanceScale } from "react-icons/fa";
import toast from "react-hot-toast";

import HandleLimit from "../edges/HandleLimit";
import {
  NodeOutputPreview,
  NodeRunButton,
  NodeSection,
  NodeShell,
} from "./NodeShell";
import { uiSelectClass } from "../../common/ui";
import { parseTechniqueConfig } from "../../processing/processingNodeUtils";
import {
  dispatchWindowEvent,
  getDeleteTablesEventName,
  getExecuteEventName,
} from "../../processing/processingEvents";
import { requestNormalization as requestNormalizationData } from "../../processing/processingRequests";

function NormalizationNode({ id, data }) {
  const { t } = useTranslation();
  const tableRef = useRef(null);
  const initialConfig = parseTechniqueConfig(data.technique, {
    name: data.normalizationMethod,
  });

  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [normalizationMethod, setNormalizationMethod] = useState(
    initialConfig?.name ?? "zscore"
  );
  const [executionState, setExecutionState] = useState("waiting");

  const connections = useNodeConnections({ type: "target" });

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

  useEffect(() => {
    tableRef.current = incomingTable ?? null;
  }, [incomingTable]);

  useEffect(() => {
    updateNodeData(id, (prev) => ({
      ...prev,
      technique: JSON.stringify({
        name: normalizationMethod,
      }),
      target: targetNodeId,
      normalizationMethod,
      executionState,
    }));
  }, [executionState, id, normalizationMethod, targetNodeId, updateNodeData]);

  const requestNormalization = useCallback(async () => {
    const table = tableRef.current;
    if (!table) return;

    setExecutionState("running");

    const signalOnly = table.slice(1);

    if (targetNodeId) {
      dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
    }

    try {
      const payload = await requestNormalizationData({
        signal: signalOnly,
        normalizationMethod,
      });

      const newTable = [table[0]].concat(payload.data);

      updateNodeData(id, (prev) => ({
        ...prev,
        table: newTable,
      }));

      setExecutionState("executed");
      return newTable;
    } catch (error) {
      const message = error.message || "Failed to apply normalization";
      console.error(message);
      toast.error(message);
      setExecutionState("error");
      return null;
    }
  }, [id, normalizationMethod, targetNodeId, updateNodeData]);

  useEffect(() => {
    const handleDeleteTable = () => {
      updateNodeData(id, (prev) => ({
        ...prev,
        table: null,
      }));

      setExecutionState("waiting");

      if (targetNodeId) {
        dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
      }
    };

    const handleExecute = async (e) => {
      const sourceTable = e.detail.table;

      if (sourceTable) {
        tableRef.current = sourceTable;

        const newTable = await requestNormalization();

        if (targetNodeId && newTable) {
          dispatchWindowEvent(getExecuteEventName(targetNodeId), {
            table: newTable,
          });
        }
      }
    };

    window.addEventListener(getExecuteEventName(id), handleExecute);
    window.addEventListener(getDeleteTablesEventName(id), handleDeleteTable);

    return () => {
      window.removeEventListener(getExecuteEventName(id), handleExecute);
      window.removeEventListener(getDeleteTablesEventName(id), handleDeleteTable);
    };
  }, [id, requestNormalization, targetNodeId, updateNodeData]);

  useEffect(() => {
    dispatchWindowEvent(getDeleteTablesEventName(id));
  }, [normalizationMethod, id]);

  return (
    <NodeShell
      icon={<FaBalanceScale />}
      title={t("pipeline.nodes.NormalizationNode.label", { defaultValue: "Normalization" })}
      eyebrow={t("pipeline.eyebrow.node", { defaultValue: "Node" })}
      accent="violet"
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
      footer={(
        <NodeRunButton
          disabled={!tableRef.current}
          onClick={requestNormalization}
          accent="violet"
        >
          {t("pipeline.actions.normalize", { defaultValue: "Normalize" })}
        </NodeRunButton>
      )}
    >
      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />

      <NodeSection
        label={t("pipeline.nodes.NormalizationNode.methodLabel", { defaultValue: "Normalization method" })}
        tooltip={t("pipeline.nodes.NormalizationNode.methodTooltip", { defaultValue: "Choose how the signal values are rescaled before the next processing step." })}
        fieldId="normalization-method"
      >
        <select
          id="normalization-method"
          data-testid="Select normalization"
          value={normalizationMethod}
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              setNormalizationMethod(value);
            }
          }}
          className={uiSelectClass}
        >
          <option value="zscore">Z-score</option>
          <option value="minmax">Min-max</option>
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
        accent="violet"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="custom-handle"
      />
    </NodeShell>
  );
}

export default NormalizationNode;
