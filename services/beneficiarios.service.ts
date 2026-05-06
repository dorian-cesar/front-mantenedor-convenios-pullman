import { api } from '@/lib/api';

export interface Beneficiario {
    id: number;
    nombre: string;
    rut: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    status: "ACTIVO" | "INACTIVO" | "RECHAZADO";
    razon_rechazo?: string;
    convenio_id?: number;
    convenio?: {
        nombre: string;
    };
    empresa_id?: number;
    imagenes?: Record<string, string>;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetBeneficiariosParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
    search?: string;
    convenio_id?: number;
    empresa_id?: number;
    id?: number | string;
    rut?: string;
    correo?: string;
}

export interface BeneficiariosResponse {
    data: Beneficiario[];
    total: number;
    pages: number;
    currentPage: number;
}

export interface UpdateBeneficiarioData {
    nombre?: string;
    rut?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
    imagenes?: Record<string, string>;
    convenio_id?: number;
}

export interface RechazarBeneficiarioData {
    razon_rechazo: string;
    status: "RECHAZADO";
}

export class BeneficiariosService {
    static async getBeneficiarios(params: GetBeneficiariosParams = {}): Promise<any> {
        const response = await api.get('/beneficiarios', { params });
        return response.data;
    }

    static async getBeneficiarioById(id: number): Promise<Beneficiario> {
        const response = await api.get<Beneficiario>(`/beneficiarios/${id}`);
        return response.data;
    }

    static async createBeneficiario(data: any): Promise<Beneficiario> {
        const response = await api.post<Beneficiario>('/beneficiarios', data);
        return response.data;
    }

    static async updateBeneficiario(id: number, data: UpdateBeneficiarioData): Promise<Beneficiario> {
        const response = await api.put<Beneficiario>(`/beneficiarios/${id}`, data);
        return response.data;
    }

    static async deleteBeneficiario(id: number): Promise<void> {
        await api.delete(`/beneficiarios/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO"): Promise<Beneficiario> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateBeneficiario(id, { status: newStatus });
    }

    static async rechazarBeneficiario(id: number, data: RechazarBeneficiarioData): Promise<Beneficiario> {
        const response = await api.patch(`/beneficiarios/rechazar/${id}`, data);
        return response.data;
    }
}
