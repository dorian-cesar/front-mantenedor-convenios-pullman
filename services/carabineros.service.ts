import { api } from '@/lib/api';
import { Convenio } from './convenio.service';

export interface Carabinero {
    id: number;
    nombre_completo: string;
    rut: string;
    correo?: string;
    status: "ACTIVO" | "INACTIVO";
    convenio_id?: number | null;
    convenio?: {
        nombre: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface GetCarabinerosParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
    id?: number | string;
    correo?: string;
    rut?: string;
    nombre_completo?: string;
    search?: string;
    convenio_id?: number;
}

export interface CarabinerosResponse {
    totalItems: number;
    rows: Carabinero[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateCarabineroParams {
    nombre_completo: string;
    rut: string;
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateCarabineroParams {
    nombre_completo?: string;
    rut?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export class CarabinerosService {
    static async getCarabineros(params: GetCarabinerosParams): Promise<CarabinerosResponse> {
        const response = await api.get('/carabineros', { params: params });
        return response.data;
    }

    static async getCarabineroByRut(rut: string): Promise<Carabinero> {
        const response = await api.get<Carabinero>(`/carabineros/${rut}`);
        return response.data;
    }

    static async createCarabinero(data: CreateCarabineroParams): Promise<Carabinero> {
        const response = await api.post('/carabineros', data);
        return response.data;
    }

    static async updateCarabinero(rut: string, data: UpdateCarabineroParams): Promise<Carabinero> {
        const response = await api.put(`/carabineros/${rut}`, data);
        return response.data;
    }

    static async deleteCarabinero(rut: string): Promise<void> {
        const response = await api.delete(`/carabineros/${rut}`);
        return response.data;
    }

    static async toggleStatus(rut: string, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Carabinero> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateCarabinero(rut, { status: newStatus });
    }
}