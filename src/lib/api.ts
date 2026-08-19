import type { ApiErrorResponse } from "../types/auth";

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) 
  ? import.meta.env.VITE_API_BASE_URL 
  : "http://localhost:5000/api/v1";
const TOKEN_KEY = "a2z-auth-token";

export class ApiError extends Error {
  public code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

export const api = {
  onAuthError: null as (() => void) | null,

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err: any) {
      throw new ApiError("Network error. Please make sure the backend server is running.", "NETWORK_ERROR");
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && endpoint !== "/auth/login" && endpoint !== "/auth/register") {
        if (this.onAuthError) {
          this.onAuthError();
        }
      }

      if (data && data.error) {
        const apiErrorData = data as ApiErrorResponse;
        throw new ApiError(apiErrorData.error.message, apiErrorData.error.code);
      }
      throw new ApiError("An unknown error occurred.", "UNKNOWN_ERROR");
    }

    return data as T;
  },

  get<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, body: any, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
};

import type { UserProgress } from "@/types/progress";

export const progressApi = {
  getAll: () => 
    api.get<{ success: boolean; data: { progress: UserProgress[] } }>("/progress"),
  
  getSingle: (problemId: string) => 
    api.get<{ success: boolean; data: { progress: UserProgress | null } }>(`/progress/${problemId}`),
  
  solve: (problemId: string, localDate: string) => 
    api.post<{ success: boolean; data: { progress: UserProgress } }>(`/progress/${problemId}/solve`, { localDate }),
  
  review: (problemId: string, localDate: string, currentStage: number) => 
    api.post<{ success: boolean; data: { progress: UserProgress } }>(`/progress/${problemId}/review`, { localDate, currentStage }),
  
  unsolve: (problemId: string) => 
    api.delete<{ success: boolean; data: { progress: UserProgress } }>(`/progress/${problemId}/unsolve`),
  
  reset: () => 
    api.delete<{ success: boolean; data: { deletedCount: number } }>("/progress"),
};
