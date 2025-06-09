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
export function generateDataOriginal(
  file_headers,
  rows,
  timestampColumn,
  signalValues,
  samplingRate
) {
  let data_original = [
    [file_headers[timestampColumn], file_headers[signalValues]],
  ];

  // y values (or what are supposed to be y values) do not need processing (they are the signal)
  const y = rows.map((row) => parseFloat(row[signalValues]));

  // x values need processing in case there are no timestamps present in the data file
  if (timestampColumn == file_headers.length - 1) {
    // Last header should be "Timestamp (calc)" always
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

/**
 * Calculates the difference between each pair of consecutive elements in an array.
 *
 * @param {number[]} A - The input array of numbers.
 * @returns {number[]} An array of differences between consecutive elements.
 *
 * @see https://stackoverflow.com/q/30399123
 */
export const diff = (A) => {
  return A.slice(1).map((item, index) => {
    return item - A[index];
  });
};

/**
 * Calculates the arithmetic mean (average) of an array of numbers.
 *
 * @param {number[]} array - The array of numbers to average.
 * @returns {number} The average of the numbers.
 *
 * @see https://stackoverflow.com/q/29544371
 */
export const average = (array) => array.reduce((a, b) => a + b) / array.length;
