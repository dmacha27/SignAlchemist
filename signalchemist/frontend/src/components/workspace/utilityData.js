import { generateDataOriginal } from "../utils/dataUtils";
import {
  createFormData,
  postFormData,
} from "../../lib/apiClient";

export const readCsvFile = (file, readString) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      readString(event.target.result, {
        complete: ({ data }) => resolve(data),
        error: reject,
      });
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

export const buildUtilitySourceData = async ({
  file,
  readString,
  timestampColumn,
  signalValues,
  samplingRate,
}) => {
  const parsedRows = await readCsvFile(file, readString);
  const fileHeaders = [...parsedRows[0], "Timestamp (calc)"];
  const rows = parsedRows.slice(1);

  return {
    headers: fileHeaders,
    chartData: generateDataOriginal(
      fileHeaders,
      rows,
      timestampColumn,
      signalValues,
      samplingRate
    ),
  };
};

export const requestSignalMetrics = async ({
  signal,
  signalType,
  samplingRate,
}) => {
  return postFormData(
    "/api/metrics",
    createFormData([
      ["signal", JSON.stringify(signal.slice(1))],
      ["signal_type", signalType],
      ["sampling_rate", String(samplingRate)],
    ]),
    "Failed to compute metrics"
  );
};
