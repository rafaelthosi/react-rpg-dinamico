import { apiRequest } from "./rpgApi.js";

export function login({ username, password }) {
  return apiRequest("/auth/login", { method: "POST", body: { username, password } });
}

export function registerPlayer({ username, password }) {
  return apiRequest("/auth/register", { method: "POST", body: { username, password } });
}

export function registerGM({ username, password }) {
  return apiRequest("/auth/register/gm", { method: "POST", body: { username, password } });
}

export function joinCampaign(session, campaignId, password) {
  return apiRequest(`/campaigns/${campaignId}/join`, {
    session,
    method: "POST",
    body: { password },
  });
}
