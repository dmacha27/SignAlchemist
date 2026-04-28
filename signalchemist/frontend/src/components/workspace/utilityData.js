import { generateDataOriginal } from "../utils/dataUtils";

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
  const formData = new FormData();
  formData.append("signal", JSON.stringify(signal.slice(1)));
  formData.append("signal_type", signalType);
  formData.append("sampling_rate", samplingRate);

  const response = await fetch("/api/metrics", {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error);
  }

  return payload;
};
