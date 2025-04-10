import { useState, useEffect, useCallback } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form } from 'react-bootstrap';
import { FaClock, FaSpinner, FaCheck, FaExclamationCircle } from 'react-icons/fa';

function OutliersNode({ id }) {
  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [outlierTechnique, setOutlierTechnique] = useState('hampel');
  const [executionState, setExecutionState] = useState('waiting');

  const connections = useNodeConnections({
    type: 'target',
  });

  useEffect(() => {
    const sourceId = connections?.find(conn => conn.target === id)?.source;
    const targetId = connections?.find(conn => conn.source === id)?.target;
    setSourceNodeId(sourceId);
    setTargetNodeId(targetId);
  }, [connections]);

  const sourceNodeData = useNodesData(sourceNodeId);
  let table = sourceNodeData?.data?.table;

  useEffect(() => {

    const handleDeleteTable = () => {
      updateNodeData(id, (prev) => ({
        ...prev,
        table: null,
      }));

      setExecutionState('waiting');

      const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
      window.dispatchEvent(event);
    };

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
      window.removeEventListener(`execute-node${id}`, handleExecute);
      window.removeEventListener(`delete-source-tables${id}`, handleDeleteTable);

    };
  }, [targetNodeId, outlierTechnique]);


  const requestOutliers = async () => {
    if (!table) return;

    const signalOnly = table.slice(1);
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

      if (!response.ok) throw new Error('Outlier API request failed.');

      const result = await response.json();

      const new_table = [table[0]].concat(result.data);

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
        table: table,
      }));

      setExecutionState('error');
      return table;
    }
  };

  const renderExecutionIcon = () => {
      switch (executionState) {
        case 'waiting':
          return <FaClock />;
        case 'running':
          return <FaSpinner className="spin" />;
        case 'executed':
          return <FaCheck />;
        case 'error':
          return <FaExclamationCircle />;
        default:
          return null;
      }
    };


  return (
    <div className="node shadow-sm p-3" style={{ border: '1px solid #ddd', borderRadius: '5px' }}>
      <h5>Outliers</h5>
      <Handle type="target" position={Position.Left} />

      <Form>
        <Form.Group className="form-group">
          <Form.Label>Outlier technique</Form.Label>
          <Form.Select
            className="form-control"
            id="outlierTechnique"
            value={outlierTechnique}
            onChange={(e) => setOutlierTechnique(e.target.value)}
          >
            <option value="hampel">Hampel</option>
            <option value="iqr">IQR</option>
          </Form.Select>
        </Form.Group>
      </Form>
      
      <Button
        className='m-2'
        variant="success"
        disabled={!table}
        onClick={() => requestOutliers(outlierTechnique)}
      >
        Apply Outliers
      </Button>
      <Handle type="source" position={Position.Right} />

      <div style={{ position: 'absolute', top: 5, right: 5 }}>
        {renderExecutionIcon()}
      </div>
    </div>
  );
}

export default OutliersNode;
