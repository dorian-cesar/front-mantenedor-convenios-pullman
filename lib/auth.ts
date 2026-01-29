import { cookies } from "next/headers";
import { AuthService } from "@/services/auth.service";

export async function getSession() {
    const token = (await cookies()).get("token")?.value;

    if (!token) return null;

    const validation = AuthService.validateToken(token);

    if (!validation.isValid || validation.isExpired) {
        return null;
    }

    try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

        return {
            id: payload.sub || payload.id,
            email: payload.email,
            name: payload.name,
        };
    } catch {
        // Si no es JWT, retornamos un objeto básico
        return { id: 'unknown', email: 'unknown', name: 'Usuario' };
    }
}

export async function loginAction(email: string, password: string) {
    try {
        const data = await AuthService.login(email, password);

        // Calcular tiempo de expiración
        let maxAge = 60 * 15; // 15 minutos por defecto

        if (data.expiresIn) {
            maxAge = data.expiresIn;
        } else {
            // Intentar extraer del token si es JWT
            const validation = AuthService.validateToken(data.accessToken);
            if (validation.expiresIn) {
                maxAge = validation.expiresIn;
            }
        }

        (await cookies()).set("token", data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge,
        });

        return { ok: true };
    } catch (error: any) {
        return {
            ok: false,
            message: error?.response?.data?.message ?? "Credenciales inválidas",
        };
    }
}