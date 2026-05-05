export function getDefaultHeartRateMethod() {
  return "emotibit";
}

export async function requestHeartRateAnalysis({
  signal,
  samplingRate,
  signalType,
  method,
}) {
  const formData = new FormData();
  formData.append("signal", JSON.stringify(signal));
  formData.append("sampling_rate", String(samplingRate));
  formData.append("signal_type", signalType || "OTHER");
  formData.append("method", method);

  const response = await fetch("/api/hr", {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Error computing heart rate.");
  }

  return {
    data: payload.data ?? [],
    beatCount: payload.beat_count ?? 0,
  };
}
