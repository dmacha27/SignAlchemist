import { useState, useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form } from 'react-bootstrap';
import FilterFields from '../FilterFields';

const filtersFields = {
  butterworth: {
    order: { value: 2 },
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: { value: "" }
  },
  bessel: {
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: { value: "" }
  },
  fir: {
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: { value: "" }
  },
  savgol: {
    order: { value: 2 },
    lowcut: { value: 0 },
    highcut: { value: 1000 },
    python: { value: "" }
  },
};


function FilteringNode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  const [sourceNodeId, setSourceNodeId] = useState(null);

  const [filter, setFilter] = useState("butterworth");
  const [fields, setFields] = useState(filtersFields[filter]);
  const signalType = data.signalType;
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
  //console.log("Filter", sourceNodeData)

  const requestFilter = async (signalType, samplingRate) => {

    const formData = new FormData();

    const signalOnly = table.slice(1);

    formData.append('signal', JSON.stringify(signalOnly));
    formData.append('signal_type', signalType);
    formData.append('sampling_rate', samplingRate);

    Object.keys(fields).forEach((field) => {
      const fieldValue = fields[field].value;
      formData.append(field, fieldValue);
    });

    formData.append('method', filter);

    try {
      const response = await fetch('http://localhost:8000/filtering', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Filter API request failed.');

      const result = await response.json();

      const new_table = [table[0]].concat(result.data);

      updateNodeData(id, (prev) => ({
        ...prev,
        table: new_table,
      }));
    } catch (error) {
      console.error('Failed to apply filter:', error);
      updateNodeData(id, (prev) => ({
        ...prev,
        table: table,
      }));
    }

  };

  const handleFieldChange = (field, new_value) => {
    setFields((prevFields) => ({ ...prevFields, [field]: { value: new_value } }));
  };

  return (
    <div className="node shadow-sm p-3" style={{ border: '1px solid #ddd', borderRadius: '5px' }}>
      <h5>Filtering</h5>
      <Handle type="target" position={Position.Left} />

      <Form>
        <Form.Group>
          <Form.Label>Filtering technique</Form.Label>
          <Form.Select id="filterTechnique"
            onChange={(event) => {
              setFilter(event.target.value);
              setFields(filtersFields[event.target.value]);
            }}
          >
            <option value="butterworth">Butterworth</option>
            <option value="bessel">Bessel</option>
            <option value="fir">Fir</option>
            <option value="savgol">Savgol</option>
          </Form.Select>
        </Form.Group>

        <FilterFields fields={fields} onFieldChange={handleFieldChange} />
      </Form>
      <Button
        className="m-2"
        onClick={() => requestFilter(signalType, samplingRate)}
      >
        Filter
      </Button>
      <Handle type="source" position={Position.Right} id="output" />

    </div>
  );
}

export default FilteringNode;
