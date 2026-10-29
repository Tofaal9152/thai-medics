import apiClient from "./api-client";

export const request = {
  get: async <T = unknown>(url: string): Promise<T> => {
    const res = await apiClient.get<T>(url);
    return res.data;
  },

  post: async <TRes = unknown, TBody = unknown>(
    url: string,
    data: TBody,
  ): Promise<TRes> => {
    const res = await apiClient.post<TRes>(url, data);
    return res.data;
  },

  put: async <TRes = unknown, TBody = unknown>(
    url: string,
    data: TBody,
  ): Promise<TRes> => {
    const res = await apiClient.put<TRes>(url, data);
    return res.data;
  },

  patch: async <TRes = unknown, TBody = unknown>(
    url: string,
    data: TBody,
  ): Promise<TRes> => {
    const res = await apiClient.patch<TRes>(url, data);
    return res.data;
  },

  delete: async <T = unknown>(url: string): Promise<T> => {
    const res = await apiClient.delete<T>(url);
    return res.data;
  },
  // advanced methods
  postFormData: async <TRes = unknown>(
    url: string,
    formData: FormData,
  ): Promise<TRes> => {
    const res = await apiClient.post<TRes>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};