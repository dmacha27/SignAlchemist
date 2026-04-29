import { memo, useState } from "react";
import PropTypes from "prop-types";
import { diff, average } from "../utils/dataUtils.js";
import { SimplePagination } from "./ui";

/**
 * InfoTable component renders a table displaying signal data and additional information like duration and sampling rate.
 *
 * @param {Object} props
 * @param {Array} props.table - A 2D array where the first row contains headers and subsequent rows contain data points.
 * @param {boolean} props.onlyTable - A flag indicating whether to display only the table without additional info.
 */
const InfoTable = memo(({ table, onlyTable }) => {
  const headers = table[0];
  const data = table.slice(1);

  const duration = data[data.length - 1][0] - data[0][0];
  const signalLength = data.length;
  const samplingRateCalculated = 1 / average(diff(data.map((row) => row[0])));

  const seconds_to_minutes = (s) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins} min ${secs} s`;
  };

  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const paginatedData = data.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const rows = paginatedData.map((row, index) => (
    <tr
      key={`${index + 1}`}
      className={`border border-gray-200 dark:border-gray-600 ${
        index % 2 === 0
          ? "bg-white dark:bg-gray-800"
          : "bg-gray-100 dark:bg-gray-700"
      }`}
    >
      <td className="text-black dark:text-white border border-gray-200 px-3 py-2 dark:border-gray-600">
        {(page - 1) * rowsPerPage + index + 1}
      </td>
      <td className="text-black dark:text-white border border-gray-200 px-3 py-2 dark:border-gray-600">
        {row[0].toFixed(4)}
      </td>
      <td className="text-black dark:text-white border border-gray-200 px-3 py-2 dark:border-gray-600">
        {row[1].toFixed(4)}
      </td>
    </tr>
  ));

  return (
    <div className="text-black dark:text-white">
      {!onlyTable && (
        <div className="shadow-sm rounded-xl border border-gray-200 dark:border dark:border-gray-600 p-2 mb-2 bg-white dark:bg-gray-900">
          <p>
            <strong>Duration:</strong> {seconds_to_minutes(duration)}
          </p>
          <p>
            <strong>Sampling rate: </strong>
            <span
              title={`${samplingRateCalculated} Hz`}
              className="cursor-help"
            >
              {samplingRateCalculated.toFixed(2)} Hz
            </span>
          </p>
          <p>
            <strong>Signal length:</strong> {signalLength} samples
          </p>
        </div>
      )}
      <div className="shadow-md rounded-xl border border-gray-200 dark:border dark:border-gray-600 p-2 bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse">
            <thead className="bg-white dark:bg-gray-800">
              <tr className="border border-gray-200 dark:border-gray-600">
                <th className="border border-gray-200 px-3 py-2 text-left dark:border-r dark:border-gray-600 text-black dark:text-white">
                  #
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left dark:border-r dark:border-gray-600 text-black dark:text-white">
                  {headers[0]}
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left dark:border-gray-600 text-black dark:text-white">
                  {headers[1]}
                </th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 overflow-x-auto">
            <SimplePagination page={page} onChange={setPage} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
});

InfoTable.propTypes = {
  table: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  onlyTable: PropTypes.bool.isRequired,
};

export default InfoTable;
