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

export type CurrentUser = {
    id: number
    correo: string
    nombre: string | null
    telefono: string | null
    rol: string
}

export class AuthService {
    static async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login', credentials);

        const token = response.data.token;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Sincronizar con cookie para middleware
        // Usar la misma expiración que el token JWT
        const decoded = this.decodeToken(token);
        let maxAge = 15 * 60; // default 15 minutos

        if (decoded?.exp) {
            const expiresAt = decoded.exp * 1000;
            const now = Date.now();
            maxAge = Math.floor((expiresAt - now) / 1000);
            if (maxAge < 0) maxAge = 15 * 60; // fallback
        }

        document.cookie = `token=${token}; path=/; max-age=${maxAge}`;
        console.log(`Token sincronizado en cookie con expiración en ${maxAge} segundos`);

        return response.data;
    }

    static decodeToken(token: string): any {
        try {
            const payloadBase64 = token.split('.')[1];
            return JSON.parse(atob(payloadBase64));
        } catch {
            return null;
        }
    }

    static syncTokenToCookie(): void {
        if (typeof window === 'undefined') return;

        const token = this.getToken();
        if (token) {
            const decoded = this.decodeToken(token);
            let maxAge = 15 * 60;

            if (decoded?.exp) {
                const expiresAt = decoded.exp * 1000;
                const now = Date.now();
                maxAge = Math.floor((expiresAt - now) / 1000);
                if (maxAge < 0) {
                    // Token expirado, limpiar
                    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    return;
                }
            }

            document.cookie = `token=${token}; path=/; max-age=${maxAge}`;
        }
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

            const expiresAt = payload.exp * 1000;
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