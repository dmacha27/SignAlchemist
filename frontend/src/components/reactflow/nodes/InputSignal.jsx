import { useEffect, useState } from 'react';
import { Handle, Position, useNodeConnections, useNodesData } from '@xyflow/react';
import { Card } from '@mantine/core';

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
  const [headers, setHeaders] = useState(data.table[0]);
  const [table, setTable] = useState(data.table);

  const outgoingConnections = useNodeConnections({
    type: 'source',
  });

  // Find the target node ID from the outgoing connection
  const targetNodeId = outgoingConnections?.find(conn => conn.source === id)?.target;
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
        detail: { table: data.table },
      });
      window.dispatchEvent(event);
    };

    window.addEventListener('start-execute', handleExecute);
    window.addEventListener('delete-source-tables0', handleDeleteTable);

    return () => { // Clean up events when unmount or targetNodeId changes (avoid multiple listeners of the same type)
      window.removeEventListener('start-execute', handleExecute);
      window.removeEventListener('delete-source-tables0', handleDeleteTable);
    };
  }, [targetNodeId]);

  return (
    <Card className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-600 shadow-lg dark:shadow-xl rounded-lg p-4 mt-2 relative overflow-visible">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-bold text-lg text-black dark:text-white">Original Signal</span>
      </div>

      <div className="shadow-sm max-h-[230px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="p-2"></th>
              <th className="font-semibold text-dark dark:text-white p-2">{headers[0]}</th>
              <th className="font-semibold text-dark dark:text-white p-2">{headers[1]}</th>
            </tr>
          </thead>
          <tbody>
            {table.slice(1, 10).map((row, index) => (
              <tr key={index} className="border-b border-gray-200 dark:border-gray-700 odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                <td className="p-2 text-gray-700 dark:text-gray-300">{index + 1}</td>
                <td className="p-2 text-gray-700 dark:text-gray-300">{row[0].toFixed(4)}</td>
                <td className="p-2 text-gray-700 dark:text-gray-300">{row[1].toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Handle type="source" position={Position.Right} className="custom-handle" />
    </Card>
  );
}

export default InputSignal;
