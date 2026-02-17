import { api } from '@/lib/api';

export interface Role {
    id: number;
    nombre: string;
    status: "ACTIVO" | "INACTIVO";
    createdAt?: string;
    updatedAt?: string;
}

export interface GetRolesParams {
    page?: number;
    limit?: number;
    status?: "ACTIVO" | "INACTIVO";
    nombre?: string;
}

export interface RolesResponse {
    totalItems: number;
    rows: Role[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateRoleData {
    nombre: string;
    status: "ACTIVO" | "INACTIVO";
}

export interface UpdateRoleData {
    nombre?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export class RolesService {
    static async getRoles(params?: GetRolesParams): Promise<RolesResponse> {
        const response = await api.get('/roles', { params });
        return response.data;
    }

    static async getRoleById(id: number): Promise<Role> {
        const response = await api.get<Role>(`/roles/${id}`);
        return response.data;
    }

    static async createRole(data: CreateRoleData): Promise<Role> {
        const response = await api.post<Role>('/roles', data);
        return response.data;
    }

    static async updateRole(id: number, data: UpdateRoleData): Promise<Role> {
        const response = await api.put<Role>(`/roles/${id}`, data);
        return response.data;
    }

    static async deleteRole(id: number): Promise<void> {
        await api.delete(`/roles/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Role> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateRole(id, { status: newStatus });
    }
}