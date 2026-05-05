import { inferSamplingRateFromTimestamps } from "../utils/dataUtils";

export const MAX_DATA_LENGTH = 5000;
export const NO_TIMESTAMPS_LABEL = "No timestamps";
export const SIGNAL_TYPE_OPTIONS = ["", "EDA", "PPG", "OTHER"];

const inferSignalTypeFromSource = (sourceName = "", headers = []) => {
  const normalizedSource = sourceName.toLowerCase();
  const normalizedHeaders = headers.map((header) => header.toLowerCase());

  if (
    normalizedSource.includes("eda") ||
    normalizedHeaders.some((header) => /(^eda$|gsr|electrodermal)/i.test(header))
  ) {
    return "EDA";
  }

  if (
    normalizedSource.includes("ppg") ||
    normalizedHeaders.some((header) => /(^ppg$|^pg$|pulse)/i.test(header))
  ) {
    return "PPG";
  }

  return "";
};

const inferTimestampColumn = (headers = []) => {
  const realHeaders = headers.slice(0, -1);
  const exactMatchIndex = realHeaders.findIndex((header) =>
    /^(timestamp|localtimestamp|time|datetime|date)$/i.test(header)
  );

  if (exactMatchIndex >= 0) {
    return exactMatchIndex;
  }

  const partialMatchIndex = realHeaders.findIndex((header) =>
    /(timestamp|time|date)/i.test(header)
  );

  return partialMatchIndex >= 0 ? partialMatchIndex : headers.length - 1;
};

const inferSignalColumn = ({ headers = [], signalType = "", timestampColumn = -1 }) => {
  const realHeaders = headers.slice(0, -1);
  const preferredPatterns = {
    EDA: /(^eda$|gsr|electrodermal)/i,
    PPG: /(^ppg$|^pg$|pulse)/i,
  };

  const preferredPattern = preferredPatterns[signalType];
  if (preferredPattern) {
    const typedMatchIndex = realHeaders.findIndex((header, index) => {
      if (index === timestampColumn) {
        return false;
      }

      return preferredPattern.test(header);
    });

    if (typedMatchIndex >= 0) {
      return typedMatchIndex;
    }
  }

  for (let index = realHeaders.length - 1; index >= 0; index -= 1) {
    if (index !== timestampColumn) {
      return index;
    }
  }

  return -1;
};

const isHeaderRow = (row = []) => {
  if (!row.length) {
    return false;
  }

  return row.some((cell) => Number.isNaN(parseFloat(cell)));
};

const normalizeHeaders = (firstRow) =>
  firstRow.map((item, index) =>
    Number.isNaN(parseFloat(item)) ? item : `Column ${index + 1}`
  );

const createCsvBlob = (rows) =>
  new Blob(
    [
      rows
        .map((row) => row.join(","))
        .filter((line) => line.trim() !== "")
        .join("\n"),
    ],
    { type: "text/csv" }
  );

export const createDatasetFromCsvRows = (rawRows) => {
  if (!rawRows.length) {
    return null;
  }

  const [firstRow, ...restRows] = rawRows;
  const headers = normalizeHeaders(firstRow);
  const dataRows = isHeaderRow(firstRow) ? restRows : [firstRow, ...restRows];
  const nonEmptyRows = dataRows.filter((row) => row.join("").trim() !== "");
  const fileRows = [headers, ...nonEmptyRows];
  const selectableHeaders = [...headers, NO_TIMESTAMPS_LABEL];

  return {
    file: createCsvBlob(fileRows),
    fileRows,
    headers: selectableHeaders,
    cropValues: [0, nonEmptyRows.length],
    timestampColumn: selectableHeaders.length - 1,
    signalValues: -1,
    samplingRate: null,
    signalType: "",
    chartDataOriginal: null,
  };
};

export const autoConfigureDataset = (dataset, sourceName = "") => {
  if (!dataset || !dataset.headers?.length) {
    return dataset;
  }

  const signalType = inferSignalTypeFromSource(sourceName, dataset.headers);
  const timestampColumn = inferTimestampColumn(dataset.headers);
  const signalValues = inferSignalColumn({
    headers: dataset.headers,
    signalType,
    timestampColumn,
  });

  return {
    ...dataset,
    signalType,
    timestampColumn,
    signalValues,
  };
};

export const parseCsvFile = (file, readString) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      readString(event.target.result, {
        complete: ({ data }) => resolve(createDatasetFromCsvRows(data)),
        error: reject,
      });
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

export const buildChartPreview = ({
  fileRows,
  headers,
  timestampColumn,
  signalValues,
  samplingRate,
  cropValues = null,
}) => {
  if (
    !fileRows ||
    !headers.length ||
    timestampColumn < 0 ||
    signalValues === -1 ||
    signalValues === ""
  ) {
    return null;
  }

  const parsedSignalIndex = parseInt(signalValues);
  if (Number.isNaN(parsedSignalIndex)) {
    return null;
  }

  const rawRows = fileRows.slice(1);
  const rows = cropValues
    ? rawRows.slice(cropValues[0], cropValues[1])
    : rawRows;
  const previewTable = [[headers[timestampColumn], headers[parsedSignalIndex]]];
  const yValues = rows.map((row) => parseFloat(row[parsedSignalIndex]));

  if (timestampColumn === headers.length - 1) {
    if (!samplingRate) {
      return null;
    }

    rows.forEach((_, index) => {
      previewTable.push([index * (1 / samplingRate), yValues[index]]);
    });

    return { chartDataOriginal: previewTable, calculatedSamplingRate: null };
  }

  const pairedRows = rows
    .map((row, index) => [parseFloat(row[timestampColumn]), yValues[index]])
    .sort((a, b) => a[0] - b[0]);

  const xValues = pairedRows.map(([timestamp]) => timestamp);
  const calculatedSamplingRate = inferSamplingRateFromTimestamps(xValues);

  previewTable.push(...pairedRows);

  return {
    chartDataOriginal: previewTable,
    calculatedSamplingRate,
  };
};

export const normalizeSamplingRateInput = (value) => {
  const parsedValue = parseInt(value);

  if (Number.isNaN(parsedValue)) {
    return null;
  }

  return parsedValue;
};

export const normalizeSamplingRateOnBlur = (value) => {
  const parsedValue = parseInt(value);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
};

export const buildCroppedUtilityFile = async ({ file, cropValues, readString }) => {
  if (!file || !cropValues) {
    return file;
  }

  const content = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

  return new Promise((resolve) => {
    readString(content, {
      complete: ({ data }) => {
        const [header, ...rows] = data;
        const [start, end] = cropValues;
        resolve(createCsvBlob([header, ...rows.slice(start, end)]));
      },
    });
  });
};
