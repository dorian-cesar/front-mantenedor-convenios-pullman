import { api } from '@/lib/api';

export const normalizeStr = (s: string | undefined): string => {
    if (!s) return ""
    const map: Record<string, string> = {
        "SOLO_IDA": "Solo Ida",
        "IDA_VUELTA": "Ida y Vuelta",
        "SEMICAMA": "Semi Cama",
        "SALON_CAMA": "Salon Cama",
        "CAMA_PREMIUM": "Cama",
        "CAMA": "Cama",
        "EJECUTIVO": "Ejecutivo",
        "Solo ida": "Solo Ida",
        "Semi cama": "Semi Cama",
        "Salon cama": "Salon Cama",
        "Ida y vuelta": "Ida y Vuelta"
    }
    const upperS = s.toUpperCase().replace(/\s+/g, '_')
    return map[upperS] || map[s] || s
}

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

    static mapConvenioToUpdateData(convenio: Convenio): UpdateConvenioData {
        const data: UpdateConvenioData = {
            nombre: convenio.nombre,
            empresa_id: typeof convenio.empresa === 'object' && convenio.empresa !== null
                ? (convenio.empresa as any).id
                : (typeof convenio.empresa_id === 'number' ? convenio.empresa_id : null),
            status: convenio.status,
            tipo_consulta: convenio.tipo_consulta,
            codigo: convenio.codigo || null,
            api_consulta_id: convenio.api_consulta_id || convenio.api_url_id || null,
            tipo_descuento: (convenio.tipo_descuento as TipoDescuento) || null,
            valor_descuento: convenio.valor_descuento !== null && convenio.valor_descuento !== undefined ? Number(convenio.valor_descuento) : null,
            tipo_alcance: (convenio.tipo_alcance as TipoAlcance) || "Global",
            limitar_por_stock: convenio.limitar_por_stock ?? null,
            limitar_por_monto: convenio.limitar_por_monto ?? null,
            beneficio: !!convenio.beneficio,
            imagenes: convenio.imagenes || [],
            fecha_inicio: convenio.fecha_inicio || null,
            fecha_termino: convenio.fecha_termino || null,
            rutas: (convenio.rutas || []).map((ruta: any) => {
                const r = { ...ruta }
                // No eliminamos origen_codigo/destino_codigo ya que el usuario los necesita
                delete r.configuraciones
                return r
            }),
            configuraciones: (convenio.configuraciones || []).slice(0, 1).map((c: any) => ({
                tipo_viaje: normalizeStr(c.tipo_viaje),
                tipo_asiento: normalizeStr(c.tipo_asiento),
                precio_solo_ida: c.precio_solo_ida ? Number(c.precio_solo_ida) : 0,
                precio_ida_vuelta: c.precio_ida_vuelta ? Number(c.precio_ida_vuelta) : 0,
                max_pasajes: c.max_pasajes ? Number(c.max_pasajes) : 1
            })),
        };

        // Solo incluir topes si no son null/undefined, para evitar VALIDATION_ERROR si el back no los espera
        if (convenio.tope_monto_descuento !== null && convenio.tope_monto_descuento !== undefined) {
            data.tope_monto_descuento = Number(convenio.tope_monto_descuento);
        }
        if (convenio.tope_cantidad_tickets !== null && convenio.tope_cantidad_tickets !== undefined) {
            data.tope_cantidad_tickets = Number(convenio.tope_cantidad_tickets);
        }

        return data;
    }
}