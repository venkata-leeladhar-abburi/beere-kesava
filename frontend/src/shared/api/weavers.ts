import { apiClient } from "./client";

export interface BackendWeaver {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  initials: string;
  village: string | null;
  cluster: string | null;
  looms: number;
  status: "ACTIVE" | "INACTIVE";
  photoUrl: string;
  email: string;
  phone: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const weaversApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendWeaver>>(`/weavers?pageSize=${pageSize}`),
};
