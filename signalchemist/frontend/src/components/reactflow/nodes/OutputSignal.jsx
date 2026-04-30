import { useEffect, useMemo } from "react";
import { Position, useNodeConnections, useNodesData } from "@xyflow/react";
import { FaArrowCircleDown } from "react-icons/fa";

import DownloadSignal from "../../common/DownloadSignal";
import HandleLimit from "../edges/HandleLimit";
import {
  NodeDataTable,
  NodeOutputPreview,
  NodeSection,
  NodeShell,
} from "./NodeShell";
import { buildPeakMarkers } from "../../peaks/peaksShared";

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
  const peaks = useMemo(
    () => sourceNodeData?.data?.peaks ?? [],
    [sourceNodeData?.data?.peaks]
  );
  const outputKind = sourceNodeData?.data?.outputKind ?? null;

  // Update the global chart data when source data changes
  useEffect(() => {
    if (outputKind === "heartRate") {
      data.showProcessedPreview(table, [], { computeMetrics: false });
      return;
    }

    data.showProcessedPreview(table, buildPeakMarkers(peaks));
  }, [data, outputKind, peaks, sourceId, sourceNodeData, table]);

  const handleSee = () => {
    if (outputKind === "heartRate") {
      data.showProcessedPreview(table, [], { computeMetrics: false });
    } else {
      data.showProcessedPreview(table, buildPeakMarkers(peaks));
    }
    data.scrollToCharts?.();
  };

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

      <NodeOutputPreview
        ready={Boolean(table)}
        rows={table ? table.length - 1 : 0}
        onClick={handleSee}
        accent="emerald"
      />

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
