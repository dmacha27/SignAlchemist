import { useEffect, useState } from 'react';
import { Handle, Position, useNodeConnections, useNodesData } from '@xyflow/react';
import { Table } from 'react-bootstrap';


function InputSignal({ id, data }) {
  const [headers, setHeaders] = useState(data.table[0]);
  const [table, setTable] = useState(data.table);


  const outgoingConnections = useNodeConnections({
    type: 'source',
  });

  const targetId = outgoingConnections?.find(conn => conn.source === id)?.target;
  const targetNodeData = useNodesData(targetId);

  useEffect(() => {
  
      const handleExecute = () => {
        console.log(targetNodeData?.data);
        targetNodeData.data.execute();
      };
  
      window.addEventListener('generate-table', handleExecute);
  
      return () => {
        window.removeEventListener('generate-table', handleExecute);
      };
    }, [targetNodeData]);

  return (
    <>
      <div className="shadow-sm" style={{ maxHeight: '230px', overflowY: 'auto', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr style={{ position: 'sticky', top: 0 }}>
              <th>{""}</th>
              <th>{headers[0]}</th>
              <th>{headers[1]}</th>
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
        <Handle type="source" position={Position.Right} />
      </div>
    </>
  );
}

export default InputSignal;