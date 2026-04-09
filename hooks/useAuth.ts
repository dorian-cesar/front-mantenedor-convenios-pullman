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
        console.log("🛠️ [AUTH DEBUG] Token validation user:", validation.user);

        if (validation.isValid && !validation.isExpired) {
            setIsAuthenticated(true);
            
            // Combinar datos del usuario del localStorage con los del Token Payload por seguridad
            const syncedUser = {
                ...currentUser,
                ...(validation.user || {})
            };
            
            setUser(syncedUser);
            setExpiresIn(validation.expiresIn || null);

            const isExpiringSoon = validation.expiresIn
                ? validation.expiresIn <= expirationThresholdMinutes * 60
                : false;
            setIsTokenExpiringSoon(isExpiringSoon);

            if (isExpiringSoon) {
                console.warn(`Token expira en ${validation.expiresIn} segundos`);
            }
        } else {
            const isDashboard = window.location.pathname.startsWith('/dashboard');
            if (isDashboard) {
                AuthService.logout();
                setIsAuthenticated(false);
                setUser(null);
                setExpiresIn(null);
                setIsTokenExpiringSoon(true);
            }
        }

        setInitialized(true);
    }, [expirationThresholdMinutes]);

    // EFECTO DE ENRIQUECIMIENTO: Si el rol es USUARIO pero no tiene empresa_id, ir a buscarlo
    useEffect(() => {
        const enrichUser = async () => {
            if (!initialized || !isAuthenticated || !user?.id) return;

            const hasId = !!(user?.empresa_id || user?.empresaId || user?.id_empresa || user?.empresa?.id);
            const isUser = user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user";

            if (isUser && !hasId) {
                try {
                    // INTENTO 1: Perfil de Usuario (El más seguro)
                    console.log("🔍 [AUTH] Intentando enriquecimiento vía Admin Profile UID:", user.id);
                    const { UsuariosService } = await import('@/services/usuario.service');
                    const fullUser = await UsuariosService.getUsuarioById(user.id);
                    
                    if (fullUser && fullUser.empresa_id) {
                        setUser((prev: any) => ({ ...prev, ...fullUser }));
                        console.log("✅ [AUTH] Sesión enriquecida exitosamente vía Perfil.");
                        return;
                    }
                } catch (error: any) {
                    console.warn("⚠️ [AUTH] No se pudo obtener perfil. Intentando descubrimiento limitado...");
                    try {
                        // INTENTO 2: Descubrimiento limitado (Asegurando que no sobrescribimos si ya apareció el ID)
                        const { ConveniosService } = await import('@/services/convenio.service');
                        const conveniosRes = await ConveniosService.getConvenios({ limit: 1 });
                        
                        if (conveniosRes.rows?.[0]?.empresa_id) {
                            const foundId = conveniosRes.rows[0].empresa_id;
                            setUser((prev: any) => {
                                // Doble chequeo: no sobrescribir si ya tiene ID
                                if (prev?.empresa_id || prev?.id_empresa) return prev;
                                return { ...prev, empresa_id: foundId };
                            });
                            console.log("✅ [AUTH] ID descubierto vía Convenios:", foundId);
                        }
                    } catch (fallbackError) {
                        console.error("❌ [AUTH] Error en cadena de descubrimiento:", fallbackError);
                    }
                }
            }
        };

        enrichUser();
    }, [user?.id, user?.rol, isAuthenticated, initialized]);

    useEffect(() => {
        checkToken();

        const intervalId = setInterval(checkToken, 30000);

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