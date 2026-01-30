"use client";

import { useEffect, useState } from "react";
import { AuthService } from "@/services/auth.service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";

interface SessionTimerProps {
    warningThresholdMinutes?: number;
    onSessionExpiring?: () => void;
}

export function SessionTimer({
    warningThresholdMinutes = 10,
    onSessionExpiring
}: SessionTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const token = AuthService.getToken();
            if (!token) {
                setTimeLeft("");
                setShowWarning(false);
                return;
            }

            const validation = AuthService.validateToken(token);

            if (!validation.expiresIn || validation.isExpired) {
                setTimeLeft("");
                setShowWarning(false);
                return;
            }

            // Formatear tiempo restante
            const minutes = Math.floor(validation.expiresIn / 60);
            const seconds = validation.expiresIn % 60;
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);

            // Mostrar advertencia si queda menos del umbral
            const shouldShowWarning = validation.expiresIn <= warningThresholdMinutes * 60;
            setShowWarning(shouldShowWarning);

            // Notificar si la sesión está por expirar
            if (shouldShowWarning && onSessionExpiring) {
                onSessionExpiring();
            }

            // Forzar logout si el token expiró
            if (validation.isExpired) {
                AuthService.logout();
                window.location.href = '/?session=expired';
            }
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000); // Actualizar cada segundo

        return () => clearInterval(intervalId);
    }, [warningThresholdMinutes, onSessionExpiring]);

    if (!timeLeft) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {showWarning ? (
                <Alert variant="destructive" className="w-80">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>Sesión expira en: {timeLeft}</span>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="text-sm underline hover:no-underline"
                        >
                            Renovar
                        </button>
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 shadow-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        Sesión: {timeLeft}
                    </span>
                </div>
            )}
        </div>
    );
}