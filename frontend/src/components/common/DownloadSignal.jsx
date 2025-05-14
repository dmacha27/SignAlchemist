import { useState, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * DownloadSignal component generates a downloadable file from the provided table.
 * 
 * @param {Object} props
 * @param {Array} props.table - A 2D array containing the data to be included in the CSV.
 * @param {string} props.name - The name to be used for the downloaded file.
 */
const DownloadSignal = memo(({ table, name }) => {
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
    if (separator.includes('.')) return;
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
    setError(newSeparator.includes('.') ? 'The separator cannot be a dot (".")' : '');
  };

  return (
    <div className="mt-2 p-4 border-0 dark:border dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-900 text-center text-black dark:text-white">
      <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={onlySignal}
              onChange={e => setOnlySignal(e.target.checked)}
              className="form-checkbox text-green-500 dark:bg-gray-800 dark:border-gray-600"
            />
            <span>Only signal</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={withHeader}
              onChange={e => setWithHeader(e.target.checked)}
              className="form-checkbox text-green-500 dark:bg-gray-800 dark:border-gray-600"
            />
            <span>Include header</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Sep</span>
          <input
            type="text"
            value={separator}
            onChange={handleSeparatorChange}
            className="w-12 text-center text-sm font-medium border-0 dark:border dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-800 text-black dark:text-white"
            style={{ maxWidth: '40px' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={extension}
            onChange={e => setExtension(e.target.value)}
            className="w-auto text-sm font-medium border-0 dark:border dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-800 text-black dark:text-white"
          >
            <option value="csv">csv</option>
            <option value="txt">txt</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={separator.includes('.')}
            className="bg-green-500 text-white text-sm py-2 px-4 rounded disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            📥 Download
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
);


DownloadSignal.propTypes = {
  table: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    )
  ).isRequired,
  name: PropTypes.string.isRequired,
};

export default DownloadSignal;
