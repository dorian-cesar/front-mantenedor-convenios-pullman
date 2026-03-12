import { api } from '@/lib/api';

export type TipoDescuento = "Porcentaje" | "Monto Fijo" | "Tarifa Plana";
export type TipoAlcance = "Global" | "Rutas Especificas";

export interface RutaConfiguracion {
    tipo_viaje: string;
    tipo_asiento: string;
    precio_solo_ida?: number;
    precio_ida_vuelta?: number;
    max_pasajes?: number;
}

export interface Ruta {
    origen_codigo: string;
    origen_ciudad: string;
    destino_codigo: string;
    destino_ciudad: string;
    configuraciones?: RutaConfiguracion[];
}

export interface Convenio {
    id: number;
    nombre: string;
    empresa_id: number | null;
    empresa_nombre?: string;
    empresa_rut?: string;
    status: "ACTIVO" | "INACTIVO";
    tipo_consulta?: "API_EXTERNA" | "CODIGO_DESCUENTO";
    api_url_id?: number;
    endpoint?: string;
    fecha_inicio?: string;
    fecha_termino?: string;
    tope_monto_descuento?: number;
    tope_cantidad_tickets?: number;
    porcentaje_descuento?: number;
    tipo_descuento?: TipoDescuento;
    valor_descuento?: number | null;
    tipo_alcance?: TipoAlcance;
    codigo?: string;
    limitar_por_stock?: boolean;
    limitar_por_monto?: boolean;
    beneficio?: boolean;
    imagenes?: string[];
    consumo_tickets?: number;
    consumo_monto_descuento?: number;
    rutas?: Ruta[];
    configuraciones?: RutaConfiguracion[];
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
    tipo_descuento?: TipoDescuento;
    valor_descuento?: number;
    tipo_alcance?: TipoAlcance;
    tope_monto_descuento?: number;
    tope_cantidad_tickets?: number;
    api_consulta_id?: number;
    limitar_por_stock?: boolean;
    limitar_por_monto?: boolean;
    beneficio?: boolean;
    imagenes?: string[];
    fecha_inicio?: string;
    fecha_termino?: string;
    rutas?: Ruta[];
    configuraciones?: RutaConfiguracion[];
}

export interface UpdateConvenioData {
    nombre?: string;
    empresa_id?: number | null;
    status?: "ACTIVO" | "INACTIVO";
    tipo_consulta?: "API_EXTERNA" | "CODIGO_DESCUENTO";
    codigo?: string | null;
    tipo_descuento?: TipoDescuento | null;
    valor_descuento?: number | null;
    tipo_alcance?: TipoAlcance | null;
    tope_monto_descuento?: number | null;
    tope_cantidad_tickets?: number | null;
    api_consulta_id?: number | null;
    limitar_por_stock?: boolean | null;
    limitar_por_monto?: boolean | null;
    beneficio?: boolean;
    imagenes?: string[];
    fecha_inicio?: string | null;
    fecha_termino?: string | null;
    rutas?: Ruta[] | null;
    configuraciones?: RutaConfiguracion[] | null;
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