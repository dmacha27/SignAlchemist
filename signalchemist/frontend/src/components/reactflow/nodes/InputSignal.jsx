import { useEffect } from "react";
import { Handle, Position, useNodeConnections } from "@xyflow/react";
import { FaWaveSquare } from "react-icons/fa";

import { NodeDataTable, NodeSection, NodeShell } from "./NodeShell";

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

  const outgoingConnections = useNodeConnections({
    type: "source",
  });

  // Find the target node ID from the outgoing connection
  const targetNodeId = outgoingConnections?.find(
    (conn) => conn.source === id
  )?.target;
  data["target"] = targetNodeId;

  useEffect(() => {
    /**
     * Handler to propagate the table deletion event.
     */
    const handleDeleteTable = () => {
      const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
      window.dispatchEvent(event);
    };

    /**
     * Handler to propagate the node execution event.
     */
    const handleExecute = () => {
      const event = new CustomEvent(`execute-node${targetNodeId}`, {
        detail: { table: table },
      });
      window.dispatchEvent(event);
    };

    window.addEventListener("start-execute", handleExecute);
    window.addEventListener("delete-source-tables0", handleDeleteTable);

    return () => {
      // Clean up events when unmount or targetNodeId changes (avoid multiple listeners of the same type)
      window.removeEventListener("start-execute", handleExecute);
      window.removeEventListener("delete-source-tables0", handleDeleteTable);
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
