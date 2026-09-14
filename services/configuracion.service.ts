import { api } from '@/lib/api';

export interface ConfiguracionParams {
    HERO_LISTA_A_COUNT?: string;
    HERO_LISTA_B_COUNT?: string;
}

export class ConfiguracionService {
    static async getParametros(): Promise<ConfiguracionParams> {
        const response = await api.get<ConfiguracionParams>('/configuraciones');
        return response.data;
    }

    static async updateParametros(countA?: number, countB?: number): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>('/configuraciones', { countA, countB });
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
}
