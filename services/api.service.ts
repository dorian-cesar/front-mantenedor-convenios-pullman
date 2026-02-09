import { api } from '@/lib/api';

export interface Api {
    id: number;
    nombre: string;
    endpoint: string;
    status: "ACTIVO" | "INACTIVO";
}

export interface GetApisParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    nombre?: string;
}

export interface ApisResponse {
    totalItems: number;
    rows: Api[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateApiData {
    nombre: string;
    endpoint: string;
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateApiData {
    nombre?: string;
    endpoint?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export class ApisService {
    static async getApis(params?: GetApisParams): Promise<ApisResponse> {
        const response = await api.get<ApisResponse>('/apis-consulta', { params });
        return response.data;
    }

    static async getApiById(id: number): Promise<Api> {
        const response = await api.get<Api>(`/apis-consulta/${id}`);
        return response.data;
    }

    static async createApi(data: CreateApiData): Promise<Api> {
        const response = await api.post<Api>('/apis-consulta', data);
        return response.data;
    }

    static async updateApi(id: number, data: UpdateApiData): Promise<Api> {
        const response = await api.put<Api>(`/apis-consulta/${id}`, data);
        return response.data;
    }

    static async deleteApi(id: number): Promise<void> {
        await api.delete(`/apis-consulta/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Api> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateApi(id, { status: newStatus });
    }
}