import { getCookie } from "./cookies";
import { handleLocalRequest } from "./localDb";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * OFFLINE MODE:
 * When true, all API calls are intercepted and processed locally
 * using localStorage as the database. No internet or backend needed.
 * 
 * Set to false to use the remote FastAPI backend instead.
 */
const IS_OFFLINE_MODE = false;

interface FetchOptions extends RequestInit {
  json?: unknown;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  // ---- OFFLINE MODE: Route to local database engine ----
  if (IS_OFFLINE_MODE) {
    // Simulate a tiny async delay for realistic UX
    await new Promise((r) => setTimeout(r, 50));
    return handleLocalRequest<T>(path, {
      method: options.method,
      json: options.json,
      body: options.body as string | undefined,
    });
  }

  // ---- ONLINE MODE: Standard HTTP fetch to backend ----
  const token = getCookie("token");
  
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options.json && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
  }
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    let errorDetail = "An error occurred";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json() as Promise<T>;
}
