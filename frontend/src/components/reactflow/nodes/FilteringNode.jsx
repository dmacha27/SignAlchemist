import { useState, useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';
import { Button, Form, Card } from 'react-bootstrap';
import FilterFields from '../../common/FilterFields';
import { FaFilter, FaTrash, FaEye } from 'react-icons/fa';
import ExecutionIcon from '../../common/ExecutionIcon';


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

  const currentNodeData = useNodesData(id);
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
  }, [targetNodeId, // Necessary to update event IDs accordingly
    filter, fields]);

  useEffect(() => {
    const event = new CustomEvent(`delete-source-tables${id}`);
    window.dispatchEvent(event);

  }, [filter, fields]);

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

  return (
    <Card className="bg-white border-0 shadow-lg rounded-3 p-4 position-relative">
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <FaFilter className="text-success" size={20} />
          <span className="fw-bold fs-5 text-dark">Filtering</span>

          <div className="bg-light p-2 rounded-3 border border-secondary shadow-sm"
            title={executionState}>
            <ExecutionIcon executionState={executionState} />
          </div>
          <div
            className="bg-light p-2 rounded-3 border border-secondary shadow-sm"
            title='See output'
            style={{ cursor: 'pointer' }}
            onClick={() => {
              console.log(currentNodeData.data.table)
              if (currentNodeData?.data?.table) {
                data.setChartDataProcessed(currentNodeData.data.table);
              }
            }}
          >
            <FaEye />
          </div>
          <div
            className="bg-light p-2 rounded-3 border border-secondary shadow-sm"
            title='Delete node'
            style={{ cursor: 'pointer' }}
            onClick={() => { data.deleteNode(id) }}
          >
            <FaTrash className="text-danger" />
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="custom-handle" />

      <Form>
        <Form.Group className="mb-4" controlId="filterTechnique">
          <Form.Label className="text-uppercase small fw-medium text-muted mb-2">
            Filtering technique
          </Form.Label>
          <Form.Select
            size="sm"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setFields(filtersFields[e.target.value]);
            }}
            className="border-0 bg-light rounded-3 shadow-sm"
          >
            <option value="butterworth">Butterworth</option>
            <option value="bessel">Bessel</option>
            <option value="fir">FIR</option>
            <option value="savgol">Savgol</option>
          </Form.Select>
        </Form.Group>

        <FilterFields fields={fields} onFieldChange={handleFieldChange} />
      </Form>

      <div className="d-grid">
        <Button
          variant="success"
          size="sm"
          onClick={() => requestFilter()}
          disabled={!table}
          className="rounded-2 fw-semibold"
        >
          Filter
        </Button>
      </div>

      <Handle type="source" position={Position.Right} id="output" className="custom-handle" />
    </Card>

  );

}

export default FilteringNode;
