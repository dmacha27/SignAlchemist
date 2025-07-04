import { useState, useEffect } from "react";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { Card, Button, Select, Tooltip } from "@mantine/core";
import { Form } from "react-bootstrap";
import { FaBullseye, FaEye, FaTrash } from "react-icons/fa";
import ExecutionIcon from "../../common/ExecutionIcon";
import toast from "react-hot-toast";
import HandleLimit from "../edges/HandleLimit";

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
  }, [connections]);

  const currentNodeData = useNodesData(id);
  const sourceNodeData = useNodesData(sourceNodeId);
  let table = sourceNodeData?.data?.table;

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
        table = table_source;
        const new_table = await requestOutliers();

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
  }, [targetNodeId, outlierTechnique]);

  /**
   * Trigger a delete event when filter configuration changes.
   */
  useEffect(() => {
    const event = new CustomEvent(`delete-source-tables${id}`);
    window.dispatchEvent(event);
  }, [outlierTechnique]);

  /**
   * Makes a request to apply the selected outlier detection technique.
   * @returns {Array} New table after removing outliers
   */
  const requestOutliers = async () => {
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
      updateNodeData(id, (prev) => ({
        ...prev,
        table: table, // Reset to original table on error
      }));

      setExecutionState("error");
      return table;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-600 shadow-lg dark:shadow-xl rounded-lg p-4 relative overflow-visible">
      {/* Header section with title, state icon, and action buttons */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FaBullseye className="text-secondary dark:text-white" size={20} />
          <span className="font-bold text-lg text-dark dark:text-white">
            Outlier Detection
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

      {/* Handle for incoming connections */}
      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />
      {/* Outlier detection configuration form */}
      <Form>
        <Form.Group className="mb-4" controlId="outlierTechnique">
          <Form.Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Outlier Technique
          </Form.Label>
          <Select
            size="sm"
            data-testid="Select outlier"
            value={outlierTechnique}
            onChange={(e) => setOutlierTechnique(e)}
            data={[
              { value: "hampel", label: "Hampel" },
              { value: "iqr", label: "IQR" },
            ]}
            className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg shadow-sm text-black dark:text-white"
            classNames={{
              input:
                "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600",
              dropdown:
                "dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600",
              item: `
                  dark:data-[hover]:bg-gray-700 !important
                  data-[selected]:bg-blue-100 dark:data-[selected]:bg-blue-600 
                  data-[selected]:text-black dark:data-[selected]:text-white
                `,
            }}
          />
        </Form.Group>
      </Form>

      {/* Button to apply the outlier detection */}
      <div className="w-full">
        <Button
          variant="subtle"
          size="sm"
          color="grey"
          disabled={!table}
          onClick={requestOutliers}
          className={`rounded-lg font-semibold w-full dark:bg-gray-800 dark:hover:bg-gray-700 ${
            !table ? "" : "dark:text-white"
          }`}
        >
          Apply Outliers
        </Button>
      </div>

      {/* Handle for outgoing connections */}
      <Handle
        type="source"
        position={Position.Right}
        className="custom-handle"
      />
    </Card>
  );
}

export default OutliersNode;
