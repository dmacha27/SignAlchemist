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
            <p>SignAlchemist helps you preprocess physiological signals, mainly EDA and PPG.</p>
            <p>We'll guide you through a quick tutorial—just follow the steps and click or perform the suggested actions.</p>
          `,
        },
      },
      {
        element: ".upload-card",
        popover: {
          title: "Uploading Files",
          description: `
            <p>This is where you can upload the signal file you want to process.</p>
            <p>EDA and PPG files are the main scope, but any time series data will also work.</p>
            <p>Only CSV files are supported.</p>
          `,
        },
      },
      {
        element: ".p-fileupload-choose",
        popover: {
          title: "Choose File",
          description: `
            <p>Click this button to open your system's file selector and pick a file.</p>
            <p>But not just yet! We have a simpler option for the tutorial.</p>
          `,
        },
      },
      {
        element: ".p-fileupload-content",
        popover: {
          title: "Drag & Drop",
          description: `<p>Or, if you prefer, simply drag your CSV file directly into this panel.</p>`,
        },
      },
      {
        element: ".sample-eda",
        popover: {
          title: "Sample File",
          description: `<p>You can also try one of our example files.</p>`,
        },
      },
      {
        element: ".sample-list",
        popover: {
          title: "Sample Files",
          description: `<p>From this menu, you can select other sample files, like PPG examples, to see how different signals are handled.</p>`,
        },
      },
      {
        element: ".sample-eda",
        allowInteraction: true,
        popover: {
          title: "Load Sample File",
          description: `
            <p>For this tutorial, let’s use a sample EDA file.</p>
            <p>Click this button to upload it. You won’t be able to continue until the file is fully uploaded.</p>
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
            <p>Here’s your uploaded file.</p>
            <p>If it shows 'Pending', it means some parameters still need configuration. You can remove the file and start over if needed.</p>
          `,
        },
      },
      {
        element: ".config-fields",
        popover: {
          title: "Configuration Fields",
          description: `
            <p>Next, we’ll set the parameters for analyzing your signal.</p>
            <p>Each field helps SignAlchemist understand your data better.</p>
          `,
        },
      },
      {
        element: ".tuto-signalType",
        popover: {
          title: "Signal Type",
          description: `<p>Select the type of signal you’re working with.</p><p>For this tutorial, choose 'EDA'.</p>`,
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
            <p>Next, choose the column that contains timestamps. For this EDA sample, select 'Timestamp'.</p>
            <p>If your file doesn’t have timestamps, select 'No timestamps'.</p>
            <p>If you select 'No timestamps', the Sampling Rate field will become editable.</p>
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
          title: "Chart Preview",
          description: `
            <p>With the timestamp column selected, SignAlchemist can now start plotting your signal.</p>
            <p>This chart gives you a preview of your data based on the current settings. Let's continue configuring the remaining parameters.</p>
          `,
        },
      },
      {
        element: ".tuto-samplingRate",
        popover: {
          title: "Sampling Rate",
          description: `
            <p>If your file has no timestamps, enter the sampling rate (Hz) here.</p>
            <p>Otherwise, SignAlchemist can calculate it automatically from the timestamps.</p>
            <p>If you know both, it’s best to enter it manually to avoid inaccuracies.</p>
          `,
        },
      },
      {
        element: ".tuto-signalValues",
        popover: {
          title: "Signal Values",
          description: `
            <p>Now, select the column containing the signal values you want to analyze.</p>
            <p>For this EDA sample, choose 'Gsr'.</p>
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
            <p>Use this integrated slider to choose which slice of the signal you want to inspect in the preview.</p>
            <p>When you apply it, the preview updates and that same crop is what the utilities will receive next.</p>
          `,
        },
      },
      {
        element: ".tuto-next-step",
        popover: {
          title: "You're all set!",
          description: `
            <p>When you’re ready, go to the "Next step" panel and choose one of the utility buttons: Resampling, Filtering, or Processing.</p>
            <p>Those buttons become available once all required fields are configured.</p>
            <p>Enjoy your signal processing journey!</p>
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
