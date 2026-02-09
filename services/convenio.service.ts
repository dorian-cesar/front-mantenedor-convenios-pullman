import { api } from '@/lib/api';

export interface Convenio {
    id: number;
    nombre: string;
    empresa_id: number | null;
    status: "ACTIVO" | "INACTIVO";
    tipo_consulta?: "API_EXTERNA" | "CODIGO_DESCUENTO";
    endpoint?: string;
    fecha_inicio?: string;
    fecha_termino?: string;
    tope_monto_ventas?: number;
    tope_cantidad_tickets?: number;
    porcentaje_descuento?: number;
    codigo?: string;
    limitar_por_stock?: boolean;
    limitar_por_monto?: boolean;
    empresa?: {
        id: number;
        nombre: string;
        rut: string;
    };
    createdAt?: string;
    updatedAt?: string;
    api_consulta_id?: number;
}

export interface GetConveniosParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    nombre?: string;
    empresa_id?: number;
}

export interface ConveniosResponse {
    totalItems: number;
    rows: Convenio[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateConvenioData {
    nombre: string;
    empresa_id?: number | null;
    tipo_consulta: "API_EXTERNA" | "CODIGO_DESCUENTO";
    codigo?: string;
    porcentaje_descuento?: number;
    tope_monto_ventas?: number;
    tope_cantidad_tickets?: number;
    api_consulta_id?: number;
    limitar_por_stock?: boolean;
    limitar_por_monto?: boolean;
}

export interface UpdateConvenioData {
    nombre?: string;
    empresa_id?: number | null;
    status?: "ACTIVO" | "INACTIVO";
    tipo_consulta?: "API_EXTERNA" | "CODIGO_DESCUENTO";
    codigo?: string;
    porcentaje_descuento?: number;
    tope_monto_ventas?: number;
    tope_cantidad_tickets?: number;
    api_consulta_id?: number;
    limitar_por_stock?: boolean | null;
    limitar_por_monto?: boolean | null;
}

export class ConveniosService {
    static async getConvenios(params?: GetConveniosParams): Promise<ConveniosResponse> {
        const response = await api.get<ConveniosResponse>('/convenios', { params });
        return response.data;
    }

    static async getConvenioById(id: number): Promise<Convenio> {
        const response = await api.get<Convenio>(`/convenios/${id}`);
        return response.data;
    }

    static async createConvenio(data: CreateConvenioData): Promise<Convenio> {
        const response = await api.post<Convenio>('/convenios', data);
        return response.data;
    }

    static async updateConvenio(id: number, data: UpdateConvenioData): Promise<Convenio> {
        const response = await api.put<Convenio>(`/convenios/${id}`, data);
        return response.data;
    }

    static async deleteConvenio(id: number): Promise<void> {
        await api.delete(`/convenios/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Convenio> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateConvenio(id, { status: newStatus });
    }
}