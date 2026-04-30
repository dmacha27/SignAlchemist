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
  const formData = new FormData();
  formData.append("signal", JSON.stringify(signal));
  formData.append("sampling_rate", samplingRate);
  formData.append("detector", detector);
  formData.append("signal_type", signalType || "OTHER");

  if (detector === "scipy") {
    formData.append("min_distance_seconds", minDistanceSeconds || "0");

    if (height !== "") {
      formData.append("height", height);
    }
  }

  const response = await fetch("/api/peaks", {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Error detecting peaks.");
  }

  return payload.peaks ?? [];
}
