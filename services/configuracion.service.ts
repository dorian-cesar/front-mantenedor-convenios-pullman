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
}
