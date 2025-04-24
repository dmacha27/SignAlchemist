import { useState, useEffect, useCallback } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form, Card } from 'react-bootstrap';
import { FaBullseye } from 'react-icons/fa';
import ExecutionIcon from '../../common/ExecutionIcon';

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


  return (
    <Card className="bg-white border-0 shadow-lg rounded-3 p-4 position-relative">
      <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
        <FaBullseye className="text-secondary" size={20} />
        <span className="fw-bold fs-5 text-dark">Outlier Detection</span>
      </div>

      <Handle type="target" position={Position.Left} className="custom-handle" />

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

      <Handle type="source" position={Position.Right} className="custom-handle" />

      <div className="position-absolute" style={{ top: 0, right: '2px', zIndex: 10 }}>
        <div className="bg-light">
          <ExecutionIcon executionState={executionState}></ExecutionIcon>
        </div>
      </div>
    </Card>

  );
}

export default OutliersNode;
