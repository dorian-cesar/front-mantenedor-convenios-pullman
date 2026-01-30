import { api } from '@/lib/api';

export interface Empresa {
    id: number;
    nombre: string;
    rut_empresa: string;
    status: "ACTIVO" | "INACTIVO";
    createdAt: string;
    updatedAt: string;
}

export interface GetEmpresasParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    search?: string;
}

export interface EmpresasResponse {
    totalItems: number;
    rows: Empresa[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateEmpresaData {
    nombre: string;
    rut: string;
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateEmpresaData {
    nombre?: string;
    rut_empresa?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export class EmpresasService {
    static async getEmpresas(params?: GetEmpresasParams): Promise<EmpresasResponse> {
        const response = await api.get<EmpresasResponse>('/empresas', { params });
        return response.data;
    }

    static async getEmpresaById(id: number): Promise<Empresa> {
        const response = await api.get<Empresa>(`/empresas/${id}`);
        return response.data;
    }

    static async createEmpresa(data: CreateEmpresaData): Promise<Empresa> {
        const response = await api.post<Empresa>('/empresas', data);
        return response.data;
    }

    static async updateEmpresa(id: number, data: UpdateEmpresaData): Promise<Empresa> {
        const response = await api.patch<Empresa>(`/empresas/${id}`, data);
        return response.data;
    }

    static async deleteEmpresa(id: number): Promise<void> {
        await api.delete(`/empresas/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Empresa> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateEmpresa(id, { status: newStatus });
    }
}