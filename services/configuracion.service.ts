import { api } from '@/lib/api';

export interface ConfiguracionParams {
    HERO_LISTA_A_COUNT?: string;
    HERO_LISTA_B_COUNT?: string;
    CARGO_SERVICIO_ACTIVO?: string;
    CARGO_SERVICIO_TIPO?: 'PORCENTAJE' | 'FIJO';
    CARGO_SERVICIO_VALOR?: string;
    REGISTRO_TITULO?: string;
    REGISTRO_TEXTO?: string;
    REGISTRO_IMAGEN?: string;
}

export class ConfiguracionService {
    static async getParametros(): Promise<ConfiguracionParams> {
        const response = await api.get<ConfiguracionParams>('/configuraciones');
        return response.data;
    }

    static async updateParametros(params: Partial<ConfiguracionParams>): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>('/configuraciones', params);
        return response.data;
    }

    static async getParametro(clave: string): Promise<{ clave: string, valor: string }> {
        const response = await api.get<{ clave: string, valor: string }>(`/configuraciones/${clave}`);
        return response.data;
    }

    static async setParametro(clave: string, valor: string): Promise<{ clave: string, valor: string }> {
        const response = await api.put<{ clave: string, valor: string }>(`/configuraciones/${clave}`, { valor });
        return response.data;
    }

    static async uploadImagen(file: File): Promise<{ message: string, path: string }> {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await api.post<{ message: string, path: string }>('/configuraciones/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    }
}
