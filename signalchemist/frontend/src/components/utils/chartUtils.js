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
 * @param {Object} [exportOptions]
 */
export function exportToPNG(chart, filename = "chart.png", exportOptions = {}) {
  if (!chart) return;

  let imageUrl = null;
  if (chart.__kind === "echarts" && typeof chart.toBase64Image === "function") {
    imageUrl = chart.toBase64Image(exportOptions);
  } else if (typeof chart.toBase64Image === "function") {
    imageUrl = chart.toBase64Image(exportOptions);
  }

  if (!imageUrl) return;

  downloadDataUrl(imageUrl, filename);
}

export function getOptimalExportPixelRatio() {
  if (typeof window === "undefined") {
    return 4;
  }

  const deviceRatio = Math.ceil(window.devicePixelRatio || 1);
  return Math.min(6, Math.max(4, deviceRatio * 2));
}

export function downloadDataUrl(imageUrl, filename = "chart.png") {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download =
    filename && filename.toLowerCase().endsWith(".png")
      ? filename
      : "chart.png";
  link.click();
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function exportChartCollectionPNG({
  charts,
  filename,
  backgroundColor,
  foregroundColor,
}) {
  const exportOptions = {
    pixelRatio: getOptimalExportPixelRatio(),
    backgroundColor,
  };

  const imageUrls = await Promise.all(
    charts.map(({ chart }) => chart?.toBase64Image?.(exportOptions))
  );

  if (imageUrls.some((imageUrl) => !imageUrl)) {
    return;
  }

  const images = await Promise.all(imageUrls.map((imageUrl) => loadImage(imageUrl)));
  const padding = 48;
  const gutter = charts.length > 1 ? 28 : 0;
  const titleHeight = 40;
  const titleGap = 14;
  const contentWidth = Math.max(...images.map((image) => image.width));
  const contentHeight = Math.max(...images.map((image) => image.height));
  const panelWidth = contentWidth;
  const panelHeight = titleHeight + titleGap + contentHeight;
  const canvasWidth =
    padding * 2 + panelWidth * charts.length + gutter * Math.max(0, charts.length - 1);
  const canvasHeight = padding * 2 + panelHeight;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  charts.forEach(({ title }, index) => {
    const image = images[index];
    const x = padding + index * (panelWidth + gutter);
    const y = padding;

    context.fillStyle = foregroundColor;
    context.font = "600 28px Inter, system-ui, sans-serif";
    context.textBaseline = "top";
    context.textAlign = "center";
    context.fillText(title, x + panelWidth / 2, y);

    context.drawImage(
      image,
      x,
      y + titleHeight + titleGap,
      image.width,
      image.height
    );
  });

  context.textAlign = "start";

  downloadDataUrl(canvas.toDataURL("image/png"), filename);
}

export async function exportChartsSideBySidePNG({
  leftChart,
  rightChart,
  leftTitle,
  rightTitle,
  filename = "comparison-side-by-side.png",
  backgroundColor = "#ffffff",
  foregroundColor = "#0f172a",
}) {
  if (!leftChart || !rightChart) {
    return;
  }

  await exportChartCollectionPNG({
    charts: [
      {
        chart: leftChart,
        title: leftTitle,
      },
      {
        chart: rightChart,
        title: rightTitle,
      },
    ],
    filename,
    backgroundColor,
    foregroundColor,
  });
}

export async function exportSingleChartWithTitlePNG({
  chart,
  title,
  filename = "chart.png",
  backgroundColor = "#ffffff",
  foregroundColor = "#0f172a",
}) {
  if (!chart) {
    return;
  }

  await exportChartCollectionPNG({
    charts: [
      {
        chart,
        title: title || chart.exportMeta?.title || "Chart",
      },
    ],
    filename,
    backgroundColor,
    foregroundColor,
  });
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
