import { useEffect } from 'react';
import { Handle, Position, useNodeConnections, useNodesData } from '@xyflow/react';
import { Table, Button, Card } from 'react-bootstrap';

function OutputSignal({ id, data }) {
  const incomingConnections = useNodeConnections({
    type: 'target',
  });

  const sourceId = incomingConnections?.find(conn => conn.target === id)?.source;
  const sourceNodeData = useNodesData(sourceId);
  const table = sourceNodeData?.data?.table;
  data.setChartDataProcessed(table);

  useEffect(() => {
    if (table) {
      const processedMetricsForm = new FormData();
      processedMetricsForm.append("signal", JSON.stringify(table.slice(1)));
      processedMetricsForm.append("signal_type", data.signalType);
      processedMetricsForm.append("sampling_rate", data.samplingRate);

      fetch('http://localhost:8000/metrics', {
        method: 'POST',
        body: processedMetricsForm,
      })
        .then(async (res) => {
          const metricsProcessed = await res.json();
          if (!res.ok) {
            console.log(metricsProcessed.error);
            toast.error(metricsProcessed.error);
            return;
          }
          data.setMetricsProcessed(metricsProcessed);
        });
    } else {
      data.setMetricsProcessed(null);
    }
  }, [table]);


  return (
    <Card className="bg-white border-0 shadow-lg rounded-3 p-4 position-relative mt-2">
      <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
        <span className="fw-bold fs-5 text-dark">Processed Signal</span>
      </div>

      {!table ? (
        <div
          className="shadow-sm"
          style={{
            maxHeight: '230px',
            overflowY: 'auto',
            marginTop: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            backgroundColor: '#fff'
          }}
        >
          <p style={{ padding: 10 }}>⌛ Waiting for processed signal...</p>
        </div>
      ) : (
        <div className="shadow-sm" style={{ maxHeight: '230px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
          <Table striped bordered hover size="sm" className="mb-0 table-sm">
            <thead className="bg-light">
              <tr style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#fff' }}>
                <th>{""}</th>
                <th className="fw-semibold text-dark">{table[0][0]}</th>
                <th className="fw-semibold text-dark">{table[0][1]}</th>
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
      )}

      {table && (
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
      )}

      <Handle type="target" position={Position.Left} className="custom-handle" />
    </Card>
  );


}

export default OutputSignal;