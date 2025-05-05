import { useEffect } from 'react';
import { Handle, Position, useNodeConnections, useNodesData } from '@xyflow/react';
import { Card } from '@mantine/core';
import DownloadSignal from '../../common/DownloadSignal';

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
  const incomingConnections = useNodeConnections({ type: 'target' });

  // Find the source node ID from connections
  const sourceId = incomingConnections?.find(conn => conn.target === id)?.source;

  const sourceNodeData = useNodesData(sourceId);
  const table = sourceNodeData?.data?.table;

  // Update the global chart data when source data changes
  useEffect(() => {
    data.setChartDataProcessed(table);
  }, [sourceId, sourceNodeData]);

  return (
    <Card className="bg-white border-0 shadow-lg rounded-lg p-4 mt-2 relative overflow-visible">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-bold text-lg text-dark">Processed Signal</span>
      </div>

      {/* If no table yet, show loading message */}
      {!table ? (
        <div
          className="shadow-sm"
          style={{
            maxHeight: '230px',
            overflowY: 'auto',
            marginTop: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            backgroundColor: '#fff'
          }}
        >
          <p style={{ padding: 10 }}>⌛ Waiting for processed signal...</p>
        </div>
      ) : (
        <div className="shadow-sm max-h-[230px] overflow-y-auto border border-gray-300 rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2"></th>
                <th className="font-semibold text-dark p-2">{table[0][0]}</th>
                <th className="font-semibold text-dark p-2">{table[0][1]}</th>
              </tr>
            </thead>
            <tbody>
              {table.slice(1, 10).map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{row[0].toFixed(4)}</td>
                  <td className="p-2">{row[1].toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* If table exists, enable CSV download */}
      {table && (
        <div className="p-2 border-top d-flex justify-content-center" style={{ maxWidth: '300px' }}>
          <DownloadSignal table={table} name='processed'></DownloadSignal>
        </div>
      )}

      {/* Handle for incoming connections */}
      <Handle type="target" position={Position.Left} className="custom-handle" />
    </Card>
  );
}

export default OutputSignal;
