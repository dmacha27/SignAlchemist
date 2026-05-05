export async function readJsonResponse(response, fallbackMessage) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || fallbackMessage);
  }

  return payload;
}

export async function postFormData(endpoint, formData, fallbackMessage) {
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  return readJsonResponse(response, fallbackMessage);
}

export function createFormData(entries) {
  const formData = new FormData();

  entries.forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  return formData;
}
