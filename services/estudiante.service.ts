import { api } from '@/lib/api';

export interface Estudiante {
    id: number;
    nombre: string;
    rut: string;
    telefono: string;
    correo: string;
    direccion: string;
    carnet_estudiante: string;
    fecha_vencimiento: string;
    imagen_base64?: string;
    status: "ACTIVO" | "INACTIVO";
    createdAt?: string;
    updatedAt?: string;
}

export interface GetEstudiantesParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
    status?: "ACTIVO" | "INACTIVO";
    nombre?: string;
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
    carnet_estudiante: string;
    fecha_vencimiento: string;
    imagen_base64?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export interface UpdateEstudianteData {
    nombre?: string;
    rut?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    carnet_estudiante?: string;
    fecha_vencimiento?: string;
    imagen_base64?: string;
    status?: "ACTIVO" | "INACTIVO";
}

export class EstudiantesService {
    static async getEstudiantes(params?: GetEstudiantesParams): Promise<EstudiantesResponse> {
        const response = await api.get<EstudiantesResponse>('/estudiantes', { params });
        return response.data;
    }

    static async getEstudianteById(id: number): Promise<Estudiante> {
        const response = await api.get<Estudiante>(`/estudiantes/${id}`);
        return response.data;
    }

    static async createEstudiante(data: CreateEstudianteData): Promise<Estudiante> {
        const response = await api.post<Estudiante>('/estudiantes', data);
        return response.data;
    }

    static async updateEstudiante(id: number, data: UpdateEstudianteData): Promise<Estudiante> {
        const response = await api.put<Estudiante>(`/estudiantes/${id}`, data);
        return response.data;
    }

    static async deleteEstudiante(id: number): Promise<void> {
        await api.delete(`/estudiantes/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: "ACTIVO" | "INACTIVO"): Promise<Estudiante> {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        return this.updateEstudiante(id, { status: newStatus });
    }
}
