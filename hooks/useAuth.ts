import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '@/services/auth.service';

interface UseAuthReturn {
    isAuthenticated: boolean;
    user: any | null;
    expiresIn: number | null;
    isTokenExpiringSoon: boolean;
    logout: () => void;
    checkToken: () => void;
    initialized: boolean;
}

export function useAuth(expirationThresholdMinutes: number = 10): UseAuthReturn {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<any | null>(null);
    const [expiresIn, setExpiresIn] = useState<number | null>(null);
    const [isTokenExpiringSoon, setIsTokenExpiringSoon] = useState<boolean>(false);
    const [initialized, setInitialized] = useState<boolean>(false);

    const checkToken = useCallback(() => {
        const token = AuthService.getToken();
        const currentUser = AuthService.getCurrentUser();

        if (!token) {
            setIsAuthenticated(false);
            setUser(null);
            setExpiresIn(null);
            setIsTokenExpiringSoon(true);
            setInitialized(true);
            return;
        }

        const validation = AuthService.validateToken(token);

        if (validation.isValid && !validation.isExpired) {
            setIsAuthenticated(true);
            setUser(currentUser);
            setExpiresIn(validation.expiresIn || null);
            setIsTokenExpiringSoon(AuthService.isTokenExpiringSoon(expirationThresholdMinutes));

            if (validation.expiresIn && validation.expiresIn <= expirationThresholdMinutes * 60) {
                console.warn(`Token expira en ${validation.expiresIn} segundos`);
            }
        } else {
            // Token inválido o expirado
            AuthService.logout();
            setIsAuthenticated(false);
            setUser(null);
            setExpiresIn(null);
            setIsTokenExpiringSoon(true);
        }
        
        setInitialized(true);
    }, [expirationThresholdMinutes]);

    useEffect(() => {
        checkToken();

        const intervalId = setInterval(checkToken, 60000);

        return () => clearInterval(intervalId);
    }, [checkToken]);

    const logout = () => {
        AuthService.logout();
        setIsAuthenticated(false);
        setUser(null);
        setExpiresIn(null);
        setIsTokenExpiringSoon(true);
        window.location.href = '/';
    };

    return {
        isAuthenticated,
        user,
        expiresIn,
        isTokenExpiringSoon,
        logout,
        checkToken,
        initialized
    };
}