import { api } from '@/lib/api';

export interface RegistroTablaClienteCorporativo {
    id: number;
    nombre_tabla: string;
    nombre_display: string;
    empresa_id: number | null;
    convenio_id: number | null;
    api_consulta_id: number | null;
    status: "ACTIVO" | "INACTIVO";
    createdAt: string;
    empresa?: { id: number; nombre: string };
    convenio?: { id: number; nombre: string };
    api_consulta?: { id: number; endpoint: string };
}

export interface ClienteCorporativo {
    id: number;
    rut: string;
    nombre_completo: string;
    status: "ACTIVO" | "INACTIVO";
    empresa_id?: number | null;
    convenio_id?: number | null;
    createdAt: string;
}

export interface GetTablasParams {
    page?: number;
    limit?: number;
    empresa_id?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
}

export interface GetClientesParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    order?: "ASC" | "DESC";
}

export interface TablasResponse {
    totalItems: number;
    rows: RegistroTablaClienteCorporativo[];
    totalPages: number;
    currentPage: number;
}

export interface ClientesResponse {
    totalItems: number;
    rows: ClienteCorporativo[];
    totalPages: number;
    currentPage: number;
}

export interface CreateTablaData {
    nombre_display: string;
    empresa_id: number;
    convenio_id?: number;
    nombre_tabla_personalizado?: string;
}

export class ClienteCorporativoService {
    // Gestión de Tablas (Nóminas)
    static async getTablas(params?: GetTablasParams): Promise<TablasResponse> {
        const response = await api.get<TablasResponse>('/tablas-clientes-corporativos', { params });
        return response.data;
    }

    static async createTabla(data: CreateTablaData): Promise<RegistroTablaClienteCorporativo> {
        const response = await api.post<RegistroTablaClienteCorporativo>('/tablas-clientes-corporativos', data);
        return response.data;
    }

    static async deleteTabla(id: number): Promise<void> {
        await api.delete(`/tablas-clientes-corporativos/${id}`);
    }

    // Gestión de Clientes dentro de una Tabla
    static async getClientes(nombreTabla: string, params?: GetClientesParams): Promise<ClientesResponse> {
        const response = await api.get<ClientesResponse>(`/tablas-clientes-corporativos/${nombreTabla}/clientes`, { params });
        return response.data;
    }

    static async createCliente(nombreTabla: string, data: Partial<ClienteCorporativo>): Promise<ClienteCorporativo> {
        const response = await api.post<ClienteCorporativo>(`/tablas-clientes-corporativos/${nombreTabla}/clientes`, data);
        return response.data;
    }

    static async updateCliente(nombreTabla: string, rut: string, data: Partial<ClienteCorporativo>): Promise<ClienteCorporativo> {
        const response = await api.put<ClienteCorporativo>(`/tablas-clientes-corporativos/${nombreTabla}/clientes/${rut}`, data);
        return response.data;
    }

    static async deleteCliente(nombreTabla: string, rut: string): Promise<void> {
        await api.delete(`/tablas-clientes-corporativos/${nombreTabla}/clientes/${rut}`);
    }

    static async toggleClienteStatus(nombreTabla: string, rut: string): Promise<ClienteCorporativo> {
        const response = await api.patch<ClienteCorporativo>(`/tablas-clientes-corporativos/${nombreTabla}/clientes/${rut}/estado`);
        return response.data;
    }

    static async cargarCsv(nombreTabla: string, filas: any[]): Promise<any> {
        const response = await api.post(`/tablas-clientes-corporativos/${nombreTabla}/clientes/cargar-csv`, { filas });
        return response.data;
    }
}
