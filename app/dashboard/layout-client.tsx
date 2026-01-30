"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SessionTimer } from "@/components/auth/SessionTimer";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/ui/loading-screen";
import { AuthService } from "@/services/auth.service";

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, user, isTokenExpiringSoon, logout, checkToken } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [initialCheckDone, setInitialCheckDone] = useState(false);

    useEffect(() => {
        checkToken();
        setInitialCheckDone(true);
    }, [checkToken]); 

    useEffect(() => {
        console.log("Estado de autenticación:", {
            isAuthenticated,
            user,
            initialCheckDone
        });

        if (!initialCheckDone) return;

        if (!isAuthenticated) {
            console.log("Redirigiendo a login. Token:", AuthService.getToken());
            router.push("/");
        } else {
            console.log("Usuario autenticado:", user);
            setLoading(false);
        }
    }, [isAuthenticated, router, initialCheckDone]);

    if (loading) {
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