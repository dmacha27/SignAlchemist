async function readJsonResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || fallbackMessage);
  }

  return payload;
}

export async function requestResampling({
  signal,
  interpolationTechnique,
  targetSamplingRate,
}) {
  const formData = new FormData();
  formData.append("signal", JSON.stringify(signal));
  formData.append("interpolation_technique", interpolationTechnique);
  formData.append("target_sampling_rate", parseFloat(targetSamplingRate));

  const response = await fetch("/api/resampling", {
    method: "POST",
    body: formData,
  });

  return readJsonResponse(response, "Failed to apply resampling");
}

export async function requestOutliers({
  signal,
  outlierTechnique,
}) {
  const formData = new FormData();
  formData.append("signal", JSON.stringify(signal));
  formData.append("outlier_technique", outlierTechnique);

  const response = await fetch("/api/outliers", {
    method: "POST",
    body: formData,
  });

  return readJsonResponse(response, "Failed to apply outliers");
}

export async function requestFiltering({
  signal,
  samplingRate,
  filterConfig,
}) {
  const formData = new FormData();
  formData.append("signal", JSON.stringify(signal));
  formData.append("sampling_rate", Math.round(samplingRate));
  formData.append("filter_config", JSON.stringify(filterConfig));

  const response = await fetch("/api/filtering", {
    method: "POST",
    body: formData,
  });

  return readJsonResponse(response, "Failed to apply filter");
}

export async function requestNormalization({
  signal,
  normalizationMethod,
}) {
  const formData = new FormData();
  formData.append("signal", JSON.stringify(signal));
  formData.append("normalization_method", normalizationMethod);

  const response = await fetch("/api/normalization", {
    method: "POST",
    body: formData,
  });

  return readJsonResponse(response, "Failed to apply normalization");
}
