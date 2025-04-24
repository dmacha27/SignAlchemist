import { useState, useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form, Card } from 'react-bootstrap';
import { FaChartLine } from 'react-icons/fa';
import ExecutionIcon from '../../common/ExecutionIcon';

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

    return () => {
      window.removeEventListener(`execute-node${id}`, handleExecute);
      window.removeEventListener(`delete-source-tables${id}`, handleDeleteTable);
    };
  }, [targetNodeId, interpolationTechnique, targetSamplingRate]);


  const requestResample = async () => {
    if (!table) return;
    setExecutionState('running');

    const formData = new FormData();
    formData.append('signal', JSON.stringify(table.slice(1)));
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

      if (!response.ok) throw new Error('Resampling API request failed.');

      const result = await response.json();

      const new_table = [table[0]].concat(result.data);

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
        table: table,
      }));

      setExecutionState('error');
      return table;
    }
  };

  return (
    <Card className="bg-white border-0 shadow-lg rounded-3 p-4 position-relative">
      <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
        <FaChartLine className="text-primary" size={20} />
        <span className="fw-bold fs-5 text-dark">Resampling</span>
      </div>
      <Handle type="target" position={Position.Left} className="custom-handle" />

      <Form>
        <Form.Group className="mb-4" controlId="interpTechnique">
          <Form.Label className="text-uppercase small fw-medium text-muted mb-2">
            Interpolation technique
          </Form.Label>
          <Form.Select
            size="sm"
            value={interpolationTechnique}
            onChange={(e) => setInterpolationTechnique(e.target.value)}
            className="border-0 bg-light rounded-3 shadow-sm"
          >
            <option value="spline">Spline</option>
            <option value="1d">Interp1d</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-4" controlId="samplingRate">
          <Form.Label className="text-uppercase small fw-medium text-muted mb-2">
            New rate (Hz)
          </Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter Hz"
            value={targetSamplingRate}
            onChange={(e) => setTargetSamplingRate(e.target.value)}
            className="border-0 bg-light rounded-3 shadow-sm"
          />
        </Form.Group>
      </Form>

      <div className="d-grid">
        <Button
          variant="primary"
          size="sm"
          disabled={!table}
          onClick={() => requestResample()}
          className="rounded-2 fw-semibold"
        >
          Resample
        </Button>
      </div>

      <Handle type="source" position={Position.Right} className="custom-handle" />

      <div className="position-absolute" style={{ top: 0, right: '2px' }}>
        <div className="bg-light">
          <ExecutionIcon executionState={executionState}></ExecutionIcon>
        </div>
      </div>
    </Card>
  );

}

export default ResamplingNode;
