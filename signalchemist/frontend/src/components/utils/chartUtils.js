/**
 * handleResetZoom function resets the zoom on the provided chart by setting the x and y scale min/max to undefined.
 *
 * @param {Object} chart - The chart object to reset the zoom on.
 */
export function handleResetZoom(chart) {
  if (!chart) return;
  chart.config.options.scales.x.min = undefined;
  chart.config.options.scales.x.max = undefined;
  chart.config.options.scales.y.min = undefined;
  chart.config.options.scales.y.max = undefined;
  chart.update();
}

/**
 * handleResetStyle function resets the chart's styling to the provided color.
 *
 * @param {Object} chart - The chart object to reset the style on.
 * @param {string} color - The color to apply to the chart's points and segments.
 */
export function handleResetStyle(chart, color) {
  if (!chart) return;
  const dataset = chart.data.datasets[0];
  dataset.pointBackgroundColor = dataset.data.map(() => color);
  dataset.pointBorderColor = dataset.data.map(() => color);
  dataset.pointRadius = dataset.data.map(() => 2);
  dataset.segment = {
    borderColor: () => color,
    backgroundColor: () => color,
  };
  chart.update();
}

/**
 * exportToPNG function exports the chart as a PNG image.
 *
 * @param {Object} chart - The chart object to export as an image.
 * @param {string} [filename='chart.png'] - The filename for the exported PNG image.
 */
export function exportToPNG(chart, filename = "chart.png") {
  if (!chart) return;

  const imageUrl = chart.toBase64Image();
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download =
    filename && filename.toLowerCase().endsWith(".png")
      ? filename
      : "chart.png";
  link.click();
}

const MAX_DATA_LENGTH = 5000;

/**
 * Updates the dataset's styles to highlight a specific data point.
 *
 * @param {Object} dataset - The dataset to update.
 * @param {number} pointIndex - The index of the point to highlight.
 * @param {string} highlightColor - The color used to highlight the selected point.
 * @param {string} actualColor - The color used for the non-selected points.
 */
export function updateDatasetStyles(
  dataset,
  pointIndex,
  highlightColor,
  actualColor
) {
  dataset.pointBackgroundColor = dataset.data.map((_, i) =>
    i === pointIndex ? highlightColor : actualColor
  );
  dataset.pointBorderColor = dataset.data.map((_, i) =>
    i === pointIndex ? highlightColor : actualColor
  );
  dataset.pointRadius = dataset.data.map((_, i) => (i === pointIndex ? 6 : 2));
}

/**
 * Processes a Chart.js chart instance to highlight a selected data point and adjust the X axis range.
 *
 * Idea from: https://stackoverflow.com/questions/70987757/change-color-of-a-single-point-by-clicking-on-it-chart-js
 *
 * @param {Object} chart - The Chart.js instance to update.
 * @param {number} pointIndex - The index of the selected point.
 * @param {number} xvalue - The X-axis value of the selected point.
 * @param {string} highlightColor - The color used to highlight the selected point.
 * @param {number} zoomRange - The range used to zoom the X-axis around the selected point.
 * @param {Object} chartRef - A ref to the main chart for data correspondence validation.
 */
export function processChartHighlight(
  chart,
  pointIndex,
  xvalue,
  highlightColor,
  zoomRange,
  chartRef
) {
  const dataset = chart.data.datasets[0];
  const actualColor = chart.config.options.actualColor;

  // Skip if dataset is too large or data length mismatch (to optimize performance)
  if (dataset.data.length > MAX_DATA_LENGTH) return;
  if (chartRef.current.data.datasets[0].data.length !== dataset.data.length)
    return;

  // Update dataset styles to highlight the selected point
  updateDatasetStyles(dataset, pointIndex, highlightColor, actualColor);

  // Adjust X axis range to center around the selected timestamp
  chart.config.options.scales.x.min = xvalue - zoomRange;
  chart.config.options.scales.x.max = xvalue + zoomRange;

  chart.update();
}
