import { driver } from "driver.js";

export const startHomeTour = () => {
  let tutorialIsActive = false;

  const tutorial = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    animate: true,
    allowClose: false,
    steps: [
      {
        popover: {
          title: "Welcome to SignAlchemist!",
          description: `
            <p>SignAlchemist helps you prepare and process physiological signals, especially EDA and PPG.</p>
            <p>This quick tour follows the current Home workflow: upload, configure, preview, crop and then choose the next utility.</p>
          `,
        },
      },
      {
        element: ".upload-card",
        popover: {
          title: "Upload Signal",
          description: `
            <p>This card is the entry point for your dataset.</p>
            <p>You can upload your own CSV or start with a sample file to explore the app faster.</p>
            <p>The workflow is optimized for EDA and PPG, but other time series can work too.</p>
          `,
        },
      },
      {
        element: ".p-fileupload-choose",
        popover: {
          title: "Choose File",
          description: `
            <p>Use this button to open the system file picker and select a CSV manually.</p>
            <p>For the tutorial we will use a sample instead, so the whole flow is reproducible.</p>
          `,
        },
      },
      {
        element: ".p-fileupload-content",
        popover: {
          title: "Drag and Drop",
          description: `<p>You can also drag a CSV file directly into this area if that is faster for you.</p>`,
        },
      },
      {
        element: ".sample-eda",
        popover: {
          title: "Quick Sample",
          description: `<p>This button loads the bundled EDA sample in one click.</p>`,
        },
      },
      {
        element: ".sample-list",
        popover: {
          title: "Sample Files",
          description: `<p>This menu gives you access to the other bundled examples, such as the PPG sample.</p>`,
        },
      },
      {
        element: ".sample-eda",
        allowInteraction: true,
        popover: {
          title: "Load Sample File",
          description: `
            <p>For this tour, let’s use the EDA sample.</p>
            <p>Click here to load it. The tutorial will continue once the file is available in the uploader.</p>
          `,
          onNextClick: () => {
            const uploadedFile = document.querySelector(".p-fileupload-filename");
            if (uploadedFile) {
              tutorial.moveNext();
            }
          },
        },
      },
      {
        element: ".p-fileupload-content",
        popover: {
          title: "File Uploaded!",
          description: `
            <p>Your file now appears here inside the uploader.</p>
            <p>From this point, the next step is to review the dataset configuration and preview before jumping into any utility.</p>
          `,
        },
      },
      {
        element: ".config-fields",
        popover: {
          title: "Configure Dataset",
          description: `
            <p>This card defines how SignAlchemist interprets the CSV.</p>
            <p>These values also drive the preview and are passed to the next utility exactly as configured here.</p>
          `,
        },
      },
      {
        element: ".tuto-signalType",
        popover: {
          title: "Signal Type",
          description: `<p>Select the type of signal you are working with.</p><p>For this tutorial, choose <strong>EDA</strong>.</p>`,
          onNextClick: () => {
            const value = document.getElementById("signalType")?.value;
            if (value === "EDA") {
              tutorial.moveNext();
            }
          },
        },
      },
      {
        element: ".tuto-timestampColumn",
        popover: {
          title: "Timestamp Column",
          description: `
            <p>Select the column that stores timestamps. For this sample, choose <strong>Timestamp</strong>.</p>
            <p>If a file has no timestamps, choose <strong>No timestamps</strong> and then provide the sampling rate manually.</p>
          `,
          onNextClick: () => {
            const select = document.getElementById("timestampColumn");
            const value = select?.options[select.selectedIndex]?.text;
            if (value === "Timestamp") {
              tutorial.moveNext();
            }
          },
        },
      },
      {
        element: ".tuto-chart",
        popover: {
          title: "Preview Workspace",
          description: `
            <p>The preview updates with the current configuration so you can validate the signal before processing it.</p>
            <p>This is especially useful for checking whether timestamps, columns and cropping are aligned with your expectations.</p>
          `,
        },
      },
      {
        element: ".tuto-samplingRate",
        popover: {
          title: "Sampling Rate",
          description: `
            <p>If the file does not include timestamps, enter the sampling rate in Hz here.</p>
            <p>When timestamps are available, SignAlchemist can infer it automatically from the data.</p>
          `,
        },
      },
      {
        element: ".tuto-signalValues",
        popover: {
          title: "Signal Values",
          description: `
            <p>Select the column that contains the signal values you want to inspect and process.</p>
            <p>For this EDA sample, choose <strong>Gsr</strong>.</p>
          `,
          onNextClick: () => {
            const select = document.getElementById("signalValues");
            const value = select?.options[select.selectedIndex]?.text;
            if (value === "Gsr") {
              tutorial.moveNext();
            }
          },
        },
      },
      {
        element: ".tuto-range-slider",
        popover: {
          title: "Preview Range",
          description: `
            <p>Use this slider to focus on a specific segment of the signal.</p>
            <p>When you apply the crop, the preview updates and that same cropped range is what the single-file utilities receive next.</p>
          `,
        },
      },
      {
        element: ".tuto-next-step",
        popover: {
          title: "Next Step",
          description: `
            <p>This panel is now split between the main flows and the single utilities.</p>
            <p><strong>Processing</strong> is the main interactive pipeline builder, and <strong>Batch</strong> lets you run an exported pipeline on multiple CSV files.</p>
            <p>Below them you still have focused utilities like Resampling, Filtering, Peaks and HR for single-signal work.</p>
          `,
        },
      },
    ],
    onHighlightStarted: () => {
      tutorialIsActive = true;
    },
    onReset: () => {
      tutorialIsActive = false;
    },
    onDeselected: () => {
      tutorialIsActive = false;
    },
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!tutorialIsActive) {
        return;
      }

      const step = tutorial.getActiveStep();
      if (step.allowInteraction) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();
    },
    true
  );

  tutorial.drive();
};
