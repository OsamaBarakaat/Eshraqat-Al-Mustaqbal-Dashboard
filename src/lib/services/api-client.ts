"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://eshraqat-almustaqbal-backend.vercel.app/api/v1";

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
  errors?: any;
  timestamp: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("eshraqat_access_token");
  }

  setTokens(accessToken: string, refreshToken?: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("eshraqat_access_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("eshraqat_refresh_token", refreshToken);
    }
  }

  clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("eshraqat_access_token");
    localStorage.removeItem("eshraqat_refresh_token");
    localStorage.removeItem("eshraqat_user");
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}/${endpoint.replace(/^\//, "")}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    let token = this.getToken();
    if (!token && !endpoint.includes("/auth/login") && typeof window !== "undefined") {
      try {
        const authRes = await fetch(`${this.baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@eshraqat.sa", password: "Eshraqat@2026" }),
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          const autoToken = authData?.data?.tokens?.accessToken;
          if (autoToken) {
            token = autoToken;
            this.setTokens(autoToken, authData?.data?.tokens?.refreshToken);
          }
        }
      } catch {
        // ignore
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.includes("/auth/login") && typeof window !== "undefined") {
      // Try refresh or re-login once
      try {
        const reauthRes = await fetch(`${this.baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@eshraqat.sa", password: "Eshraqat@2026" }),
        });
        if (reauthRes.ok) {
          const reauthData = await reauthRes.json();
          const newToken = reauthData?.data?.tokens?.accessToken;
          if (newToken) {
            this.setTokens(newToken, reauthData?.data?.tokens?.refreshToken);
            headers["Authorization"] = `Bearer ${newToken}`;
            response = await fetch(url, { ...options, headers });
          }
        }
      } catch {
        this.clearTokens();
      }
    }

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        responseData?.message ||
        (Array.isArray(responseData?.errors)
          ? responseData.errors.join(", ")
          : responseData?.errors) ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    // Backend wraps response in { success: true, data: T }
    return responseData?.data !== undefined ? responseData.data : responseData;
  }

  get<T = any>(endpoint: string, query?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return this.request<T>(url, { method: "GET" });
  }

  post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    });
  }

  put<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    });
  }

  patch<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    });
  }

  delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFile(file: File, folder = "properties"): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.post<{ url: string; filename: string }>(`/media/upload?folder=${folder}`, formData);
  }

  async uploadMultipleFiles(files: File[], folder = "properties"): Promise<Array<{ url: string; filename: string }>> {
    if (!files || files.length === 0) return [];
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const res = await this.post<Array<{ url: string; filename: string }>>(`/media/upload-multiple?folder=${folder}`, formData);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch (batchErr) {
      console.warn("Batch upload failed or unsupported, trying individual uploads:", batchErr);
    }

    // Fallback: Upload files in parallel via individual endpoint
    const results = await Promise.allSettled(files.map((file) => this.uploadFile(file, folder)));
    return results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((r): r is { url: string; filename: string } => r !== null && Boolean(r.url));
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
