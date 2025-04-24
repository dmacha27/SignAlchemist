import { useEffect, useState } from 'react';
import { Handle, Position, useNodeConnections, useNodesData } from '@xyflow/react';
import { Table, Card } from 'react-bootstrap';


function InputSignal({ id, data }) {
  const [headers, setHeaders] = useState(data.table[0]);
  const [table, setTable] = useState(data.table);

  const outgoingConnections = useNodeConnections({
    type: 'source',
  });

  const targetNodeId = outgoingConnections?.find(conn => conn.source === id)?.target;

  useEffect(() => {

    const handleDeleteTable = () => {
      const event = new CustomEvent(`delete-source-tables${targetNodeId}`);
      window.dispatchEvent(event);
    };

    const handleExecute = () => {
      const event = new CustomEvent(`execute-node${targetNodeId}`, {
        detail: { table: data.table },
      });
      window.dispatchEvent(event);
    };

    window.addEventListener('start-execute', handleExecute);
    window.addEventListener('delete-source-tables0', handleDeleteTable);

    return () => {
      window.removeEventListener('start-execute', handleExecute);
      window.removeEventListener('delete-source-tables0', handleDeleteTable);
    };
  }, [targetNodeId]);


  return (
    <Card className="bg-white border-0 shadow-lg rounded-3 p-4 position-relative mt-2">
      <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
        <span className="fw-bold fs-5 text-dark">Original Signal</span>
      </div>

      <div className="shadow-sm" style={{ maxHeight: '230px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
        <Table striped bordered hover size="sm" className="table-sm">
          <thead className="bg-light">
            <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <th>{""}</th>
              <th className="fw-semibold text-dark">{headers[0]}</th>
              <th className="fw-semibold text-dark">{headers[1]}</th>
            </tr>
          </thead>
          <tbody>
            {table.slice(1, 10).map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row[0].toFixed(4)}</td>
                <td>{row[1].toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Handle type="source" position={Position.Right} className="custom-handle" />
    </Card>
  );
}

export default InputSignal;