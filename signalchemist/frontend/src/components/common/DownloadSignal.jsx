import { memo, useState } from "react";
import PropTypes from "prop-types";

const DownloadSignal = memo(({ table, name }) => {
  const [onlySignal, setOnlySignal] = useState(false);
  const [withHeader, setWithHeader] = useState(true);
  const [separator, setSeparator] = useState(",");
  const [extension, setExtension] = useState("csv");
  const [error, setError] = useState("");

  const generateContent = () => {
    let data = onlySignal ? table.map((row) => [row[1]]) : table;
    if (!withHeader) {
      data = data.slice(1);
    }
    return data.map((row) => row.join(separator)).join("\n");
  };

  const handleDownload = () => {
    const blob = new Blob([generateContent()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}_signal.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSeparatorChange = (event) => {
    const nextSeparator = event.target.value;
    setSeparator(nextSeparator);

    if (nextSeparator.length !== 1) {
      setError("The separator must be a single character");
    } else if (nextSeparator === ".") {
      setError('The separator cannot be a dot (".")');
    } else if (!isNaN(nextSeparator)) {
      setError("The separator cannot be a number");
    } else {
      setError("");
    }
  };

  return (
    <div className="mt-3 w-full min-w-0 rounded-[1rem] bg-slate-50/80 p-4 text-slate-900 dark:bg-gray-950/60 dark:text-white">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="inline-flex min-w-0 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlySignal}
            onChange={(event) => setOnlySignal(event.target.checked)}
            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-900"
          />
          Only signal
        </label>
        <label className="inline-flex min-w-0 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={withHeader}
            onChange={(event) => setWithHeader(event.target.checked)}
            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-900"
          />
          Include header
        </label>
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-medium">Sep</span>
          <input
            type="text"
            value={separator}
            onChange={handleSeparatorChange}
            className="w-12 rounded-md border border-slate-300 bg-white p-1 text-center text-sm font-medium text-slate-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <select
          value={extension}
          onChange={(event) => setExtension(event.target.value)}
          className="w-full min-w-0 rounded-md border border-slate-300 bg-white p-1.5 text-sm font-medium text-slate-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          <option value="csv">csv</option>
          <option value="txt">txt</option>
        </select>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleDownload}
          disabled={!!error}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
        >
          Download
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
});

DownloadSignal.propTypes = {
  table: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  name: PropTypes.string.isRequired,
};

export default DownloadSignal;
