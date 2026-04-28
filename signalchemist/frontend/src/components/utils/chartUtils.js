/**
 * Reset zoom for Chart.js or bridge-based chart wrappers.
 *
 * @param {Object} chart
 */
export function handleResetZoom(chart) {
  if (!chart) return;

  if (chart.__kind === "echarts" && typeof chart.resetZoom === "function") {
    chart.resetZoom();
    return;
  }

  chart.config.options.scales.x.min = undefined;
  chart.config.options.scales.x.max = undefined;
  chart.config.options.scales.y.min = undefined;
  chart.config.options.scales.y.max = undefined;
  chart.update();
}

/**
 * Reset style for Chart.js or bridge-based chart wrappers.
 *
 * @param {Object} chart
 * @param {string} color
 */
export function handleResetStyle(chart, color) {
  if (!chart) return;

  if (chart.__kind === "echarts" && typeof chart.resetStyle === "function") {
    chart.resetStyle(color);
    return;
  }

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
 * Export chart as PNG for Chart.js or ECharts bridges.
 *
 * @param {Object} chart
 * @param {string} [filename='chart.png']
 */
export function exportToPNG(chart, filename = "chart.png") {
  if (!chart) return;

  let imageUrl = null;
  if (chart.__kind === "echarts" && typeof chart.toBase64Image === "function") {
    imageUrl = chart.toBase64Image();
  } else if (typeof chart.toBase64Image === "function") {
    imageUrl = chart.toBase64Image();
  }

  if (!imageUrl) return;

  const link = document.createElement("a");
  link.href = imageUrl;
  link.download =
    filename && filename.toLowerCase().endsWith(".png")
      ? filename
      : "chart.png";
  link.click();
}

const MAX_DATA_LENGTH = 5000;

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
 * Highlight point for Chart.js or ECharts bridges.
 *
 * @param {Object} chart
 * @param {number} pointIndex
 * @param {number} xvalue
 * @param {string} highlightColor
 * @param {number} zoomRange
 * @param {Object} chartRef
 */
export function processChartHighlight(
  chart,
  pointIndex,
  xvalue,
  highlightColor,
  zoomRange,
  chartRef
) {
  if (!chart) return;

  if (chart.__kind === "echarts" && typeof chart.highlightPoint === "function") {
    chart.highlightPoint(pointIndex, xvalue, highlightColor, zoomRange, chartRef);
    return;
  }

  const dataset = chart.data.datasets[0];
  const actualColor = chart.config.options.actualColor;

  if (dataset.data.length > MAX_DATA_LENGTH) return;
  if (chartRef.current.data.datasets[0].data.length !== dataset.data.length) return;

  updateDatasetStyles(dataset, pointIndex, highlightColor, actualColor);
  chart.config.options.scales.x.min = xvalue - zoomRange;
  chart.config.options.scales.x.max = xvalue + zoomRange;
  chart.update();
}
