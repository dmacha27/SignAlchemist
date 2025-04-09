import { useState, useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form } from 'react-bootstrap';
import { FaClock, FaSpinner, FaCheck } from 'react-icons/fa';

function ResamplingNode({ id, data }) {
  const samplingRate = data.samplingRate;
  const { updateNodeData } = useReactFlow(); 
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [interpolationTechnique, setInterpolationTechnique] = useState('spline');
  const [targetSamplingRate, setTargetSamplingRate] = useState(samplingRate);
  const [executionState, setExecutionState] = useState('waiting');
  

  useEffect(() => {

    updateNodeData(id, (prev) => ({
      ...prev,
      execute: () => {
        console.log("GOLA");  
        requestResample();
      },
    }));

    // Clean table for execution
    const handleDeleteTables = () => {
      updateNodeData(id, (prev) => ({
        ...prev,
        table: null,
      }));
      setExecutionState('waiting');
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

  const requestResample = async () => {
    if (!table) return;
    setExecutionState('running');

    const formData = new FormData();
    formData.append('signal', JSON.stringify(table.slice(1)));
    formData.append('interpolation_technique', interpolationTechnique);
    formData.append('source_sampling_rate', parseFloat(samplingRate));
    formData.append('target_sampling_rate', parseFloat(targetSamplingRate));

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
    } catch (error) {
      console.error('Failed to apply resampling:', error);
      updateNodeData(id, (prev) => ({
        ...prev,
        table: table,
      }));
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
      default:
        return null;
    }
  };

  return (
    <div className="node shadow-sm p-3" style={{ border: '1px solid #ddd', borderRadius: '5px' }}>
      <h5>Resampling</h5>
      <Handle type="target" position={Position.Left} />

      <Form>
        <Form.Group className="form-group">
          <Form.Label>Interpolation technique</Form.Label>
          <Form.Select
            className="form-control"
            id="interpTechnique"
            value={interpolationTechnique}
            onChange={(e) => setInterpolationTechnique(e.target.value)}
          >
            <option value="spline">Spline</option>
            <option value="1d">Interp1d</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="form-group">
          <Form.Label>New rate (Hz)</Form.Label>
          <Form.Control
            type="number"
            placeholder='Enter Hz'
            value={targetSamplingRate}
            onChange={(e) => setTargetSamplingRate(e.target.value)}
            id="samplingRate"
          />
        </Form.Group>
      </Form>
      <Button
        className="m-2"
        onClick={() => requestResample()}
      >
        Resample
      </Button>
      <Handle type="source" position={Position.Right} />
      
      <div style={{ position: 'absolute', top: 5, right: 5 }}>
        {renderExecutionIcon()}
      </div>
    </div>
  );
}

export default ResamplingNode;
