/**
 * Generates an array of data pairs, each consisting of a timestamp and a signal value.
 * 
 * @param {Array} file_headers - Array containing the file headers.
 * @param {Array} rows - Data rows from the file.
 * @param {number} timestampColumn - The index of the column with timestamp data.
 * @param {string} signalValues - The key for the column with signal values.
 * @param {number} samplingRate - Sampling rate used when no timestamps are provided.
 * @returns {Array} - 2D array of timestamp and signal value pairs.
 */
function generateDataOriginal(file_headers, rows, timestampColumn, signalValues, samplingRate) {
    let data_original = [[file_headers[timestampColumn], file_headers[signalValues]]];
  
    // y values (or what are supposed to be y values) do not need processing (they are the signal)
    const y = rows.map(row => parseFloat(row[signalValues]));
  
    // x values need processing in case there are no timestamps present in the data file
    if (timestampColumn == file_headers.length - 1) {
      for (let i = 0; i < y.length; i++) {
        const timestamp = i * (1 / samplingRate);
        data_original.push([timestamp, y[i]]);
      }
    } else {
      for (let i = 0; i < rows.length; i++) {
        const timestamp = parseFloat(rows[i][timestampColumn]);
        data_original.push([timestamp, y[i]]);
      }
    }
  
    return data_original;
}

export default generateDataOriginal;
