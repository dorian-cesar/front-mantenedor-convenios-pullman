import { api } from '@/lib/api';

export interface CodigoDescuento {
    id: number;
    convenio_id: number;
    codigo: string;
    fecha_inicio: string;
    fecha_termino: string;
    max_usos: number;
    usos_realizados: number;
    status: "ACTIVO" | "INACTIVO";
    created_at?: string;
    updated_at?: string;
    vigente?: boolean;
    convenio?: {
        id: number;
        nombre: string;
        empresa?: {
            id: number;
            nombre: string;
        } | null;
    };
    descuentos?: {
        id: number;
        porcentaje: number;
        status: "ACTIVO" | "INACTIVO";
    }[];
}

export interface GetCodigosDescuentoParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    convenio_id?: number;
    vigentes?: boolean;
    codigo?: string;
}

export interface CodigosDescuentoResponse {
    totalItems: number;
    rows: CodigoDescuento[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateCodigoDescuentoData {
    convenio_id: number;
    codigo: string;
    fecha_inicio: string;
    fecha_termino: string;
    max_usos: number;
}

export interface UpdateCodigoDescuentoData {
    codigo?: string;
    fecha_inicio?: string;
    fecha_termino?: string;
    max_usos?: number;
    status?: "ACTIVO" | "INACTIVO";
}

export class CodigosDescuentoService {
    static async getCodigosDescuento(params?: GetCodigosDescuentoParams): Promise<CodigosDescuentoResponse> {
        const response = await api.get<CodigosDescuentoResponse>('/codigos-descuento', { params });
        return response.data;
    }

    static async getCodigoDescuentoById(id: number): Promise<CodigoDescuento> {
        const response = await api.get<CodigoDescuento>(`/codigos-descuento/${id}`);
        return response.data;
    }

    static async createCodigoDescuento(data: CreateCodigoDescuentoData): Promise<CodigoDescuento> {
        const response = await api.post<CodigoDescuento>('/codigos-descuento', data);
        return response.data;
    }

    static async updateCodigoDescuento(id: number, data: UpdateCodigoDescuentoData): Promise<CodigoDescuento> {
        const response = await api.put<CodigoDescuento>(`/codigos-descuento/${id}`, data);
        return response.data;
    }

    static async deleteCodigoDescuento(id: number): Promise<void> {
        await api.delete(`/codigos-descuento/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<CodigoDescuento> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateCodigoDescuento(id, { status: newStatus });
    }
}