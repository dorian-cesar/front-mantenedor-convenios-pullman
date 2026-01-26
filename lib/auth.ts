import { cookies } from "next/headers";
import { AuthService } from "@/services/auth.service";

export async function getSession() {
    const token = (await cookies()).get("token")?.value;

    if (!token) return null;

    try {
        const user = await AuthService.me(token);
        return user;
    } catch {
        return null;
    }
}
