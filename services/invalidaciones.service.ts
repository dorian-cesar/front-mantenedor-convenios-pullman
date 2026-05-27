import { api } from '@/lib/api';

export interface InvalidacionLog {
    id: number;
    fecha: string;
    endpoint: string;
    metodo: string;
    rut?: string;
    pnr?: string;
    numero_ticket?: string;
    error_mensaje?: string;
    payload?: any;
    ip?: string;
    user_identifier?: string;
}

export interface GetInvalidacionesParams {
    page?: number;
    limit?: number;
    rut?: string;
    pnr?: string;
    numero_ticket?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

export interface InvalidacionesResponse {
    total: number;
    totalPages: number;
    currentPage: number;
    rows: InvalidacionLog[];
}

export class InvalidacionesService {
    static async getLogs(params?: GetInvalidacionesParams): Promise<InvalidacionesResponse> {
        const response = await api.get<InvalidacionesResponse>('/invalidaciones', { params });
        return response.data;
    }

    static async getLogById(id: number): Promise<InvalidacionLog> {
        const response = await api.get<InvalidacionLog>(`/invalidaciones/${id}`);
        return response.data;
    }
}
