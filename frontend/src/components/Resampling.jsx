import { Link, useLocation } from 'react-router-dom';

const Resampling = () => {
  const location = useLocation();
  const { file, signalType, timestampColumn, samplingRate, signalValues } = location.state || {};

  return (
    <div className="container text-center">
      <h1>Resampling</h1>
      {file ? (
        <div>
          <p><strong>Archivo:</strong> {file.name}</p>
          <p><strong>Tipo de Señal:</strong> {signalType}</p>
          <p><strong>Columna de Tiempo:</strong> {timestampColumn}</p>
          <p><strong>Sampling rate:</strong> {samplingRate}</p>
          <p><strong>Valores de Señal:</strong> {signalValues}</p>
        </div>
      ) : (
        <p>No hay datos disponibles.</p>
      )}
      <Link to="/" className="btn btn-primary">Volver a inicio</Link>
    </div>
  );
};

export default Resampling;
