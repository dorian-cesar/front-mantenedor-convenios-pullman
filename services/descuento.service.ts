import { api } from '@/lib/api';

export interface Descuento {
    id: number;
    convenio_id: number;
    codigo_descuento_id: number;
    tipo_pasajero_id: number;
    pasajero_id: number;
    porcentaje_descuento: number;
    status: "ACTIVO" | "INACTIVO";
    codigo_descuento: {
        id: number;
        codigo: string;
    };
    tipo_pasajero: {
        id: number;
        nombre: string;
    };
    pasajero: {
        id: number;
        rut: string;
        nombres: string;
        apellidos: string;
    };
}

export interface GetDescuentosParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    convenio_id?: number;
    codigo_descuento_id?: number;
    search?: string; // Para buscar por RUT o nombre de pasajero
}

export interface DescuentosResponse {
    totalItems: number;
    rows: Descuento[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateDescuentoData {
    convenio_id: number;
    codigo_descuento_id: number;
    tipo_pasajero_id: number;
    pasajero_id: number;
    porcentaje_descuento: number;
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateDescuentoData {
    convenio_id?: number;
    codigo_descuento_id?: number;
    tipo_pasajero_id?: number;
    pasajero_id?: number;
    porcentaje_descuento?: number;
    status?: "ACTIVO" | "INACTIVO";
}

export class DescuentosService {
    static async getDescuentos(params?: GetDescuentosParams): Promise<DescuentosResponse> {
        const response = await api.get<DescuentosResponse>('/descuentos', { params });
        return response.data;
    }

    static async getDescuentoById(id: number): Promise<Descuento> {
        const response = await api.get<Descuento>(`/descuentos/${id}`);
        return response.data;
    }

    static async createDescuento(data: CreateDescuentoData): Promise<Descuento> {
        const response = await api.post<Descuento>('/descuentos', data);
        return response.data;
    }

    static async updateDescuento(id: number, data: UpdateDescuentoData): Promise<Descuento> {
        const response = await api.put<Descuento>(`/descuentos/${id}`, data);
        return response.data;
    }

    static async deleteDescuento(id: number): Promise<void> {
        await api.delete(`/descuentos/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Descuento> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateDescuento(id, { status: newStatus });
    }
}