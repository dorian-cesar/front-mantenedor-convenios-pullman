import { api } from '@/lib/api';

export interface Reembolso {
    id?: number;
    token?: string;
    pnr: string;
    categoria: 'ANULACION' | 'REEMBOLSO';
    numero_asiento: string;
    operador: string;
    fecha_cancelacion: string;
    monto: number;
    origen?: string;
    destino?: string;
    correo?: string;
    rut?: string;
    numero_cuenta?: string;
    banco?: string;
    tipo_cuenta?: string;
    nombre_beneficiario?: string;
    estado: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
}

export interface GetReembolsosParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    search?: string;
    estado?: string;
    pnr?: string;
    rut?: string;
}

export interface ReembolsosResponse {
    total: number;
    totalPages: number;
    currentPage: number;
    rows: Reembolso[];
}

export class ReembolsoService {
    static async getReembolsos(params?: GetReembolsosParams): Promise<ReembolsosResponse> {
        const response = await api.get<ReembolsosResponse>('/reembolsos', { params });
        return response.data;
    }

    static async getReembolsoById(id: number): Promise<Reembolso> {
        const response = await api.get<Reembolso>(`/reembolsos/${id}`);
        return response.data;
    }

    static async crearReembolso(data: Reembolso): Promise<Reembolso> {
        const response = await api.post<Reembolso>('/reembolsos', data);
        return response.data;
    }

    static async actualizarReembolso(id: number, data: Partial<Reembolso>): Promise<Reembolso> {
        const response = await api.put<Reembolso>(`/reembolsos/${id}`, data);
        return response.data;
    }

    static async deleteReembolso(id: number): Promise<void> {
        await api.delete(`/reembolsos/${id}`);
    }

    // Métodos públicos (por token)
    static async getReembolsoByToken(token: string): Promise<Reembolso> {
        const response = await api.get(`/reembolsos/public/${token}`);
        return response.data;
    }

    static async updateReembolsoByToken(token: string, data: Partial<Reembolso>): Promise<Reembolso> {
        const response = await api.put(`/reembolsos/public/${token}`, data);
        return response.data;
    }

    static async syncMonday(id: number): Promise<{ message: string; mondayItemId: string }> {
        const response = await api.post(`reembolsos/${id}/sync-monday`);
        return response.data;
    }

    static async resetReembolso(id: number): Promise<{ message: string }> {
        const response = await api.post(`reembolsos/${id}/reset`);
        return response.data;
    }

    static async sendEmail(id: number, email?: string): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/reembolsos/${id}/send-email`, { email });
        return response.data;
    }
}
