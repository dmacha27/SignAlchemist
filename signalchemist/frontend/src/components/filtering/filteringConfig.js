const PYTHON_FIELD = {
  label: "Python code",
  type: "textarea",
  defaultValue: "",
  tooltip: "Custom Python function named filter_signal(signal) used as the filtering method.",
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
        tooltip: "Controls how sharp the filter response is. Higher values usually mean a steeper filter.",
      },
      lowcut: {
        label: "Lowcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
        tooltip: "Lower cutoff frequency in Hz. Frequencies below this value are attenuated.",
      },
      highcut: {
        label: "Highcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
        tooltip: "Upper cutoff frequency in Hz. Frequencies above this value are attenuated.",
      },
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
        tooltip: "Lower cutoff frequency in Hz. Frequencies below this value are attenuated.",
      },
      highcut: {
        label: "Highcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
        tooltip: "Upper cutoff frequency in Hz. Frequencies above this value are attenuated.",
      },
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
        tooltip: "Lower cutoff frequency in Hz. Frequencies below this value are attenuated.",
      },
      highcut: {
        label: "Highcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
        tooltip: "Upper cutoff frequency in Hz. Frequencies above this value are attenuated.",
      },
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
        tooltip: "Polynomial order used for local smoothing. Higher values preserve more shape but can overfit noise.",
      },
      lowcut: {
        label: "Lowcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
        tooltip: "Lower cutoff frequency in Hz. Frequencies below this value are attenuated.",
      },
      highcut: {
        label: "Highcut",
        type: "number",
        defaultValue: null,
        min: 0.01,
        optional: true,
        tooltip: "Upper cutoff frequency in Hz. Frequencies above this value are attenuated.",
      },
      window_size: {
        label: "Window size",
        type: "number",
        defaultValue: 999,
        min: 3,
        tooltip: "Number of samples used in each smoothing window. Larger windows produce stronger smoothing.",
      },
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
        tooltip: "Controls how wide the Gaussian smoothing kernel is. Larger values smooth more aggressively.",
      },
    },
  },
  python: {
    label: "Python code",
    fields: {
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

export function getFilterOptions(t = null) {
  return Object.entries(filterDefinitions).map(([value, definition]) => ({
    value,
    label: t ? t(`filtering.options.${value}`, { defaultValue: definition.label }) : definition.label,
  }));
}

export function getTranslatedFieldDefinitions(filter, t = null) {
  const filterDefinition = filterDefinitions[filter];
  if (!filterDefinition || !t) {
    return filterDefinition?.fields ?? {};
  }

  return Object.fromEntries(
    Object.entries(filterDefinition.fields).map(([fieldName, fieldDefinition]) => {
      const tooltipKey =
        filter === "savgol" && fieldName === "order"
          ? "savgolOrder"
          : fieldName;

      return [
        fieldName,
        {
          ...fieldDefinition,
          label: t(`filtering.fields.${fieldName}`, { defaultValue: fieldDefinition.label }),
          tooltip: t(`filtering.tooltips.${tooltipKey}`, { defaultValue: fieldDefinition.tooltip }),
        },
      ];
    })
  );
}
