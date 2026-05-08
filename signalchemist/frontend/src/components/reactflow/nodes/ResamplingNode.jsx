import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { FaChartLine } from "react-icons/fa";
import toast from "react-hot-toast";
import HandleLimit from "../edges/HandleLimit";
import { inferSamplingRate } from "../../utils/dataUtils";
import { NodeOutputPreview, NodeRunButton, NodeSection, NodeShell } from "./NodeShell";
import { uiSelectClass } from "../../common/ui";
import { parseTechniqueConfig } from "../../processing/processingNodeUtils";
import { requestResampling } from "../../processing/processingRequests";
import {
  dispatchWindowEvent,
  getDeleteTablesEventName,
  getExecuteEventName,
} from "../../processing/processingEvents";

/**
 * ResamplingNode component
 * This component represents a resampling operation node in a flow diagram.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.id - The unique identifier for the current node
 * @param {Object} props.data - Data for the node including functions for deleting the node and updating chart data
 * @returns {JSX.Element} Visual representation of the resampling node with UI for setting parameters and executing the resampling operation
 */
function ResamplingNode({ id, data }) {
  const { t } = useTranslation();
  const tableRef = useRef(null);
  const samplingRateRef = useRef(data.samplingRate);
  const initialConfig = parseTechniqueConfig(data.technique, {
    name: data.interpolationTechnique,
    fields: { "Sampling rate": data.targetSamplingRate },
  });

  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [interpolationTechnique, setInterpolationTechnique] =
    useState(initialConfig?.name ?? "spline");
  const [targetSamplingRate, setTargetSamplingRate] = useState(
    initialConfig?.fields?.["Sampling rate"] ?? data.samplingRate
  );
  const [executionState, setExecutionState] = useState("waiting");

  const connections = useNodeConnections({
    type: "target",
  });
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

  useEffect(() => {
    tableRef.current = incomingTable ?? null;
    samplingRateRef.current = incomingTable
      ? inferSamplingRate(incomingTable) ?? data.samplingRate
      : null;
  }, [data.samplingRate, incomingTable]);

  useEffect(() => {
    updateNodeData(id, (prev) => ({
      ...prev,
      technique: JSON.stringify({
        name: interpolationTechnique,
        fields: { "Sampling rate": targetSamplingRate },
      }),
      target: targetNodeId,
      interpolationTechnique,
      targetSamplingRate,
      samplingRate: data.samplingRate,
      executionState,
    }));
  }, [
    data.samplingRate,
    executionState,
    id,
    interpolationTechnique,
    targetNodeId,
    targetSamplingRate,
    updateNodeData,
  ]);

  const requestResample = useCallback(async () => {
    const table = tableRef.current;

    if (!table) return;

    setExecutionState("running");

    if (targetNodeId) {
      dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
    }

    try {
      const result = await requestResampling({
        signal: table.slice(1),
        interpolationTechnique,
        targetSamplingRate,
      });

      const new_table = [table[0]].concat(result.data); // Combine the original header with the resampled data

      updateNodeData(id, (prev) => ({
        ...prev,
        table: new_table,
      }));

      setExecutionState("executed");
      return new_table;
    } catch (error) {
      const message = error.message || "Failed to apply resampling";
      console.error(message);
      toast.error(message);

      setExecutionState("error");
      return null;
    }
  }, [id, interpolationTechnique, targetNodeId, targetSamplingRate, updateNodeData]);

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

      if (targetNodeId) {
        dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
      }
    };

    /**
     * Handler to execute the resampling process when an event is triggered.
     * @param {Event} e - The event containing the table data to be resampled.
     */
    const handleExecute = async (e) => {
      const table_source = e.detail.table;

      if (table_source) {
        tableRef.current = table_source;

        samplingRateRef.current =
          inferSamplingRate(table_source) ?? data.samplingRate;

        const new_table = await requestResample();

        if (targetNodeId && new_table) {
          dispatchWindowEvent(getExecuteEventName(targetNodeId), {
            table: new_table,
          });
        }
      }
    };

    window.addEventListener(getExecuteEventName(id), handleExecute);
    window.addEventListener(getDeleteTablesEventName(id), handleDeleteTable);

    return () => {
      // Clean up events when dependencies change (avoid multiple listeners of the same type)
      window.removeEventListener(getExecuteEventName(id), handleExecute);
      window.removeEventListener(getDeleteTablesEventName(id), handleDeleteTable);
    };
  }, [data.samplingRate, id, requestResample, targetNodeId, updateNodeData]);

  /**
   * Trigger a delete event when form is changed.
   */
  useEffect(() => {
    dispatchWindowEvent(getDeleteTablesEventName(id));
  }, [interpolationTechnique, targetSamplingRate, id]);

  return (
    <NodeShell
      icon={<FaChartLine />}
      title={t("pipeline.nodes.ResamplingNode.label", { defaultValue: "Resampling" })}
      eyebrow={t("pipeline.eyebrow.node", { defaultValue: "Node" })}
      accent="cyan"
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
          onClick={requestResample}
          accent="cyan"
        >
          {t("pages.resampling.apply")}
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
        label={t("pages.resampling.interpolationTechnique")}
        tooltip={t("pages.resampling.interpolationTooltip")}
        fieldId="resampling-interpolation-technique"
      >
          <select
            id="resampling-interpolation-technique"
            data-testid="Select interpolation"
            value={interpolationTechnique}
            onChange={(event) => {
              const value = event.target.value;
              if (value) {
                setInterpolationTechnique(value);
              }
            }}
            className={uiSelectClass}
          >
            <option value="spline">Spline</option>
            <option value="1d">Interp1d</option>
          </select>
      </NodeSection>

      <NodeSection
        label={t("pages.resampling.newSamplingRate")}
        tooltip={t("pages.resampling.newSamplingRateTooltip")}
        fieldId="resampling-target-sampling-rate"
      >
          <input
            id="resampling-target-sampling-rate"
            type="number"
            step={1}
            min={1}
            placeholder={t("pages.resampling.enterHz")}
            value={targetSamplingRate}
            onChange={(event) =>
              setTargetSamplingRate(parseInt(event.target.value))
            }
            onBlur={(event) => {
              const value = parseInt(event.target.value);
              event.target.value = value;
              if (isNaN(value) || value < 1) {
                event.target.value = 1;
                setTargetSamplingRate(1);
              }
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
      </NodeSection>

      <NodeOutputPreview
        ready={Boolean(outputTable)}
        rows={outputTable ? outputTable.length - 1 : 0}
        onClick={() => {
          if (outputTable) {
            data.showProcessedPreview(outputTable);
          }
        }}
        accent="cyan"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="custom-handle"
      />
    </NodeShell>
  );
}

export default ResamplingNode;
