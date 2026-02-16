import { api } from '@/lib/api';

export interface AdultoMayor {
    id: number;
    nombre: string;
    rut: string;
    telefono: string;
    correo: string;
    direccion: string;
    certificado: string;
    fecha_emision: string;
    imagen_base64?: string;
    status: "ACTIVO" | "INACTIVO";
    createdAt?: string;
    updatedAt?: string;
}

export interface GetAdultosMayoresParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    rut?: string;
    nombre?: string;
}

export interface AdultosMayoresResponse {
    totalItems: number;
    rows: AdultoMayor[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateAdultoMayorData {
    nombre: string;
    rut: string;
    telefono: string;
    correo: string;
    direccion: string;
    certificado: string;
    fecha_emision: string;
    imagen_base64?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateAdultoMayorData {
    nombre?: string;
    rut?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    certificado?: string;
    fecha_emision?: string;
    imagen_base64?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export class AdultosMayoresService {
    static async getAdultosMayores(params?: GetAdultosMayoresParams): Promise<AdultosMayoresResponse> {
        const response = await api.get<AdultosMayoresResponse>('/adultos-mayores', { params });
        return response.data;
    }

    static async getAdultoMayorById(id: number): Promise<AdultoMayor> {
        const response = await api.get<AdultoMayor>(`/adultos-mayores/${id}`);
        return response.data;
    }

    static async createAdultoMayor(data: CreateAdultoMayorData): Promise<AdultoMayor> {
        const response = await api.post<AdultoMayor>('/adultos-mayores', data);
        return response.data;
    }

    static async updateAdultoMayor(id: number, data: UpdateAdultoMayorData): Promise<AdultoMayor> {
        const response = await api.put<AdultoMayor>(`/adultos-mayores/${id}`, data);
        return response.data;
    }

    static async deleteAdultoMayor(id: number): Promise<void> {
        await api.delete(`/adultos-mayores/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<AdultoMayor> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateAdultoMayor(id, { status: newStatus });
    }
}
