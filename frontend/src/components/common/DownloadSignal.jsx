import { Button } from 'react-bootstrap'; // Si estás usando React-Bootstrap

/**
 * DownloadSignal component generates a downloadable CSV file from the provided table.
 * 
 * @param {Object} props
 * @param {Array} props.table - A 2D array containing the data to be included in the CSV.
 * @param {string} props.name - The name to be used for the downloaded CSV file.
 */
const DownloadSignal = ({ table, name }) => {
    const csvContent = table.map(row => row.join(',')).join('\n');
    const downloadBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(downloadBlob);
  
    return (
      <Button
        variant="success"
        className="p-2 mt-1"
        href={url}
        download={`${name}_signal.csv`}
      >
        📥 Download CSV
      </Button>
    );
  };


export default DownloadSignal;