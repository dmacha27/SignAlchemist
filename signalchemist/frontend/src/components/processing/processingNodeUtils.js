export function parseTechniqueConfig(rawTechnique, fallback) {
  if (typeof rawTechnique !== "string") {
    return fallback;
  }

  try {
    return JSON.parse(rawTechnique);
  } catch {
    return fallback;
  }
}
