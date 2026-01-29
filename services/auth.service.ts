import { api } from "@/lib/api";

export interface LoginResponse {
    accessToken: string;
    expiresIn?: number;
    tokenType?: string;
}
export interface User {
    id: string;
    email: string;
    name: string;
}

export class AuthService {
    static async login(email: string, password: string) {
        try {
            const response = await api.post("/auth/login", { correo: email, password });

            console.log("Respuesta completa:", response);

            const token = response.data.token || response.data.accessToken || response.data.jwt;

            if (!token) {
                throw new Error("Token no encontrado en la respuesta");
            }

            return {
                accessToken: token,
                expiresIn: response.data.expiresIn || 15 * 60 // 15 minutos por defecto
            };

        } catch (error) {
            console.error("AuthService.login error:", error);
            throw error;
        }
    }

    static validateToken(token: string): {
        isValid: boolean;
        expiresIn?: number;
        isExpired: boolean;
    } {
        if (!token) {
            return { isValid: false, isExpired: true };
        }

        try {
            const payloadBase64 = token.split('.')[1];
            const payload = JSON.parse(atob(payloadBase64));

            if (!payload.exp) {
                return { isValid: true, isExpired: false };
            }

            const expiresAt = payload.exp * 1000;
            const now = Date.now();
            const expiresIn = Math.max(0, Math.floor((expiresAt - now) / 1000));

            return {
                isValid: true,
                expiresIn: expiresIn > 0 ? expiresIn : undefined,
                isExpired: expiresIn <= 0,
            };
        } catch {
            // Si no es JWT o hay error al decodificar, solo validamos existencia
            return { isValid: !!token, isExpired: false };
        }
    }

    static async verifySession(token: string): Promise<{ valid: boolean; user?: User }> {
        const validation = this.validateToken(token);

        if (!validation.isValid || validation.isExpired) {
            return { valid: false };
        }

        try {
            return { valid: true };
        } catch {
            return { valid: false };
        }
    }
}