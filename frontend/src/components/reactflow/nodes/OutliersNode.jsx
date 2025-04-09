import { useState, useEffect, useCallback } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form } from 'react-bootstrap';

function OutliersNode({ id }) {
  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [outlierTechnique, setOutlierTechnique] = useState('hampel');

  useEffect(() => {
    const handleDeleteTables = () => {
      updateNodeData(id, (prev) => ({
        ...prev,
        table: null,
      }));
    };

    window.addEventListener('delete-source-tables', handleDeleteTables);

    return () => {
      window.removeEventListener('delete-source-tables', handleDeleteTables);
    };
  }, [id]);

  const incomingConnections = useNodeConnections({
    type: 'target',
  });

  useEffect(() => {
    const sourceId = incomingConnections?.find(conn => conn.target === id)?.source;
    setSourceNodeId(sourceId);
  }, [incomingConnections]);

  const sourceNodeData = useNodesData(sourceNodeId);
  const table = sourceNodeData?.data?.table;

  const requestOutliers = async (outlier_technique) => {
    if (!table) return;

    const signalOnly = table.slice(1);
    const formData = new FormData();
    formData.append('signal', JSON.stringify(signalOnly));
    formData.append('outlier_technique', outlier_technique);


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
    } catch (error) {
      console.error('Failed to apply outliers:', error);
      updateNodeData(id, (prev) => ({
        ...prev,
        table: table,
      }));
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

    </div>
  );
}

export default OutliersNode;
