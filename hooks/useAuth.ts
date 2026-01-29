"use client";

import { useEffect, useState } from "react";
import { AuthService } from "@/services/auth.service";

export function useTokenValidation() {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        const checkToken = () => {
            let token = "";

            if (typeof window !== "undefined") {
                token = localStorage.getItem("token") || "";
            }

            const validation = AuthService.validateToken(token);

            if (validation.expiresIn) {
                setTimeLeft(validation.expiresIn);

                if (validation.expiresIn <= 300) {
                    console.warn(`Token expira en ${validation.expiresIn} segundos`);
                }
            } else {
                setTimeLeft(null);
            }
        };

        checkToken();

        const interval = setInterval(checkToken, 60000);

        return () => clearInterval(interval);
    }, []);

    return { timeLeft };
}