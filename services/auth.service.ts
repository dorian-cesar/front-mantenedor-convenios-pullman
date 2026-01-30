import { api } from '@/lib/api';

export interface LoginCredentials {
    correo: string;
    password: string;
}

export interface LoginResponse {
    user: {
        id: number;
        correo: string;
        nombre: string | null;
        telefono: string | null;
        rol: string;
    };
    token: string;
}

export interface TokenValidation {
    isValid: boolean;
    expiresIn?: number; // segundos restantes
    isExpired: boolean;
    user?: {
        id: number;
        correo: string;
        rol: string;
    };
}

export class AuthService {
    static async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login', credentials);

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        document.cookie = `token=${response.data.token}; path=/; max-age=${15 * 60}`;

        return response.data;
    }

    static validateToken(token: string): TokenValidation {
        if (!token) {
            return { isValid: false, isExpired: true };
        }

        try {
            // Decodificar token JWT
            const payloadBase64 = token.split('.')[1];
            const payload = JSON.parse(atob(payloadBase64));

            if (!payload.exp) {
                // Si el token no tiene expiración, considerar válido
                return {
                    isValid: true,
                    isExpired: false,
                    user: payload
                };
            }

            // Calcular tiempo restante
            const expiresAt = payload.exp * 1000; // Convertir a milisegundos
            const now = Date.now();
            const expiresIn = Math.floor((expiresAt - now) / 1000);

            return {
                isValid: true,
                expiresIn: expiresIn > 0 ? expiresIn : 0,
                isExpired: expiresIn <= 0,
                user: payload
            };
        } catch (error) {
            console.error('Error validando token:', error);
            return { isValid: false, isExpired: true };
        }
    }

    static logout(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    }

    static getCurrentUser() {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        }
        return null;
    }

    static getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }

    static isTokenExpiringSoon(thresholdMinutes: number = 10): boolean {
        const token = this.getToken();
        if (!token) return true;

        const validation = this.validateToken(token);
        if (!validation.expiresIn || validation.isExpired) return true;

        // Convertir minutos a segundos
        const thresholdSeconds = thresholdMinutes * 60;
        return validation.expiresIn <= thresholdSeconds;
    }
}