import { useState, useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form, Card } from 'react-bootstrap';
import { FaBullseye, FaEye, FaTrash } from 'react-icons/fa';
import ExecutionIcon from '../../common/ExecutionIcon';
import toast from 'react-hot-toast';

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
  const [outlierTechnique, setOutlierTechnique] = useState('hampel');
  const [executionState, setExecutionState] = useState('waiting');

  const connections = useNodeConnections({ type: 'target' });

  // Update source and target node IDs when connections change
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
     * Deletes the current node's table and notifies the next node.
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

    return () => { // Clean up events when dependencies change (avoid multiple listeners of the same type)
      window.removeEventListener(`execute-node${id}`, handleExecute);
      window.removeEventListener(`delete-source-tables${id}`, handleDeleteTable);
    };
  }, [targetNodeId, outlierTechnique]);

  /**
   * Trigger a delete event when filter configuration changes.
   */  useEffect(() => {
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
    formData.append('signal', JSON.stringify(signalOnly));
    formData.append('outlier_technique', outlierTechnique);

    const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
    window.dispatchEvent(event);

    try {
      const response = await fetch('http://localhost:8000/outliers', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error);
        throw new Error(errorData.error);
      }

      const result = await response.json();

      const new_table = [table[0]].concat(result.data); // Add headers back

      updateNodeData(id, (prev) => ({
        ...prev,
        table: new_table,
      }));

      setExecutionState('executed');
      return new_table;
    } catch (error) {
      console.error('Failed to apply outliers:', error);
      updateNodeData(id, (prev) => ({
        ...prev,
        table: table, // Reset to original table on error
      }));

      setExecutionState('error');
      return table;
    }
  };

  return (
    <Card className="bg-white border-0 shadow-lg rounded-3 p-4 position-relative">
      {/* Header section with title, state icon, and action buttons */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-1">
          <FaBullseye className="text-secondary" size={20} />
          <span className="fw-bold fs-5 text-dark">Outlier Detection</span>

          {/* Node execution state icon */}
          <div className="bg-light p-2 rounded-3 border border-secondary shadow-sm" title={executionState}
            onClick={() => {
              toast.custom(
                <div className='toast-status'>
                  <div>Status:</div>
                  <div><ExecutionIcon executionState={executionState} /></div>
                  <div>{executionState}</div>
                </div>
              )
            }
            }>
            <ExecutionIcon executionState={executionState} />
          </div>

          {/* Button to see the node output */}
          <div
            className="bg-light p-2 rounded-3 border border-secondary shadow-sm"
            title="See output"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (currentNodeData?.data?.table) {
                data.setChartDataProcessed(currentNodeData.data.table);
              } else {
                toast.error("Execute node first");
              }
            }}
          >
            <FaEye />
          </div>

          {/* Button to delete the node */}
          <div
            className="bg-light p-2 rounded-3 border border-secondary shadow-sm"
            title="Delete node"
            style={{ cursor: 'pointer' }}
            onClick={() => { data.deleteNode(id); }}
          >
            <FaTrash className="text-danger" />
          </div>
        </div>
      </div>

      {/* Handle for incoming connections */}
      <Handle type="target" position={Position.Left} className="custom-handle" />

      {/* Outlier detection configuration form */}
      <Form>
        <Form.Group className="mb-4" controlId="outlierTechnique">
          <Form.Label className="text-uppercase small fw-medium text-muted mb-2">
            Select Outlier Technique
          </Form.Label>
          <Form.Select
            size="sm"
            value={outlierTechnique}
            onChange={(e) => setOutlierTechnique(e.target.value)}
            className="border-0 bg-light rounded-3 shadow-sm"
          >
            <option value="hampel">Hampel</option>
            <option value="iqr">IQR</option>
          </Form.Select>
        </Form.Group>
      </Form>

      {/* Button to apply the outlier detection */}
      <div className="d-grid">
        <Button
          variant="secondary"
          size="sm"
          disabled={!table}
          onClick={requestOutliers}
          className="rounded-2 fw-semibold"
        >
          Apply Outliers
        </Button>
      </div>

      {/* Handle for outgoing connections */}
      <Handle type="source" position={Position.Right} className="custom-handle" />
    </Card>
  );
}

export default OutliersNode;
