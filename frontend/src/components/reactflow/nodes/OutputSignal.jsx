import { useEffect } from "react";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
} from "@xyflow/react";
import { Card } from "@mantine/core";
import DownloadSignal from "../../common/DownloadSignal";
import HandleLimit from "../edges/HandleLimit";

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
  }, [sourceId, sourceNodeData]);

  return (
    <Card className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-600 shadow-lg dark:shadow-xl rounded-lg p-4 mt-2 relative overflow-visible">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-bold text-lg text-black dark:text-white">
          Processed Signal
        </span>
      </div>

      {/* If no table yet, show loading message */}
      {!table ? (
        <div className="shadow-sm max-h-[230px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mt-2">
          <p
            className="text-gray-800 dark:text-gray-300 dark:bg-gray-800"
            style={{ padding: 10 }}
          >
            ⌛ Waiting for processed signal...
          </p>
        </div>
      ) : (
        <div className="shadow-sm max-h-[230px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="p-2"></th>
                <th className="font-semibold text-dark dark:text-white p-2">
                  {table[0][0]}
                </th>
                <th className="font-semibold text-dark dark:text-white p-2">
                  {table[0][1]}
                </th>
              </tr>
            </thead>
            <tbody>
              {table.slice(1, 10).map((row, index) => (
                <tr
                  key={index}
                  className="border-b dark:border-gray-700 odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800"
                >
                  <td className="p-2 dark:text-gray-300">{index + 1}</td>
                  <td className="p-2 dark:text-gray-300">
                    {row[0].toFixed(4)}
                  </td>
                  <td className="p-2 dark:text-gray-300">
                    {row[1].toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* If table exists, enable CSV download */}
      {table && (
        <div
          className="p-2 border-t border-gray-200 dark:border-gray-700 flex justify-center mx-auto mt-3"
          style={{ maxWidth: "300px" }}
        >
          <DownloadSignal table={table} name="processed"></DownloadSignal>
        </div>
      )}

      {/* Handle for incoming connections */}
      <HandleLimit
        type="target"
        position={Position.Left}
        className="custom-handle"
        connectionCount={1}
      />
    </Card>
  );
}

export default OutputSignal;
