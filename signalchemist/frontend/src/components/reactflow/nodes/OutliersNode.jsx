import { useState, useEffect, useRef, useCallback } from "react";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { Select } from "@mantine/core";
import { FaBullseye } from "react-icons/fa";
import toast from "react-hot-toast";
import HandleLimit from "../edges/HandleLimit";
import { NodeRunButton, NodeSection, NodeShell } from "./NodeShell";

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
  const tableRef = useRef(null);

  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [outlierTechnique, setOutlierTechnique] = useState("hampel");
  const [executionState, setExecutionState] = useState("waiting");

  const connections = useNodeConnections({ type: "target" });

  data["technique"] = JSON.stringify({
    name: outlierTechnique,
  });
  data["target"] = targetNodeId;

  // Update source and target node IDs when connections change
  useEffect(() => {
    const sourceId = connections?.find((conn) => conn.target === id)?.source;
    const targetId = connections?.find((conn) => conn.source === id)?.target;
    setSourceNodeId(sourceId);
    setTargetNodeId(targetId);
  }, [connections, id]);

  const currentNodeData = useNodesData(id);
  const sourceNodeData = useNodesData(sourceNodeId);
  tableRef.current = sourceNodeData?.data?.table;

  const requestOutliers = useCallback(async () => {
    const table = tableRef.current;
    if (!table) return;

    setExecutionState("running");

    const signalOnly = table.slice(1); // Exclude headers
    const formData = new FormData();
    formData.append("signal", JSON.stringify(signalOnly));
    formData.append("outlier_technique", outlierTechnique);

    const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
    window.dispatchEvent(event);

    try {
      const response = await fetch("/api/outliers", {
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
      console.error("Failed to apply outliers:", error);
      toast.error("Failed to apply outliers");

      setExecutionState("error");
      return null;
    }
  }, [id, outlierTechnique, targetNodeId, updateNodeData]);

  useEffect(() => {
    /**
     * Deletes the current node's table and notifies the next node.
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
     * Handles execution request: applies outlier detection to incoming table.
     * @param {Event} e - The event containing the table data.
     */
    const handleExecute = async (e) => {
      const table_source = e.detail.table;

      if (table_source) {
        tableRef.current = table_source;

        const new_table = await requestOutliers();

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
  }, [id, requestOutliers, targetNodeId, updateNodeData]);

  /**
   * Trigger a delete event when filter configuration changes.
   */
  useEffect(() => {
    const event = new CustomEvent(`delete-source-tables${id}`);
    window.dispatchEvent(event);
  }, [outlierTechnique, id]);

  return (
    <NodeShell
      icon={<FaBullseye />}
      title="Outlier Detection"
      eyebrow="Node"
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
      onOutputClick={() => {
        if (currentNodeData?.data?.table) {
          data.setChartDataProcessed(currentNodeData.data.table);
        } else {
          console.error("Execute node first");
          toast.error("Execute node first");
        }
      }}
      onDeleteClick={() => {
        data.deleteNode(id);
      }}
      outputTestId={`output${id}`}
      deleteTestId={`delete${id}`}
      footer={
        <NodeRunButton
          disabled={!tableRef.current}
          onClick={requestOutliers}
          accent="amber"
        >
          Apply Outliers
        </NodeRunButton>
      }
    >
      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />

      <NodeSection label="Detection technique">
          <Select
            size="sm"
            data-testid="Select outlier"
            value={outlierTechnique}
            onChange={(value) => {
              if (value) {
                setOutlierTechnique(value);
              }
            }}
            data={[
              { value: "hampel", label: "Hampel" },
              { value: "iqr", label: "IQR" },
            ]}
            className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg shadow-sm text-black dark:text-white"
            classNames={{
              input:
                "rounded-xl border border-slate-300 bg-white text-slate-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white",
              dropdown:
                "bg-white dark:bg-gray-900 text-black dark:text-white border border-slate-300 dark:border-gray-700",
              option:
                "hover:bg-slate-100 dark:hover:bg-gray-800 data-[checked]:bg-amber-50 data-[checked]:text-slate-900 dark:data-[checked]:bg-amber-500/15 dark:data-[checked]:text-white",
            }}
          />
      </NodeSection>

      <Handle
        type="source"
        position={Position.Right}
        className="custom-handle"
      />
    </NodeShell>
  );
}

export default OutliersNode;
