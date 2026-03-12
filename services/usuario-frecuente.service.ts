import { api } from '@/lib/api';

export interface UsuarioFrecuente {
    id: number;
    nombre: string;
    rut: string;
    telefono: string;
    correo: string;
    direccion: string;
    status: "ACTIVO" | "INACTIVO" | "RECHAZADO";
    imagen_cedula_identidad?: string;
    imagen_certificado?: string;
    razon_rechazo?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetUsuariosFrecuentesParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
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
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
}

export interface UpdateUsuarioFrecuenteData {
    nombre?: string;
    rut?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    imagen_cedula_identidad?: string;
    imagen_certificado?: string;
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
}

export interface RechazarUsuarioFrecuenteData {
    razon_rechazo: string;
    status: "RECHAZADO";
}

export class UsuariosFrecuentesService {
    static async getUsuariosFrecuentes(params?: GetUsuariosFrecuentesParams): Promise<UsuariosFrecuentesResponse> {
        const queryParams = { ...params, empresa_id: 80 };
        const response = await api.get<UsuariosFrecuentesResponse>('/beneficiarios', { params: queryParams });
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

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO"): Promise<UsuarioFrecuente> {
        let newStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO";
        if (currentStatus === "ACTIVO") {
            newStatus = "INACTIVO";
        } else {
            newStatus = "ACTIVO";
        }
        return this.updateUsuarioFrecuente(id, { status: newStatus });
    }

    static async rechazarUsuarioFrecuente(id: number, data: RechazarUsuarioFrecuenteData): Promise<UsuarioFrecuente> {
        const response = await api.patch(`/pasajeros-frecuentes/rechazar/${id}`, data);
        return response.data;
    }
}
