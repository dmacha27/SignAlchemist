import { useState, useEffect } from 'react';
import { Handle, Position, useNodeConnections, useNodesData } from '@xyflow/react';
import { Table, Button } from 'react-bootstrap';

function OutputSignal({ id, data }) {
  const setChartDataProcessed = data.setData;

  const incomingConnections = useNodeConnections({
    type: 'target',
  });

  const sourceId = incomingConnections?.find(conn => conn.target === id)?.source;
  const sourceNodeData = useNodesData(sourceId);
  const table = sourceNodeData?.data?.table;
  setChartDataProcessed(table);

  return (
    <>
      {!table ? (
        <div
          className="shadow-sm"
          style={{
            maxHeight: '230px',
            overflowY: 'auto',
            marginTop: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
          }}
        >
          <p style={{ padding: 10 }}>⌛ Waiting for processed signal...</p>
        </div>
      ) : (
        <div
          className="shadow-sm"
          style={{
            marginTop: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
          }}
        >
          <div style={{ maxHeight: '230px', overflowY: 'auto' }}>
            <Table striped bordered hover size="sm" className="mb-0">
              <thead>
                <tr style={{ position: 'sticky', top: 0, backgroundColor: '#fff' }}>
                  <th></th>
                  <th>{table[0][0]}</th>
                  <th>{table[0][1]}</th>
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
  
          <div className="p-2 border-top d-flex justify-content-center">
            <Button
              variant="success"
              href={URL.createObjectURL(
                new Blob([table.map(row => row.join(',')).join('\n')], {
                  type: 'text/csv',
                })
              )}
              download="processed_signal.csv"
            >
              📥 Download CSV
            </Button>
          </div>
        </div>
      )}
  
      <Handle type="target" position={Position.Left} />
    </>
  );
  
}

export default OutputSignal;