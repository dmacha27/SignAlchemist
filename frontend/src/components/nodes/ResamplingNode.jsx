import { useState, useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form } from 'react-bootstrap';

function ResamplingNode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [interpolationTechnique, setInterpolationTechnique] = useState('spline');
  const samplingRate = data.samplingRate;

  const incomingConnections = useNodeConnections({
    type: 'target',
  });

  useEffect(() => {
    const sourceId = incomingConnections?.find(conn => conn.target === id)?.source;
    setSourceNodeId(sourceId);
  }, [incomingConnections]);

  const sourceNodeData = useNodesData(sourceNodeId);
  const table = sourceNodeData?.data?.table;

  const requestResample = async (interpolation_technique, target_sampling_rate) => {
    if (!table) return;
    console.log(samplingRate)
    const formData = new FormData();
    formData.append('signal', JSON.stringify(table.slice(1)));
    formData.append('interpolation_technique', interpolation_technique);
    formData.append('source_sampling_rate', parseFloat(samplingRate));
    formData.append('target_sampling_rate', parseFloat(target_sampling_rate));

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
    } catch (error) {
      console.error('Failed to apply resampling:', error);
      updateNodeData(id, (prev) => ({
        ...prev,
        table: table,
      }));
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
            defaultValue={samplingRate}
            id="samplingRate"
          />
        </Form.Group>
      </Form>
      <Button
        className="m-2"
        onClick={() => requestResample(interpolationTechnique, document.getElementById("samplingRate").value)}
      >
        Resample
      </Button>
      <Handle type="source" position={Position.Right} />

    </div>
  );
}

export default ResamplingNode;
