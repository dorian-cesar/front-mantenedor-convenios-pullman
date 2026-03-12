import { api } from '@/lib/api';

export interface ApiRegistro {
    id: number;
    nombre: string;
    endpoint: string;
    empresa_id?: number | null;
    status: "ACTIVO" | "INACTIVO";
    empresa?: {
        id: number;
        nombre: string;
        rut: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface GetApisRegistroParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    nombre?: string;
    empresa_id?: number;
}

export interface ApisRegistroResponse {
    totalItems: number;
    rows: ApiRegistro[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateApiRegistroData {
    nombre: string;
    endpoint: string;
    empresa_id?: number | null;
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateApiRegistroData {
    nombre?: string;
    endpoint?: string;
    empresa_id?: number | null;
    status?: "ACTIVO" | "INACTIVO";
}

export class ApisRegistroService {
    static async getApisRegistro(params?: GetApisRegistroParams): Promise<ApisRegistroResponse> {
        const response = await api.get<ApisRegistroResponse>('/apis-registro', { params });
        return response.data;
    }

    static async getApiRegistroById(id: number): Promise<ApiRegistro> {
        const response = await api.get<ApiRegistro>(`/apis-registro/${id}`);
        return response.data;
    }

    static async createApiRegistro(data: CreateApiRegistroData): Promise<ApiRegistro> {
        const response = await api.post<ApiRegistro>('/apis-registro', data);
        return response.data;
    }

    static async updateApiRegistro(id: number, data: UpdateApiRegistroData): Promise<ApiRegistro> {
        const response = await api.put<ApiRegistro>(`/apis-registro/${id}`, data);
        return response.data;
    }

    static async deleteApiRegistro(id: number): Promise<void> {
        await api.delete(`/apis-registro/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<ApiRegistro> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateApiRegistro(id, { status: newStatus });
    }
}
