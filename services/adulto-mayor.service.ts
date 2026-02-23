import { api } from '@/lib/api';

export interface AdultoMayor {
    id: number;
    nombre: string;
    rut: string;
    telefono: string;
    correo: string;
    direccion: string;
    imagen_cedula_identidad?: string;
    imagen_certificado_residencia?: string;
    status: "ACTIVO" | "INACTIVO" | "RECHAZADO";
    createdAt?: string;
    updatedAt?: string;
}

export interface GetAdultosMayoresParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
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
    imagen_cedula_identidad?: string;
    imagen_certificado_residencia?: string;
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
}

export interface UpdateAdultoMayorData {
    nombre?: string;
    rut?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    imagen_cedula_identidad?: string;
    imagen_certificado_residencia?: string;
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
}

export interface RechazarAdultoMayorData {
    razon_rechazo: string;
    status: "RECHAZADO";
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

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO"): Promise<AdultoMayor> {
        let newStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO";
        if (currentStatus === "ACTIVO") {
            newStatus = "INACTIVO";
        } else {
            newStatus = "ACTIVO";
        }
        return this.updateAdultoMayor(id, { status: newStatus });
    }

    static async rechazarAdultoMayor(id: number, data: RechazarAdultoMayorData): Promise<AdultoMayor> {
        const response = await api.patch(`/adultos-mayores/rechazar/${id}`, data);
        return response.data;
    }
}
