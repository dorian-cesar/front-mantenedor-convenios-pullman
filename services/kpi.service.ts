import { api } from '@/lib/api';

export interface Resumen {
    periodo: string;
    total_ventas: string;
    total_devoluciones: string;
    total_descuento: string;
    total_pasajeros: number;
}

export interface GetResumenParams {
    granularidad?: "diario" | "semanal" | "mensual" | "trimestral" | "semestral" | "anual" | "bienal" | "trienal" | "cuatrienal" | "quinquenal";
    empresa_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
}

export interface ResumenResponse {
    totalItems: number;
    totalPages?: number;
    currentPage?: number;
    rows: Resumen[];
}

export const KpiService = {
    getResumen: async (params: GetResumenParams): Promise<ResumenResponse> => {
        const response = await api.get<ResumenResponse>('/kpis/resumen', { params });
        return response.data;
    },

    getPorConvenio: async (params: GetResumenParams): Promise<any[]> => {
        const response = await api.get<any[]>('/kpis/por-convenio', { params });
        return response.data;
    }
};