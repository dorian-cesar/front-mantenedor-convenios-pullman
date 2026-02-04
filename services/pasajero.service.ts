import { api } from '@/lib/api';

export interface Pasajero {
    id: number;
    rut: string;
    nombres: string | null;
    apellidos: string | null;
    fecha_nacimiento: string | null;
    correo: string | null;
    telefono: string | null;
    tipo_pasajero_id: number | null;
    empresa_id: number | null;
    convenio_id: number | null;
    status: "ACTIVO" | "INACTIVO";
}

export interface GetPasajerosParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    empresa_id?: number;
    convenio_id?: number;
    tipo_pasajero_id?: number;
    search?: string;
}

export interface PasajerosResponse {
    totalItems: number;
    rows: Pasajero[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreatePasajeroData {
    rut: string;
    nombres?: string;
    apellidos?: string;
    fecha_nacimiento?: string;
    correo?: string;
    telefono?: string;
    tipo_pasajero_id?: number;
    empresa_id?: number;
    convenio_id?: number;
    status?: "ACTIVO" | "INACTIVO";
}

export interface AsociarPasajeroData {
    rut: string;
    nombres?: string;
    apellidos?: string;
    fecha_nacimiento?: string;
    correo?: string;
    telefono?: string;
    empresa_id?: number;
    convenio_id?: number;
    eventos_ids?: number[];
}

export interface UpdatePasajeroData {
    rut?: string;
    nombres?: string;
    apellidos?: string;
    fecha_nacimiento?: string;
    correo?: string;
    telefono?: string;
    tipo_pasajero_id?: number;
    empresa_id?: number;
    convenio_id?: number;
    status?: "ACTIVO" | "INACTIVO";
}

export class PasajerosService {
    static async getPasajeros(params?: GetPasajerosParams): Promise<PasajerosResponse> {
        const response = await api.get<PasajerosResponse>('/pasajeros', { params });
        return response.data;
    }

    static async getPasajeroById(id: number): Promise<Pasajero> {
        const response = await api.get<Pasajero>(`/pasajeros/${id}`);
        return response.data;
    }

    static async createPasajero(data: CreatePasajeroData): Promise<Pasajero> {
        const response = await api.post<Pasajero>('/pasajeros', data);
        return response.data;
    }

    static async asociarPasajero(data: AsociarPasajeroData): Promise<Pasajero> {
        const response = await api.post<Pasajero>('/pasajeros/asociar', data);
        return response.data;
    }

    static async updatePasajero(id: number, data: UpdatePasajeroData): Promise<Pasajero> {
        const response = await api.put<Pasajero>(`/pasajeros/${id}`, data);
        return response.data;
    }

    static async deletePasajero(id: number): Promise<void> {
        await api.delete(`/pasajeros/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Pasajero> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updatePasajero(id, { status: newStatus });
    }
}