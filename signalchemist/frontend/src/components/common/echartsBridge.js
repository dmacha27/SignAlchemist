export const chartGroups = {
  signal: new Set(),
  spectrum: new Set(),
};

export function registerChart(group, bridge) {
  chartGroups[group]?.add(bridge);
}

export function unregisterChart(group, bridge) {
  chartGroups[group]?.delete(bridge);
}

export function getCharts(group) {
  return Array.from(chartGroups[group] ?? []);
}

export function toRgba(hexColor, alpha) {
  const value = hexColor.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function resetEchartsZoom(instance) {
  instance?.dispatchAction?.({
    type: "dataZoom",
    start: 0,
    end: 100,
  });
}
