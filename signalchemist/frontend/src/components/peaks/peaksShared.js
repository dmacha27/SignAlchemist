import {
  createFormData,
  postFormData,
} from "@/lib/apiClient";

export function getDefaultMinDistance(signalType) {
  if (signalType === "PPG") {
    return "0.35";
  }

  if (signalType === "EDA") {
    return "1.00";
  }

  return "0.50";
}

export function getDefaultDetector(signalType) {
  if (signalType === "EDA" || signalType === "PPG") {
    return "neurokit";
  }

  return "scipy";
}

export function buildPeakMarkers(peaks) {
  return peaks.map((peak) => [peak.timestamp, peak.value]);
}

export async function requestPeaksDetection({
  signal,
  samplingRate,
  detector,
  signalType,
  minDistanceSeconds,
  height,
}) {
  const formDataEntries = [
    ["signal", JSON.stringify(signal)],
    ["sampling_rate", String(samplingRate)],
    ["detector", detector],
    ["signal_type", signalType || "OTHER"],
  ];

  if (detector === "scipy") {
    formDataEntries.push(["min_distance_seconds", minDistanceSeconds || "0"]);

    if (height !== "") {
      formDataEntries.push(["height", height]);
    }
  }

  const payload = await postFormData(
    "/api/peaks",
    createFormData(formDataEntries),
    "Error detecting peaks."
  );

  return payload.peaks ?? [];
}
