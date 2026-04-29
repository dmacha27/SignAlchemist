import { useState, useEffect, useRef, useCallback } from "react";
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
import { diff, average } from "../../utils/dataUtils";
import { NodeOutputPreview, NodeRunButton, NodeSection, NodeShell } from "./NodeShell";
import { uiSelectClass } from "../../common/ui";

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
  const tableRef = useRef(null);
  const samplingRateRef = useRef(data.samplingRate);
  const initialConfig = typeof data.technique === "string"
    ? JSON.parse(data.technique)
    : {
        name: data.interpolationTechnique,
        fields: { "Sampling rate": data.targetSamplingRate },
      };

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

  if (incomingTable) {
    tableRef.current = incomingTable;

    samplingRateRef.current =
      1 / average(diff(incomingTable.slice(1).map((x) => x[0])));
  } else {
    tableRef.current = null;
    samplingRateRef.current = null;
  }

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
    const samplingRate = samplingRateRef.current;

    if (!table) return;

    setExecutionState("running");

    const formData = new FormData();
    formData.append("signal", JSON.stringify(table.slice(1))); // Append the table data (excluding the first row which is assumed to be headers)
    formData.append("interpolation_technique", interpolationTechnique);
    formData.append("source_sampling_rate", parseFloat(samplingRate));
    formData.append("target_sampling_rate", parseFloat(targetSamplingRate));

    const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
    window.dispatchEvent(event);

    try {
      const response = await fetch("/api/resampling", {
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

      const new_table = [table[0]].concat(result.data); // Combine the original header with the resampled data

      updateNodeData(id, (prev) => ({
        ...prev,
        table: new_table,
      }));

      setExecutionState("executed");
      return new_table;
    } catch (error) {
      console.error("Failed to apply resampling:", error);
      toast.error("Failed to apply resampling");

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

      const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
      window.dispatchEvent(event);
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
          1 / average(diff(table_source.slice(1).map((x) => x[0])));

        const new_table = await requestResample();

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
  }, [id, requestResample, targetNodeId, updateNodeData]);

  /**
   * Trigger a delete event when form is changed.
   */
  useEffect(() => {
    const event = new CustomEvent(`delete-source-tables${id}`);
    window.dispatchEvent(event);
  }, [interpolationTechnique, targetSamplingRate, id]);

  return (
    <NodeShell
      icon={<FaChartLine />}
      title="Resampling"
      eyebrow="Node"
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
          Resample
        </NodeRunButton>
      }
    >
      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />

      <NodeSection label="Interpolation technique">
          <select
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

      <NodeSection label="Target sampling rate">
          <input
            type="number"
            step={1}
            min={1}
            placeholder="Enter Hz"
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
            data.setChartDataProcessed(outputTable);
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
