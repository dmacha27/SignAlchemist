const en = {
  app: {
    loadingWorkspace: "Loading workspace...",
    theme: {
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
    },
    language: {
      label: "Language",
      en: "EN",
      es: "ES",
    },
    toasts: {
      loadCsvFirst: "Load a CSV first to open this utility",
    },
    feedback: {
      aria: "Help us by filling in the UEQ questionnaire",
      cta: "Help us: Fill in our UEQ survey",
    },
    footer: {
      docsAria: "Read the documentation",
      docs: "Read The Docs",
    },
  },
  nav: {
    home: "Home",
    homeTitle: "Reset and upload again",
    open: "Open navigation menu",
    close: "Close navigation menu",
    actions: {
      resampling: {
        label: "Resampling",
        description: "Open resampling tools",
      },
      filtering: {
        label: "Filtering",
        description: "Open filters",
      },
      peaks: {
        label: "Peaks",
        description: "Open peak detection",
      },
      hr: {
        label: "Heart Rate",
        description: "Open heart rate analysis",
      },
      processing: {
        label: "Processing",
        description: "Open processing",
      },
      batch: {
        label: "Batch",
        description: "Open batch processing",
      },
    },
  },
  common: {
    prev: "Prev",
    next: "Next",
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    export: "Export",
    import: "Import",
    presets: "Presets",
    run: "Run",
    clean: "Clean",
    charts: "Charts",
    resetZoom: "Reset Zoom",
    resetStyle: "Reset Style",
    noData: "No data available",
    noChart: "No chart available",
    processingRequest: "Processing request...",
    waitingForRequest: "Waiting for request...",
    signal: "Signal",
    spectrum: "Spectrum",
    originalSignal: "Original Signal",
    processedSignal: "Processed Signal",
    compare: "Compare",
    sideBySide: "Side by side",
    comparisonView: "Comparison View",
    exportAs: "Export as",
    png: "PNG",
    context: "Context",
    rowCount: "{{count}} rows",
    go: "Go",
    both: "Both",
    info: "Info",
    copy: "Copy",
    copied: "Copied!",
    closeLabel: "Close",
    signalTypeBadge: "Signal type: {{signalType}}",
    pipelineBadgeLoaded: "Pipeline: {{filename}}",
    pipelineBadgeEmpty: "Pipeline: not loaded",
    configureAndReview: "Configure the operation and review the result.",
    higherIsBetter: "Higher is better",
    lowerIsBetter: "Lower is better",
    menu: {
      sampleFiles: "Sample files",
      recommendedPipelines: "Recommended pipelines",
      exportLabel: "Export",
    },
  },
  home: {
    hero: {
      title: "Load and prepare your dataset before processing",
      description:
        "Upload a CSV, define timestamps and values, crop the visible range and preview the result before moving into the tools.",
      aboutProject: "About this project",
      quickStart: "Quick Start",
      steps: {
        one: "Load a sample or upload your own CSV.",
        two: "Configure signal type, columns and sampling rate.",
        threeTitle: "Inspect and crop",
        threeDescription:
          "Use the preview to validate the selected columns and trim the working range before you continue.",
        four: "Continue with Processing, Batch or a single utility.",
      },
    },
    upload: {
      title: "Upload signal",
      description: "Load a CSV manually or use a bundled sample.",
      csvLimit: "CSV up to 50 MB",
      sampleData: "Sample Data",
      moreSamples: "More samples",
      chooseCsv: "Choose CSV",
      dragTitle: "Drag and drop your CSV here",
      dragDescription:
        "Upload your signal CSV file by dragging it here or selecting it manually.",
    },
    configure: {
      title: "Configure dataset",
      description:
        "These values drive the preview and are passed to the selected utility.",
      signalType: "Signal Type",
      timestampColumn: "Timestamp Column",
      samplingRate: "Sampling Rate (Hz)",
      signalValues: "Signal Values",
      enterHz: "Enter Hz",
      samplingRateFooter: "Enabled when the file does not contain timestamps.",
      detectedSamplingRate: "Detected sampling rate of {{value}} Hz",
      signalTypes: {
        empty: "",
        EDA: "EDA",
        PPG: "PPG",
        OTHER: "OTHER",
      },
      noTimestamps: "No timestamps",
      generatedColumn: "Column {{index}}",
    },
    nextStep: {
      title: "Next step",
      description: "Choose the utility once the dataset is ready.",
      ready: "Everything is ready. Choose where you want to continue.",
      missing: "Missing:",
      singleUtilities: "Single Utilities",
      checks: {
        file: "Upload a CSV or load a sample",
        signalType: "Choose a signal type",
        timestamp: "Select the timestamp column",
        signalValues: "Select the signal values column",
        samplingRate: "Set or detect the sampling rate",
      },
      utilities: {
        processing: "Build and validate a custom pipeline.",
        batch: "Run an exported pipeline on multiple CSV files.",
        resampling: "Adjust the sampling rate of one signal.",
        filtering: "Apply a filter directly to the dataset.",
        peaks: "Detect relevant signal peaks.",
        hr: "Estimate heart rate from PPG.",
      },
    },
    preview: {
      title: "Preview",
      description: "Visualize and crop your signal data before proceeding.",
      waitingFile: "Waiting for file...",
      waitingParameters: "Waiting for parameters...",
      rows: "Rows {{start}} - {{end}}",
      rowsFallback: "Rows",
      reset: "Reset",
      crop: "Crop",
      time: "Time",
      value: "Value",
    },
  },
  workspace: {
    backHome: "Home",
  },
  signalTabs: {
    topViews: {
      signal: {
        title: "Signal",
        description: "Raw and processed waveform",
      },
      spectrum: {
        title: "Spectrum",
        description: "FFT and frequency comparison",
      },
    },
    comparisonViews: {
      split: "Side by side",
      overlay: "Compare",
    },
    waitingProcessed: "Please run processing to see {{target}} results.",
    exportMenu: {
      originalSignal: "Original signal",
      originalSpectrum: "Original spectrum",
      processedSignal: "{{target}} signal",
      processedSpectrum: "{{target}} spectrum",
      sideBySide: "Side by side",
    },
  },
  charts: {
    signalBadge: "Signal",
    spectrumBadge: "Spectrum",
    compareBadge: "Compare",
    spectrumCompareBadge: "Spectrum Compare",
    fftTitle: "FFT",
    frequencyHz: "Frequency (Hz)",
    amplitude: "Amplitude",
    dateAxis: "{{name}} (date)",
    millisecondsAxis: "{{name}} (ms)",
    largeDatasetNotice: "Large dataset. Interaction off.",
    exportStillAvailable: "Export is still available.",
    xFocus: "X Focus",
    yBand: "Y Band",
    goToX: "Go to X",
    yMin: "Y min",
    yMax: "Y max",
    xFocusTooltip:
      "Focus the chart around one frequency value. 'Both' applies it to all spectrum views.",
    yBandTooltip:
      "Highlight a Y range and zoom around that amplitude band. 'Both' applies it to all spectrum views.",
    comparisonXFocusTooltip:
      "Focus the comparison around one frequency value.",
    comparisonYBandTooltip:
      "Highlight and zoom the comparison around an amplitude band.",
  },
  metrics: {
    originalTitle: "Original Metrics",
    processedTitle: "Processed Metrics",
    calculating: "Calculating...",
    empty: "Please run processing to see results.",
    metricNumber: "Metric {{index}}",
    noPreference: "No preference",
    noChange: "No change",
    improved: "Improved",
    worse: "Worse",
  },
  table: {
    duration: "Duration",
    samplingRate: "Sampling rate",
    signalLength: "Signal length",
    samples: "samples",
    minutesSeconds: "{{minutes}} min {{seconds}} s",
  },
  download: {
    onlySignal: "Only signal",
    includeHeader: "Include header",
    separator: "Sep",
    button: "Download",
    separatorSingleChar: "The separator must be a single character",
    separatorNoDot: 'The separator cannot be a dot (".")',
    separatorNoNumber: "The separator cannot be a number",
  },
  nodes: {
    source: "Source",
    output: "Output",
    signalPreview: "Signal preview",
    originalSignal: "Original Signal",
    processedSignal: "Processed Signal",
    waitingProcessed: "Waiting for processed signal...",
  },
  filtering: {
    options: {
      butterworth: "Butterworth",
      bessel: "Bessel",
      fir: "FIR",
      savgol: "Savitzky-Golay",
      gaussian: "Gaussian",
      python: "Python code",
    },
    fields: {
      python: "Python code",
      order: "Order",
      lowcut: "Lowcut",
      highcut: "Highcut",
      window_size: "Window size",
      sigma: "Sigma",
    },
    tooltips: {
      python:
        "Custom Python function named filter_signal(signal) used as the filtering method.",
      order:
        "Controls how sharp the filter response is. Higher values usually mean a steeper filter.",
      lowcut:
        "Lower cutoff frequency in Hz. Frequencies below this value are attenuated.",
      highcut:
        "Upper cutoff frequency in Hz. Frequencies above this value are attenuated.",
      savgolOrder:
        "Polynomial order used for local smoothing. Higher values preserve more shape but can overfit noise.",
      window_size:
        "Number of samples used in each smoothing window. Larger windows produce stronger smoothing.",
      sigma:
        "Controls how wide the Gaussian smoothing kernel is. Larger values smooth more aggressively.",
    },
    modal: {
      title: "Python Info",
      functionTitle: "filter_signal function",
      rules: {
        code:
          "Code: The Python code must be well written, with correct tabulations and blank spaces.",
        functionName:
          "Function name: The code must contain the definition of a function named filter_signal that performs the filtering of the signal.",
        parameters:
          "Parameters: The function must have a single parameter that represents the signal values.",
        output:
          "Output: The function's output will be the processed (filtered) signal values (must have the same length as the input).",
        noAdditional:
          "No additional parameters: The function should not accept any additional parameters.",
        syntax:
          "Syntax Error: If there is a syntax error in the code, an error message will be displayed.",
        required:
          "Required for Python filter: If this field is left blank, the custom Python filter cannot be executed.",
        packages: "What packages can I use? (more to come):",
        example: "Example (copy and paste to try!):",
      },
    },
  },
  pipeline: {
    noSteps: "No steps to display.",
    step: "Step {{index}}",
    technique: "Technique",
    view: "View",
    entryPoint: "Entry point of the pipeline.",
    finalOutput: "Final output of the pipeline.",
  },
  about: {
    title: "About this Project",
    description:
      "SignAlchemist is a visual toolkit for exploring, transforming, and validating physiological signals without losing sight of the raw data.",
    badge: "Project overview",
    intro:
      "Explore the workflow, jump back into the Home workspace, or head straight into the docs.",
    tryNow: "Try it now",
    readDocs: "Read the docs",
    toolkitTitle: "Signal Processing Toolkit",
    toolkitDescription:
      "A friendlier environment for preprocessing, comparing, and building custom pipelines around time-series data.",
    p1:
      "This open-source application was designed to simplify signal processing, especially for physiological data such as EDA and PPG, while remaining flexible enough for any time-series signal.",
    p2:
      "You can resample, filter, and build custom pipelines visually, compare each result against the source signal, and even inject Python-based logic for more advanced workflows.",
    p3:
      "The Processing page focuses on modular experimentation with reusable blocks for filtering, outlier detection, and resampling, and the platform keeps growing with new operations and metrics.",
    p4:
      "For physiological signals, SignAlchemist also provides quality metrics to help you assess both the raw and transformed output.",
    workflowTitle: "Visual Workflow",
    workflowDescription:
      "A quick preview of the interactive processing experience.",
    fundingTitle: "Funding",
    fundingDescription:
      "Research projects supporting the development of SignAlchemist.",
    workflowImageAlt: "Signal Processing",
  },
  notFound: {
    title: "404 - Page not found",
    description: "Sorry, we couldn't find what you were looking for.",
    home: "HOME",
  },
  pages: {
    processing: {
      title: "Signal Processing",
      description: "Build and run a processing pipeline.",
      flowTitle: "Pipeline Flow",
      flowDescription: "Pipeline graph.",
      nodesTitle: "Nodes",
      nodesDescription: "Click to add or drag into the flow.",
      addAndConnect: "Add and connect nodes here.",
      dropNode: "Drop node",
      categories: {
        Preprocessing: "Preprocessing",
        Analysis: "Analysis",
      },
      run: "Run",
      clean: "Clean",
      cleanTitle: "Clean pipeline",
      cleanDescription:
        "This will remove every processing node and connection, keeping only the input and output nodes.",
      cleanConfirm: "Yes, clean",
      charts: "Charts",
    },
    resampling: {
      title: "Resampling",
      description: "Change the sampling rate of the signal.",
      settingsTitle: "Settings",
      settingsDescription: "Interpolation method and target sampling rate.",
      originalTitle: "Original Signal",
      resultTitle: "Resampled Signal",
      inputDescription: "Input signal.",
      outputDescription: "Output signal.",
      interpolationTechnique: "Interpolation technique",
      interpolationTooltip:
        "How new in-between samples are estimated when changing the sampling rate.",
      newSamplingRate: "New sampling Rate (Hz)",
      newSamplingRateTooltip:
        "Target number of samples per second after resampling.",
      enterHz: "Enter Hz",
      apply: "Apply resampling",
      resultEmpty: "Run resampling to see the result.",
      rightTitle: "Resampled",
    },
    filtering: {
      title: "Filtering",
      description: "Apply a filter to the signal.",
      error: "Error performing filtering.",
      settingsTitle: "Settings",
      settingsDescription: "Filter type and parameters.",
      originalTitle: "Original Signal",
      resultTitle: "Filtered Signal",
      inputDescription: "Input signal.",
      outputDescription: "Output signal.",
      technique: "Filtering technique",
      techniqueTooltip:
        "Select the family of filter you want to apply to the signal.",
      apply: "Apply filter",
      resultEmpty: "Run filtering to see the result.",
      pythonRequired: "Python code is required for the Python filter",
      rightTitle: "Filtered",
      signalSummaryTitle: "Context",
    },
    hr: {
      title: "Heart Rate",
      description: "Estimate heart rate from a PPG signal.",
      settingsTitle: "Settings",
      settingsDescription: "Select the heart rate algorithm.",
      originalTitle: "Original Signal",
      outputTitle: "Heart Rate Series",
      outputDescription: "Computed heart rate values.",
      chartTitle: "Heart Rate Chart",
      chartDescription: "Computed heart rate over time.",
      inputDescription: "Input signal.",
      method: "Method",
      methodTooltip:
        "Choose between the EmotiBit-style beat-to-beat estimate and NeuroKit's PPG rate pipeline.",
      onlyPpg: "Heart rate analysis is only available for PPG signals.",
      compute: "Compute heart rate",
      error: "Error computing heart rate.",
      beatsUsed: "Beats used",
      empty: "Run heart rate analysis to see the result.",
      seriesEmpty: "No chart available",
      table: {
        index: "#",
        time: "Time",
        hr: "HR",
      },
    },
    peaks: {
      title: "Peak Detection",
      description: "Detect peaks in the signal.",
      settingsTitle: "Settings",
      settingsDescription: "Detector and detection parameters.",
      originalTitle: "Original Signal",
      detectedTitle: "Detected Peaks",
      detectedDescription: "Detected peaks.",
      annotatedTitle: "Annotated Signal",
      annotatedDescription: "Signal with detected peaks.",
      inputDescription: "Input signal.",
      detector: "Detector",
      detectorTooltip:
        "Choose between a more automatic NeuroKit detector or a more manual SciPy detector.",
      neurokitHint:
        "NeuroKit uses presets adapted to the selected signal type.",
      minDistance: "Min distance (s)",
      minDistanceTooltip:
        "Minimum time allowed between two detected peaks. Increase it to avoid detecting peaks that are too close together.",
      minHeight: "Min height",
      minHeightTooltip:
        "Minimum signal value required for a point to count as a peak.",
      optional: "Optional",
      detect: "Detect peaks",
      error: "Error detecting peaks.",
      peakCount: "Peak Count",
      empty: "Run detection to see the result.",
      chartEmpty: "No chart available",
      downloadDescription:
        "Download the row indices from the original CSV where peaks were detected.",
      downloadIndices: "Download indices",
      table: {
        index: "#",
        time: "Time",
        value: "Value",
      },
    },
    batch: {
      title: "Batch Processing",
      description:
        "Import a validated pipeline, queue multiple CSV files and run them sequentially.",
      pipelineTitle: "Pipeline",
      pipelineDescription: "Import the JSON exported from Processing.",
      pipelineEmpty: "Import a pipeline JSON exported from Processing.",
      setupTitle: "Batch Setup",
      setupDescription:
        "Choose the shared dataset configuration for all files.",
      csvFiles: "CSV files",
      mismatch:
        "The selected CSV files do not all share the same headers. Batch execution assumes a common structure.",
      runBatch: "Run batch",
      running: "Running...",
      clearFiles: "Clear files",
      executionTitle: "Execution",
      executionDescription:
        "Review the queue and the processing progress in one place.",
      downloadAll: "Download all",
      queue: "Queue",
      filesCount: "{{count}} files",
      fileNumber: "File {{index}}",
      queueEmpty: "Load CSV files to build the batch queue.",
      progress: "Progress",
      completed: "{{count}} completed",
      failed: "{{count}} failed",
      outputRows: "{{count}} output rows",
      peaks: "{{count}} peaks",
      beats: "{{count}} beats",
      download: "Download",
      progressEmpty:
        "Run the batch to see progress and download each result.",
      inspectTitle: "Inspect",
      inspectDescription:
        "Compare the selected file before and after processing.",
      inspectHint:
        "Click a file in the queue or progress list to inspect it.",
      inspectPending:
        "Run the selected file successfully to enable the comparison chart.",
      inspectEmpty:
        "Load CSV files and select one to inspect it here.",
      toasts: {
        imported: "Pipeline imported",
        invalidPipeline: "Invalid pipeline file",
        presetLoaded: "{{preset}} pipeline loaded",
        loadedFiles: "{{count}} CSV files loaded",
        loadFilesError: "Could not load the selected CSV files",
        zipDownloaded: "Batch zip downloaded",
        zipError: "Could not build the batch zip",
      },
      statuses: {
        queued: "queued",
        running: "running",
        success: "success",
        error: "error",
        waiting: "Waiting to run",
        executing: "Executing pipeline...",
        completedSteps: "{{count}} steps completed",
        executionFailed: "Execution failed",
      },
    },
  },
};

export default en;
