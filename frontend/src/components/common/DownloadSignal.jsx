import { useState } from 'react';
import { Button, Form, InputGroup, Alert } from 'react-bootstrap';

/**
 * DownloadSignal component generates a downloadable file from the provided table.
 * 
 * @param {Object} props
 * @param {Array} props.table - A 2D array containing the data to be included in the CSV.
 * @param {string} props.name - The name to be used for the downloaded file.
 */
const DownloadSignal = ({ table, name }) => {
  const [onlySignal, setOnlySignal] = useState(false);
  const [withHeader, setWithHeader] = useState(true);
  const [separator, setSeparator] = useState(',');
  const [extension, setExtension] = useState('csv');
  const [error, setError] = useState('');

  const generateContent = () => {
    let data = onlySignal ? table.map(row => [row[1]]) : table;
    if (!withHeader) data = data.slice(1);
    return data.map(row => row.join(separator)).join('\n');
  };

  const handleDownload = () => {
    if (separator === '.') return;
    const blob = new Blob([generateContent()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_signal.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSeparatorChange = (e) => {
    const newSeparator = e.target.value;
    setSeparator(newSeparator);
    setError(newSeparator === '.' ? 'The separator cannot be a dot (".")' : '');
  };

  return (
    <div className="mt-2 p-2 border rounded bg-light text-center">
      <div className="d-inline-flex flex-wrap align-items-center justify-content-center gap-2 mb-2">
        <Form.Check
          type="switch"
          label="Only signal"
          checked={onlySignal}
          onChange={e => setOnlySignal(e.target.checked)}
          className="m-0"
        />
        <Form.Check
          type="switch"
          label="Include header"
          checked={withHeader}
          onChange={e => setWithHeader(e.target.checked)}
          className="m-0"
        />
        <InputGroup size="sm" className="w-auto">
          <InputGroup.Text>Sep</InputGroup.Text>
          <Form.Control
            size="sm"
            value={separator}
            onChange={handleSeparatorChange}
            className="text-center w-auto"
            style={{ maxWidth: '30px', fontSize: '0.8rem', display: 'inline-block' }}
          />
        </InputGroup>
        <Form.Select
          size="sm"
          value={extension}
          onChange={e => setExtension(e.target.value)}
          className="w-auto"
        >
          <option value="csv">csv</option>
          <option value="txt">txt</option>
        </Form.Select>
        <Button
          variant="success"
          size="sm"
          onClick={handleDownload}
          disabled={separator === '.'}
        >
          📥 Download
        </Button>
        {error && <Alert variant="danger" className="h6 small mt-1">{error}</Alert>}
      </div>
    </div>
  );
};

export default DownloadSignal;
