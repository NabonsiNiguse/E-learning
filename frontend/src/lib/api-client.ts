/**
 * Thin wrapper around apiFetch that provides an axios-like interface.
 * apiFetch already handles: JWT auth, token refresh, Content-Type, error mapping.
 */
import { apiFetch } from "./api";

export const apiClient = {
  get<T>(path: string) {
    return apiFetch<T>(path, { method: "GET" }).then((data) => ({ data }));
  },

  post<T>(path: string, body: unknown) {
    return apiFetch<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((data) => ({ data }));
  },

  patch<T>(path: string, body: unknown) {
    return apiFetch<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then((data) => ({ data }));
  },

  put<T>(path: string, body: unknown) {
    return apiFetch<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((data) => ({ data }));
  },

  delete<T>(path: string) {
    return apiFetch<T>(path, { method: "DELETE" }).then((data) => ({ data }));
  },
};
