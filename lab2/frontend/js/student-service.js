async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {"Accept": "application/json", ...(options.body ? {"Content-Type": "application/json"} : {})}
    });
  } catch (_) {
    throw new Error("Нет связи с сервером. Проверьте, что Django запущен.");
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Ошибка HTTP ${response.status}`);
    error.details = payload?.error?.details || null;
    error.status = response.status;
    throw error;
  }
  return payload;
}

function getStudents(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value !== null && value !== undefined) params.set(key, value);
  }
  const suffix = params.toString();
  return apiRequest(`/api/requests${suffix ? `?${suffix}` : ""}`);
}

function findStudentByIsuId(id) {
  return apiRequest(`/api/requests/${encodeURIComponent(id)}`);
}

function addStudent(student) {
  return apiRequest("/api/requests", {method: "POST", body: JSON.stringify(student)});
}

function updateStudent(id, student) {
  return apiRequest(`/api/requests/${encodeURIComponent(id)}`, {method: "PATCH", body: JSON.stringify(student)});
}

function deleteStudent(id) {
  return apiRequest(`/api/requests/${encodeURIComponent(id)}`, {method: "DELETE"});
}
