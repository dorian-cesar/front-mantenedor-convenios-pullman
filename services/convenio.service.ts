import { api } from '@/lib/api';

export interface Convenio {
    id: number;
    nombre: string;
    empresa_id: number | null;
    status: "ACTIVO" | "INACTIVO";
    empresa?: {
        id: number;
        nombre: string;
        rut: string;
    };
    tipo_consulta?: "API_EXTERNA" | "CODIGO_DESCUENTO";
    fecha_inicio?: string;
    fecha_termino?: string;
    tope_monto_ventas?: number;
    tope_cantidad_tickets?: number;
    descuento?: {
        id: number;
        porcentaje: number;
        tipo_pasajero_id: number;
        status: "ACTIVO" | "INACTIVO";
    }
    createdAt?: string;
    updatedAt?: string;
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
    status?: "ACTIVO" | "INACTIVO";
    tipo_consulta?: "API_EXTERNA" | "CODIGO_DESCUENTO";
    tope_monto_ventas?: number;
    tope_cantidad_tickets?: number;
}

export interface UpdateConvenioData {
    nombre?: string;
    empresa_id?: number | null;
    status?: "ACTIVO" | "INACTIVO";
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