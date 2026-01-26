"use server";

import { cookies } from "next/headers";
import { AuthService } from "@/services/auth.service";

export async function loginAction(email: string, password: string) {
    try {
        const data = await AuthService.login(email, password);

        (await cookies()).set("token", data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 15,
        });

        return { ok: true };
    } catch (error: any) {
        return {
            ok: false,
            message: error?.response?.data?.message ?? "Credenciales inválidas",
        };
    }
}
