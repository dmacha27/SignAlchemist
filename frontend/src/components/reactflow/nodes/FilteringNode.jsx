import { useState, useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form } from 'react-bootstrap';
import FilterFields from '../../FilterFields';
import { FaClock, FaSpinner, FaCheck, FaExclamationCircle } from 'react-icons/fa';


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
  const [targetNodeId, setTargetNodeId] = useState(null);
  const [filter, setFilter] = useState("butterworth");
  const [fields, setFields] = useState(filtersFields[filter]);
  const signalType = data.signalType;
  const samplingRate = data.samplingRate;
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
        const new_table = await requestFilter();

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
  }, [targetNodeId, filter, fields]);


  const requestFilter = async () => {
    if (!table) return;
    setExecutionState('running');
    
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

    const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
    window.dispatchEvent(event);

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

      setExecutionState('executed');
      return new_table;
    } catch (error) {
      console.error('Failed to apply filter:', error);
      updateNodeData(id, (prev) => ({
        ...prev,
        table: table,
      }));

      setExecutionState('error');
      return table;
    }

  };

  const handleFieldChange = (field, new_value) => {
    setFields((prevFields) => ({ ...prevFields, [field]: { value: new_value } }));
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
        onClick={() => requestFilter()}
        disabled={!table}
      >
        Filter
      </Button>
      <Handle type="source" position={Position.Right} id="output" />
      <div style={{ position: 'absolute', top: 5, right: 5 }}>
        {renderExecutionIcon()}
      </div>
    </div>
  );
}

export default FilteringNode;
