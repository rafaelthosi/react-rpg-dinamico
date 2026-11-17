const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "https://node-rpg-dinamico.onrender.com"
).replace(/\/+$/, "");

export async function apiRequest(path, { session, method = "GET", body } = {}) {
  const headers = {};
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? `A solicitação falhou (${response.status}).`);
  }
  return payload;
}

export async function getCampaignStructure(session, campaignId) {
  const sections = await apiRequest(`/campaigns/${campaignId}/sections`, { session });
  return Promise.all(sections.map(async (section) => {
    const fields = await apiRequest(`/sections/${section.id}/fields`, { session });
    const fieldsWithOptions = await Promise.all(fields.map(async (field) => ({
      ...field,
      options: field.type === "SELECT"
        ? (await apiRequest(`/fields/${field.id}/options`, { session }))
          .sort((a, b) => a.position - b.position)
        : [],
    })));
    return {
      ...section,
      fields: fieldsWithOptions.sort((a, b) => a.position - b.position),
    };
  })).then((items) => items.sort((a, b) => a.position - b.position));
}
