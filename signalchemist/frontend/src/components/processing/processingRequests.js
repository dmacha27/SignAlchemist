import {
  createFormData,
  postFormData,
} from "@/lib/apiClient";

export async function requestResampling({
  signal,
  interpolationTechnique,
  targetSamplingRate,
}) {
  return postFormData(
    "/api/resampling",
    createFormData([
      ["signal", JSON.stringify(signal)],
      ["interpolation_technique", interpolationTechnique],
      ["target_sampling_rate", parseFloat(targetSamplingRate)],
    ]),
    "Failed to apply resampling"
  );
}

export async function requestOutliers({
  signal,
  outlierTechnique,
}) {
  return postFormData(
    "/api/outliers",
    createFormData([
      ["signal", JSON.stringify(signal)],
      ["outlier_technique", outlierTechnique],
    ]),
    "Failed to apply outliers"
  );
}

export async function requestFiltering({
  signal,
  samplingRate,
  filterConfig,
}) {
  return postFormData(
    "/api/filtering",
    createFormData([
      ["signal", JSON.stringify(signal)],
      ["sampling_rate", String(samplingRate)],
      ["filter_config", JSON.stringify(filterConfig)],
    ]),
    "Failed to apply filter"
  );
}

export async function requestNormalization({
  signal,
  normalizationMethod,
}) {
  return postFormData(
    "/api/normalization",
    createFormData([
      ["signal", JSON.stringify(signal)],
      ["normalization_method", normalizationMethod],
    ]),
    "Failed to apply normalization"
  );
}
