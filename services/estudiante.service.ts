import { api } from '@/lib/api';

export interface Estudiante {
    id: number;
    nombre: string;
    rut: string;
    telefono: string;
    correo: string;
    direccion: string;
    imagen_cedula_identidad?: string;
    imagen_certificado_alumno_regular?: string;
    imagenes?: Record<string, string>;
    razon_rechazo?: string;
    status: "ACTIVO" | "INACTIVO" | "RECHAZADO";
    convenio_id?: number;
    convenio?: {
        nombre: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface GetEstudiantesParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
    nombre?: string;
    rut?: string;
}

export interface EstudiantesResponse {
    totalItems: number;
    rows: Estudiante[];
    totalPages?: number;
    currentPage?: number;
}

export interface CreateEstudianteData {
    nombre: string;
    rut: string;
    telefono: string;
    correo: string;
    direccion: string;
    imagen_cedula_identidad?: string;
    imagen_certificado_alumno_regular?: string;
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
}

export interface UpdateEstudianteData {
    nombre?: string;
    rut?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    imagen_cedula_identidad?: string;
    imagen_certificado_alumno_regular?: string;
    razon_rechazo?: string;
    status?: "ACTIVO" | "INACTIVO" | "RECHAZADO";
}

export interface RechazarEstudianteData {
    razon_rechazo: string;
    status: "RECHAZADO";
}

export class EstudiantesService {
    static async getEstudiantes(params?: GetEstudiantesParams): Promise<EstudiantesResponse> {
        const queryParams = { ...params, empresa_id: 71 };
        const response = await api.get<EstudiantesResponse>('/beneficiarios', { params: queryParams });
        return response.data;
    }

    static async getEstudianteById(id: number): Promise<Estudiante> {
        const response = await api.get<Estudiante>(`/beneficiarios/${id}`);
        return response.data;
    }

    static async createEstudiante(data: CreateEstudianteData): Promise<Estudiante> {
        const response = await api.post<Estudiante>('/beneficiarios', data);
        return response.data;
    }

    static async updateEstudiante(id: number, data: UpdateEstudianteData): Promise<Estudiante> {
        const response = await api.put<Estudiante>(`/beneficiarios/${id}`, data);
        return response.data;
    }

    static async deleteEstudiante(id: number): Promise<void> {
        await api.delete(`/beneficiarios/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO"): Promise<Estudiante> {
        let newStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO";
        if (currentStatus === "ACTIVO") {
            newStatus = "INACTIVO";
        } else {
            newStatus = "ACTIVO";
        }
        return this.updateEstudiante(id, { status: newStatus });
    }

    static async rechazarEstudiante(id: number, data: RechazarEstudianteData): Promise<Estudiante> {
        const response = await api.patch(`/beneficiarios/rechazar/${id}`, data);
        return response.data;
    }
}
