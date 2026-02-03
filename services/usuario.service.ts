import { api } from '@/lib/api';

export interface Usuario {
    id: number;
    correo: string;
    nombre: string | null;
    rut: string | null;
    telefono: string | null;
    status: "ACTIVO" | "INACTIVO";
    rol: "USUARIO" | "SUPER_USUARIO" | null;
    rol_id: number | null;
}

export interface GetUsuariosParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    correo?: string;
}

export interface UsuariosResponse {
    totalItems: number;
    rows: Usuario[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateUsuarioData {
    correo: string;
    password: string;
    rol?: "USUARIO" | "SUPER_USUARIO";
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateUsuarioData {
    correo?: string;
    password?: string;
    rol?: "USUARIO" | "SUPER_USUARIO";
    status?: "ACTIVO" | "INACTIVO";
}

export class UsuariosService {
    static async getUsuarios(params?: GetUsuariosParams): Promise<UsuariosResponse> {
        const response = await api.get<UsuariosResponse>('/admin/usuarios', { params });
        return response.data;
    }

    static async getUsuarioById(id: number): Promise<Usuario> {
        const response = await api.get<Usuario>(`/admin/usuarios/${id}`);
        return response.data;
    }

    static async createUsuario(data: CreateUsuarioData): Promise<Usuario> {
        const response = await api.post<Usuario>('/admin/usuarios', data);
        return response.data;
    }

    static async updateUsuario(id: number, data: UpdateUsuarioData): Promise<Usuario> {
        const response = await api.put<Usuario>(`/admin/usuarios/${id}`, data);
        return response.data;
    }

    static async deleteUsuario(id: number): Promise<void> {
        await api.delete(`/admin/usuarios/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Usuario> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateUsuario(id, { status: newStatus });
    }
}