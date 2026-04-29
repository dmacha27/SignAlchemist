const PYTHON_FIELD = {
  label: "Python code",
  type: "textarea",
  defaultValue: "",
};

export const filterDefinitions = {
  butterworth: {
    label: "Butterworth",
    fields: {
      order: {
        label: "Order",
        type: "number",
        defaultValue: 2,
        min: 1,
      },
      lowcut: {
        label: "Lowcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
      },
      highcut: {
        label: "Highcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
      },
      python: PYTHON_FIELD,
    },
  },
  bessel: {
    label: "Bessel",
    fields: {
      lowcut: {
        label: "Lowcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
      },
      highcut: {
        label: "Highcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
      },
      python: PYTHON_FIELD,
    },
  },
  fir: {
    label: "FIR",
    fields: {
      lowcut: {
        label: "Lowcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
      },
      highcut: {
        label: "Highcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
      },
      python: PYTHON_FIELD,
    },
  },
  savgol: {
    label: "Savitzky-Golay",
    fields: {
      order: {
        label: "Order",
        type: "number",
        defaultValue: 2,
        min: 1,
      },
      lowcut: {
        label: "Lowcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
      },
      highcut: {
        label: "Highcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
      },
      window_size: {
        label: "Window size",
        type: "number",
        defaultValue: 999,
        min: 3,
      },
      python: PYTHON_FIELD,
    },
  },
  gaussian: {
    label: "Gaussian",
    fields: {
      sigma: {
        label: "Sigma",
        type: "number",
        defaultValue: 100,
        min: 0.01,
      },
      python: PYTHON_FIELD,
    },
  },
};

function createFieldDefaults(fieldDefinitions, samplingRate) {
  return Object.fromEntries(
    Object.entries(fieldDefinitions).map(([fieldName, fieldDefinition]) => {
      if (fieldName === "window_size") {
        const windowSizeBase = Math.max(3, Math.round(samplingRate / 3));
        const windowSize =
          windowSizeBase % 2 === 0 ? windowSizeBase + 1 : windowSizeBase;

        return [fieldName, windowSize];
      }

      return [fieldName, fieldDefinition.defaultValue];
    })
  );
}

export function createFilterDefaults(samplingRate = 1) {
  return Object.fromEntries(
    Object.entries(filterDefinitions).map(([filterName, filterDefinition]) => [
      filterName,
      createFieldDefaults(filterDefinition.fields, samplingRate),
    ])
  );
}

export function getFilterOptions() {
  return Object.entries(filterDefinitions).map(([value, definition]) => ({
    value,
    label: definition.label,
  }));
}
