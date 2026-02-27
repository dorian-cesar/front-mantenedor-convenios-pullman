"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SessionTimer } from "@/components/auth/SessionTimer";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/ui/loading-screen";

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, user, isTokenExpiringSoon, logout, initialized } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!initialized) return;

        if (!isAuthenticated) {
            console.log("No autenticado, redirigiendo...");
            router.replace("/");
        } else {
            console.log("Usuario autenticado:", user);
            setLoading(false);
        }
    }, [isAuthenticated, initialized, router, user]);

    if (!initialized || loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return null;
    }

    const handleSessionExpiring = () => {
        console.warn("¡La sesión está por expirar! Guarde su trabajo.");
    };

    return (
        <>
            <DashboardLayout user={user} onLogout={logout}>
                {children}
            </DashboardLayout>

            {isTokenExpiringSoon && (
                <SessionTimer
                    warningThresholdMinutes={10}
                    onSessionExpiring={handleSessionExpiring}
                />
            )}
        </>
    );
}