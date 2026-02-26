import { api } from '@/lib/api';
import { Empresa } from './empresa.service';
import { Convenio } from './convenio.service';

export interface Fach {
    id: number;
    nombre_completo: string;
    status: "ACTIVO" | "INACTIVO";
    empresa: Empresa;
    convenio_id: number | null;
    convenio: Convenio | null;
    createdAt: string;
    updatedAt: string;
}

export interface GetFachParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
    search?: string;
    rut?: string;
}

export interface FachResponse {
    totalItems: number;
    rows: Fach[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateFachData {
    rut: string;
    nombre_completo: string;
    empresa_id: number;
    convenio_id?: number | null;
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateFachData {
    rut?: string;
    nombre_completo?: string;
    empresa_id?: number;
    convenio_id?: number | null;
    status?: "ACTIVO" | "INACTIVO";
}

export class FachService {
    static async getFach(params?: GetFachParams): Promise<FachResponse> {
        const response = await api.get('/fach', { params });

        return {
            totalItems: response.data.totalItems,
            rows: response.data.data,
            totalPages: response.data.totalPages,
            currentPage: response.data.currentPage,
        };
    }

    static async getFachById(id: number): Promise<Fach> {
        const response = await api.get<Fach>(`/fach/${id}`);
        return response.data;
    }

    static async createFach(data: CreateFachData): Promise<Fach> {
        const response = await api.post<Fach>('/fach', data);
        return response.data;
    }

    static async updateFach(id: number, data: UpdateFachData): Promise<Fach> {
        const response = await api.put<Fach>(`/fach/${id}`, data);
        return response.data;
    }

    static async deleteFach(id: number): Promise<void> {
        await api.delete(`/fach/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Fach> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateFach(id, { status: newStatus });
    }
}