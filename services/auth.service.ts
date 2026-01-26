import { api } from "@/lib/api";

export const AuthService = {
    login: async (email: string, password: string) => {
        const { data } = await api.post("/auth/login", {
            email,
            password,
        });

        return data;
    },

    me: async (token: string) => {
        const { data } = await api.get("/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return data;
    },
};
