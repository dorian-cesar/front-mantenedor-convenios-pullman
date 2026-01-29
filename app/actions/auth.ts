"use server";

import { cookies } from "next/headers";
import { AuthService } from "@/services/auth.service";
import { redirect } from "next/navigation";

export async function loginAction(email: string, password: string) {
    try {
        const data = await AuthService.login(email, password);

        // Verifica la estructura de la respuesta
        console.log("Respuesta del login:", data);
        
        // Asegúrate de que el token esté en la propiedad correcta
        const token = data.accessToken;
        
        if (!token) {
            throw new Error("No se recibió token del servidor");
        }

        // Calcula maxAge (15 minutos por defecto o usa expiresIn si está disponible)
        let maxAge = 60 * 15; // 15 minutos por defecto
        
        if (data.expiresIn) {
            maxAge = data.expiresIn;
        } else {
            // Intenta extraer del token si es JWT
            const validation = AuthService.validateToken(token);
            if (validation.expiresIn) {
                maxAge = validation.expiresIn;
            }
        }

        // Guarda en cookie del servidor
        (await cookies()).set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge,
        });

        return { ok: true, token };
    } catch (error: any) {
        console.error("Error en loginAction:", error);
        return {
            ok: false,
            message: error?.response?.data?.message 
                   || error?.message 
                   || "Credenciales inválidas",
        };
    }
}

export async function logoutAction() {
    (await cookies()).delete("token");
    redirect("/");
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

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
        return { id: 'unknown', email: 'unknown', name: 'Usuario' };
    }
}