import { api } from '@/lib/api';

export interface Categoria {
    id: number;
    nombre: string;
    descripcion?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCategoriaData {
    nombre: string;
    descripcion?: string;
}

export interface UpdateCategoriaData {
    nombre?: string;
    descripcion?: string;
}

export class CategoriasService {
    static async getCategorias(): Promise<Categoria[]> {
        const response = await api.get<Categoria[]>('/categorias');
        return response.data;
    }

    static async getCategoriaById(id: number): Promise<Categoria> {
        const response = await api.get<Categoria>(`/categorias/${id}`);
        return response.data;
    }

    static async createCategoria(data: CreateCategoriaData): Promise<Categoria> {
        const response = await api.post<Categoria>('/categorias', data);
        return response.data;
    }

    static async updateCategoria(id: number, data: UpdateCategoriaData): Promise<Categoria> {
        const response = await api.patch<Categoria>(`/categorias/${id}`, data);
        return response.data;
    }

    static async deleteCategoria(id: number): Promise<void> {
        await api.delete(`/categorias/${id}`);
    }
}
