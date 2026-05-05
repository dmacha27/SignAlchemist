import {
  createFormData,
  postFormData,
} from "@/lib/apiClient";

export function getDefaultHeartRateMethod() {
  return "emotibit";
}

export async function requestHeartRateAnalysis({
  signal,
  samplingRate,
  signalType,
  method,
}) {
  const payload = await postFormData(
    "/api/hr",
    createFormData([
      ["signal", JSON.stringify(signal)],
      ["sampling_rate", String(samplingRate)],
      ["signal_type", signalType || "OTHER"],
      ["method", method],
    ]),
    "Error computing heart rate."
  );

  return {
    data: payload.data ?? [],
    beatCount: payload.beat_count ?? 0,
  };
}
