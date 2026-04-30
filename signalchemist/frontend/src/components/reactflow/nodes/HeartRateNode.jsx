import { useState, useEffect, useRef, useCallback } from "react";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { FaHeartbeat } from "react-icons/fa";
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
import {
  getDefaultHeartRateMethod,
  requestHeartRateAnalysis,
} from "../../hr/hrShared";

function HeartRateNode({ id, data }) {
  const tableRef = useRef(null);
  const initialConfig = parseTechniqueConfig(data.technique, {
    method: data.method,
  });

  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [method, setMethod] = useState(
    initialConfig?.method ?? getDefaultHeartRateMethod()
  );
  const [executionState, setExecutionState] = useState("waiting");

  const connections = useNodeConnections({ type: "target" });
  const isPpg = data.signalType === "PPG";

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
  const beatCount = currentNodeData?.data?.beatCount ?? 0;

  useEffect(() => {
    tableRef.current = incomingTable ?? null;
  }, [incomingTable]);

  useEffect(() => {
    updateNodeData(id, (prev) => ({
      ...prev,
      technique: JSON.stringify({ method }),
      target: targetNodeId,
      method,
      executionState,
    }));
  }, [executionState, id, method, targetNodeId, updateNodeData]);

  const requestHeartRate = useCallback(async () => {
    const table = tableRef.current;
    if (!table || !isPpg) {
      return null;
    }

    setExecutionState("running");

    if (targetNodeId) {
      dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
    }

    try {
      const result = await requestHeartRateAnalysis({
        signal: table.slice(1),
        samplingRate: data.samplingRate,
        signalType: data.signalType,
        method,
      });
      const nextHeartRateTable = [["Timestamp", "Heart Rate"], ...result.data];

      updateNodeData(id, (prev) => ({
        ...prev,
        table: nextHeartRateTable,
        beatCount: result.beatCount,
        outputKind: "heartRate",
      }));

      setExecutionState("executed");
      return { table: nextHeartRateTable };
    } catch (error) {
      const message = error.message || "Failed to compute heart rate";
      console.error(message);
      toast.error(message);
      setExecutionState("error");
      return null;
    }
  }, [data.samplingRate, data.signalType, id, isPpg, method, targetNodeId, updateNodeData]);

  useEffect(() => {
    const handleDeleteTable = () => {
      updateNodeData(id, (prev) => ({
        ...prev,
        table: null,
        beatCount: 0,
        outputKind: null,
      }));

      setExecutionState("waiting");

      if (targetNodeId) {
        dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
      }
    };

    const handleExecute = async (event) => {
      const sourceTable = event.detail.table;

      if (!sourceTable) {
        return;
      }

      tableRef.current = sourceTable;

      const result = await requestHeartRate();

      if (targetNodeId && result?.table) {
        dispatchWindowEvent(getExecuteEventName(targetNodeId), {
          table: result.table,
        });
      }
    };

    window.addEventListener(getExecuteEventName(id), handleExecute);
    window.addEventListener(getDeleteTablesEventName(id), handleDeleteTable);

    return () => {
      window.removeEventListener(getExecuteEventName(id), handleExecute);
      window.removeEventListener(getDeleteTablesEventName(id), handleDeleteTable);
    };
  }, [id, requestHeartRate, targetNodeId, updateNodeData]);

  useEffect(() => {
    dispatchWindowEvent(getDeleteTablesEventName(id));
  }, [id, method]);

  return (
    <NodeShell
      icon={<FaHeartbeat />}
      title="Heart Rate"
      eyebrow="Analysis"
      accent="rose"
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
          disabled={!tableRef.current || !isPpg}
          onClick={requestHeartRate}
          accent="rose"
        >
          Compute HR
        </NodeRunButton>
      )}
    >
      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />

      {!isPpg ? (
        <NodeSection compact>
          <p className="text-sm text-amber-700 dark:text-amber-200">
            Heart rate analysis is only available for PPG signals.
          </p>
        </NodeSection>
      ) : null}

      <NodeSection
        label="Method"
        tooltip="Choose between the EmotiBit-style beat-to-beat estimate and NeuroKit's PPG rate pipeline."
        fieldId="heart-rate-method"
      >
        <select
          id="heart-rate-method"
          value={method}
          onChange={(event) => setMethod(event.target.value)}
          className={uiSelectClass}
        >
          <option value="emotibit">EmotiBit</option>
          <option value="neurokit">NeuroKit</option>
        </select>
      </NodeSection>

      <NodeSection compact>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Beats used
          </span>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {beatCount}
          </span>
        </div>
      </NodeSection>

      <NodeOutputPreview
        ready={Boolean(outputTable)}
        rows={outputTable ? outputTable.length - 1 : 0}
        onClick={() => {
          if (outputTable) {
            data.showProcessedPreview(outputTable, [], {
              title: "Heart Rate",
              iconKey: "heart",
              computeMetrics: false,
            });
          }
        }}
        accent="rose"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="custom-handle"
      />
    </NodeShell>
  );
}

export default HeartRateNode;
