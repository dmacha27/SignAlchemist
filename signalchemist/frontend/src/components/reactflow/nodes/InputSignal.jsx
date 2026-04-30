import { useEffect } from "react";
import {
  Handle,
  Position,
  useNodeConnections,
  useReactFlow,
} from "@xyflow/react";
import { FaWaveSquare } from "react-icons/fa";

import { NodeDataTable, NodeSection, NodeShell } from "./NodeShell";
import {
  dispatchWindowEvent,
  getDeleteTablesEventName,
  getExecuteEventName,
  ROOT_DELETE_EVENT,
  START_EXECUTE_EVENT,
} from "../../processing/processingEvents";

/**
 * InputSignal component
 * Displays the original signal table and handles connections to other nodes.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.id - The ID of the current node
 * @param {Object} props.data - The data containing the table
 * @returns {JSX.Element} The visual representation of the signal table
 */
function InputSignal({ id, data }) {
  const headers = data.table[0];
  const table = data.table;
  const { updateNodeData } = useReactFlow();

  const outgoingConnections = useNodeConnections({
    type: "source",
  });

  // Find the target node ID from the outgoing connection
  const targetNodeId = outgoingConnections?.find(
    (conn) => conn.source === id
  )?.target;

  useEffect(() => {
    updateNodeData(id, (previous) => ({
      ...previous,
      target: targetNodeId,
    }));
  }, [id, targetNodeId, updateNodeData]);

  useEffect(() => {
    /**
     * Handler to propagate the table deletion event.
     */
    const handleDeleteTable = () => {
      if (targetNodeId) {
        dispatchWindowEvent(getDeleteTablesEventName(targetNodeId));
      }
    };

    /**
     * Handler to propagate the node execution event.
     */
    const handleExecute = () => {
      if (targetNodeId) {
        dispatchWindowEvent(getExecuteEventName(targetNodeId), { table });
      }
    };

    window.addEventListener(START_EXECUTE_EVENT, handleExecute);
    window.addEventListener(ROOT_DELETE_EVENT, handleDeleteTable);

    return () => {
      // Clean up events when unmount or targetNodeId changes (avoid multiple listeners of the same type)
      window.removeEventListener(START_EXECUTE_EVENT, handleExecute);
      window.removeEventListener(ROOT_DELETE_EVENT, handleDeleteTable);
    };
  }, [targetNodeId, table]);

  return (
    <NodeShell
      icon={<FaWaveSquare />}
      title="Original Signal"
      eyebrow="Source"
      accent="cyan"
    >
      <NodeSection label="Signal preview">
        <NodeDataTable headers={headers} rows={table.slice(1, 10)} />
      </NodeSection>

      <Handle
        type="source"
        position={Position.Right}
        className="custom-handle"
      />
    </NodeShell>
  );
}

export default InputSignal;
