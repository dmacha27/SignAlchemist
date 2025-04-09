import { useEffect, useState } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';

function InputHandle({ id, label, onTable }) {
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: id,
  });

  const sourceNodeId = connections?.[0]?.source;
  const nodeData = useNodesData(sourceNodeId);

  useEffect(() => {
    if (nodeData?.data?.table) {
      onTable(nodeData.data.table);
    }
  }, [nodeData]);

  return (
    <div>
      <Handle
        type="target"
        position={Position.Left}
        id={id}
        className="handle"
      />
      <label>{label}</label>
    </div>
  );
}

function ProcessingNode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  const [inputTable, setInputTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Esperando');

  const handleProcess = async () => {
    if (!inputTable || inputTable.length <= 1) {
      setStatus("Sin datos de entrada");
      return;
    }

    setLoading(true);
    setStatus("Procesando...");

    const formData = new FormData();
    const signalOnly = inputTable.slice(1); // remove header

    formData.append('signal', JSON.stringify(signalOnly));
    formData.append('signalType', data.signalType || 'default');

    try {
      const response = await fetch('http://localhost:8000/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Error en la API");

      const result = await response.json();
      const pipeline = result.pipelines[0];

      const processed = [[inputTable[0][0], inputTable[0][1]]]; // headers

      for (let [timestamp, value] of pipeline.signal) {
        processed.push([parseFloat(timestamp), value]);
      }

      updateNodeData(id, (node) => ({
        ...node.data,
        table: processed,
      }));

      setStatus("✓ Procesado");
    } catch (err) {
      console.error("ProcessingNode error:", err);
      setStatus("⚠️ Error");
    }

    setLoading(false);
  };

  return (
    <div className="node">
      <InputHandle id="signalInput" label="Signal In" onTable={setInputTable} />
      <div><strong>Processing Node</strong></div>
      <button onClick={handleProcess} disabled={loading}>
        {loading ? 'Procesando...' : 'Procesar'}
      </button>
      <p style={{ fontSize: '0.85rem', marginTop: 5 }}>{status}</p>
      <Handle type="source" position={Position.Right} id="signalOutput" />
    </div>
  );
}

export default ProcessingNode;
