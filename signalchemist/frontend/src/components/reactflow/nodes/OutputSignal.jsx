import { useEffect } from "react";
import { Position, useNodeConnections, useNodesData } from "@xyflow/react";
import { FaArrowCircleDown } from "react-icons/fa";

import DownloadSignal from "../../common/DownloadSignal";
import HandleLimit from "../edges/HandleLimit";
import { NodeDataTable, NodeSection, NodeShell } from "./NodeShell";

/**
 * OutputSignal component
 *
 * This component represents the final node displaying a processed signal.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.id - Unique identifier for the node
 * @param {Object} props.data - Additional data, including methods to update chart data
 * @returns {JSX.Element} Visual representation of the processed signal
 */
function OutputSignal({ id, data }) {
  const incomingConnections = useNodeConnections({ type: "target" });

  // Find the source node ID from connections
  const sourceId = incomingConnections?.find(
    (conn) => conn.target === id
  )?.source;
  const sourceNodeData = useNodesData(sourceId);
  const table = sourceNodeData?.data?.table;

  // Update the global chart data when source data changes
  useEffect(() => {
    data.setChartDataProcessed(table);
  }, [sourceId, sourceNodeData, data, table]);

  return (
    <NodeShell
      icon={<FaArrowCircleDown />}
      title="Processed Signal"
      eyebrow="Output"
      accent="emerald"
      footer={table ? <DownloadSignal table={table} name="processed" /> : null}
    >
      <NodeSection label="Signal preview">
        <NodeDataTable
          headers={table ? [table[0][0], table[0][1]] : ["Time", "Value"]}
          rows={table ? table.slice(1, 10) : []}
          emptyMessage="Waiting for processed signal..."
        />
      </NodeSection>

      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />
    </NodeShell>
  );
}

export default OutputSignal;
