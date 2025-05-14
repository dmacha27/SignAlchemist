import { useState, useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Card, Button, Select, Tooltip } from '@mantine/core';
import { Form } from 'react-bootstrap';
import { FaChartLine, FaTrash, FaEye } from 'react-icons/fa';
import ExecutionIcon from '../../common/ExecutionIcon';
import toast from 'react-hot-toast';

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
  const samplingRate = data.samplingRate;
  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [interpolationTechnique, setInterpolationTechnique] = useState('spline');
  const [targetSamplingRate, setTargetSamplingRate] = useState(samplingRate);
  const [executionState, setExecutionState] = useState('waiting');

  const connections = useNodeConnections({
    type: 'target',
  });

  // Set source and target node IDs based on the current connections
  useEffect(() => {
    const sourceId = connections?.find(conn => conn.target === id)?.source;
    const targetId = connections?.find(conn => conn.source === id)?.target;
    setSourceNodeId(sourceId);
    setTargetNodeId(targetId);
  }, [connections]);

  const currentNodeData = useNodesData(id);
  const sourceNodeData = useNodesData(sourceNodeId);
  let table = sourceNodeData?.data?.table;

  useEffect(() => {

    /**
     * Handler to delete the current node's table and propagate the event to the next node.
     */
    const handleDeleteTable = () => {
      updateNodeData(id, (prev) => ({
        ...prev,
        table: null,
      }));

      setExecutionState('waiting');

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
        table = table_source;
        const new_table = await requestResample();

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

    return () => { // Clean up events when dependencies change (avoid multiple listeners of the same type)
      window.removeEventListener(`execute-node${id}`, handleExecute);
      window.removeEventListener(`delete-source-tables${id}`, handleDeleteTable);
    };
  }, [targetNodeId, interpolationTechnique, targetSamplingRate]);

  /**
   * Trigger a delete event when form is changed.
   */
  useEffect(() => {
    const event = new CustomEvent(`delete-source-tables${id}`);
    window.dispatchEvent(event);

  }, [interpolationTechnique, targetSamplingRate]);

  /**
   * Makes a request to the server to resample the table data.
   * @returns {Array} The new resampled table.
   */
  const requestResample = async () => {
    if (!table) return;

    setExecutionState('running');

    const formData = new FormData();
    formData.append('signal', JSON.stringify(table.slice(1)));  // Append the table data (excluding the first row which is assumed to be headers)
    formData.append('interpolation_technique', interpolationTechnique);
    formData.append('source_sampling_rate', parseFloat(samplingRate));
    formData.append('target_sampling_rate', parseFloat(targetSamplingRate));

    const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
    window.dispatchEvent(event);

    try {
      const response = await fetch('http://localhost:8000/resampling', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error);
        throw new Error(errorData.error);
      }

      const result = await response.json();

      const new_table = [table[0]].concat(result.data);  // Combine the original header with the resampled data

      updateNodeData(id, (prev) => ({
        ...prev,
        table: new_table,
      }));

      setExecutionState('executed');
      return new_table;
    } catch (error) {
      console.error('Failed to apply resampling:', error);
      updateNodeData(id, (prev) => ({
        ...prev,
        table: table,  // Reset to original table in case of error
      }));

      setExecutionState('error');
      return table;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 shadow-lg dark:shadow-xl rounded-lg p-4 mt-2 relative overflow-visible border-0 dark:border dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FaChartLine className="text-blue-600" size={20} />
          <span className="font-bold text-lg text-gray-800 dark:text-white">Resampling</span>

          {/* Node execution state icon */}
          <Tooltip label={executionState} withArrow position="bottom">
            <div
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer"
              onClick={() => {
                toast.custom(
                  <div className='toast-status'>
                    <div>Status:</div>
                    <div><ExecutionIcon executionState={executionState} /></div>
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
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer"
              onClick={() => {
                if (currentNodeData?.data?.table) {
                  data.setChartDataProcessed(currentNodeData.data.table);
                } else {
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
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer"
              onClick={() => { data.deleteNode(id); }}
            >
              <FaTrash className="text-red-500" />
            </div>
          </Tooltip>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="custom-handle" />

      {/* Form */}
      <Form>
        <Form.Group className="mb-4" controlId="interpTechnique">
          <Form.Label className="text-uppercase text-sm font-medium text-muted dark:text-gray-300 mb-2">
            Interpolation technique
          </Form.Label>
          <Select
            size="sm"
            value={interpolationTechnique}
            onChange={setInterpolationTechnique}
            data={[
              { value: 'spline', label: 'Spline' },
              { value: '1d', label: 'Interp1d' }
            ]}
            className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg shadow-sm text-black dark:text-white"
            classNames={{
              input: 'bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600',
              dropdown: 'dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600',
               item: `
                  dark:data-[hover]:bg-gray-700 !important
                  data-[selected]:bg-blue-100 dark:data-[selected]:bg-blue-600 
                  data-[selected]:text-black dark:data-[selected]:text-white
                `
            }}
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="samplingRate">
          <Form.Label className="text-uppercase text-sm font-medium text-muted dark:text-gray-300 mb-2">
            New rate (Hz)
          </Form.Label>
          <input
            type="number"
            step={1}
            placeholder="Enter Hz"
            value={targetSamplingRate}
            onChange={(event) => setTargetSamplingRate(event.target.value)}
            className="w-full text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm px-3 py-2 text-black dark:text-white"
          />
        </Form.Group>
      </Form>

      {/* Button */}
      <div className="w-full">
        <Button
          variant="subtle"
          size="sm"
          disabled={!table}
          onClick={requestResample}
          className={`rounded-lg font-semibold w-full dark:bg-gray-800 dark:hover:bg-gray-700 ${!table ? '' : 'dark:text-white'}`}
        >
          Resample
        </Button>
      </div>

      <Handle type="source" position={Position.Right} className="custom-handle" />
    </Card>
  );
}

export default ResamplingNode;
