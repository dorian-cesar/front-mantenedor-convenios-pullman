import { api } from '@/lib/api';

export interface Carabinero {
    id: number;
    nombre_completo: string;
    rut: string;
    status: "ACTIVO" | "INACTIVO";
}

export interface GetCarabinerosParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    rut?: string;
    nombre_completo?: string;
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

    static async createCarabinero(data: CreateCarabineroParams): Promise<Carabinero> {
        const response = await api.post('/carabineros', data);
        return response.data;
    }

    static async updateCarabinero(id: number, data: UpdateCarabineroParams): Promise<Carabinero> {
        const response = await api.put(`/carabineros/${id}`, data);
        return response.data;
    }

    static async deleteCarabinero(id: number): Promise<void> {
        const response = await api.delete(`/carabineros/${id}`);
        return response.data;
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Carabinero> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateCarabinero(id, { status: newStatus });
    }
}