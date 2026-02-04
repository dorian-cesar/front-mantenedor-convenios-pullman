import { api } from '@/lib/api';

export interface TipoPasajero {
    id: number;
    nombre: string;
}

export class TipoPasajeroService {
    static async getTiposPasajero(): Promise<TipoPasajero[]> {
        const response = await api.get<TipoPasajero[]>('/tipos-pasajero');
        return response.data;
    }

    static getTiposPasajeroStatic(): TipoPasajero[] {
        return [
            { id: 1, nombre: "ESTUDIANTE" },
            { id: 2, nombre: "GENERAL" },
            { id: 3, nombre: "ADULTO MAYOR" },
        ];
    }
}