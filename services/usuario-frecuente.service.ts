import { api } from '@/lib/api';

export interface UsuarioFrecuente {
    id: number;
    nombre: string;
    rut: string;
    telefono: string;
    correo: string;
    direccion: string;
    status: "ACTIVO" | "INACTIVO";
    imagen_cedula_identidad?: string;
    imagen_certificado?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetUsuariosFrecuentesParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    nombre?: string;
    rut?: string;
}

export interface UsuariosFrecuentesResponse {
    totalItems: number;
    rows: UsuarioFrecuente[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateUsuarioFrecuenteData {
    nombre: string;
    rut: string;
    telefono: string;
    correo: string;
    direccion: string;
    imagen_cedula_identidad?: string;
    imagen_certificado?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateUsuarioFrecuenteData {
    nombre?: string;
    rut?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    imagen_cedula_identidad?: string;
    imagen_certificado?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export class UsuariosFrecuentesService {
    static async getUsuariosFrecuentes(params?: GetUsuariosFrecuentesParams): Promise<UsuariosFrecuentesResponse> {
        const response = await api.get<UsuariosFrecuentesResponse>('/pasajeros-frecuentes', { params });
        return response.data;
    }

    static async getUsuarioFrecuenteById(id: number): Promise<UsuarioFrecuente> {
        const response = await api.get<UsuarioFrecuente>(`/pasajeros-frecuentes/${id}`);
        return response.data;
    }

    static async createUsuarioFrecuente(data: CreateUsuarioFrecuenteData): Promise<UsuarioFrecuente> {
        const response = await api.post<UsuarioFrecuente>('/pasajeros-frecuentes', data);
        return response.data;
    }

    static async updateUsuarioFrecuente(id: number, data: UpdateUsuarioFrecuenteData): Promise<UsuarioFrecuente> {
        const response = await api.put<UsuarioFrecuente>(`/pasajeros-frecuentes/${id}`, data);
        return response.data;
    }

    static async deleteUsuarioFrecuente(id: number): Promise<void> {
        await api.delete(`/pasajeros-frecuentes/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<UsuarioFrecuente> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateUsuarioFrecuente(id, { status: newStatus });
    }
}
