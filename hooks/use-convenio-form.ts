"use client"

import { useState, useCallback } from "react"
import { ConveniosService, type Convenio, type Ruta, type RutaConfiguracion, normalizeStr } from "@/services/convenio.service"
import { toast } from "sonner"

export function useConvenioForm() {
    const [rutas, setRutas] = useState<Ruta[]>([])
    const [configuraciones, setConfiguraciones] = useState<RutaConfiguracion[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchFullConvenio = useCallback(async (id: number) => {
        setIsLoading(true)
        // Reset state to avoid leaks from previous convenio
        setRutas([])
        setConfiguraciones([])
        try {
            const full = await ConveniosService.getConvenioById(id)
            console.log(">>> DATA FROM GET (Full Convenio):", JSON.stringify(full, null, 2));

            // Normalize global configurations - Enforce SINGLE configuration to avoid duplication
            let rawRootConfigs = full.configuraciones;
            if (rawRootConfigs && !Array.isArray(rawRootConfigs)) {
                rawRootConfigs = [rawRootConfigs];
            } else if (!rawRootConfigs || (Array.isArray(rawRootConfigs) && rawRootConfigs.length === 0)) {
                // FALLBACK: maybe it's flattened at root?
                if (full.tipo_viaje || full.precio_solo_ida || full.valor_ida) {
                    rawRootConfigs = [{
                        tipo_viaje: full.tipo_viaje || "",
                        tipo_asiento: full.tipo_asiento || "",
                        precio_solo_ida: full.precio_solo_ida ?? full.valor_ida,
                        precio_ida_vuelta: full.precio_ida_vuelta ?? full.valor_ida_vuelta,
                        max_pasajes: full.max_pasajes
                    }];
                } else {
                    rawRootConfigs = [];
                }
            }

            const normalizedRootConfigs = (rawRootConfigs as any[]).map(c => ({
                ...c,
                tipo_viaje: normalizeStr(c.tipo_viaje),
                tipo_asiento: normalizeStr(c.tipo_asiento),
                precio_solo_ida: c.precio_solo_ida ?? c.valor_ida ?? 0,
                precio_ida_vuelta: c.precio_ida_vuelta ?? c.valor_ida_vuelta ?? 0,
            }))
            setConfiguraciones(normalizedRootConfigs)

            // Process and rescue routes
            const processedRutas = (Array.isArray(full.rutas) ? full.rutas : []).map(r => {
                let configs = r.configuraciones;
                if (configs && !Array.isArray(configs)) {
                    configs = [configs];
                } else if (!configs || (Array.isArray(configs) && configs.length === 0)) {
                    // FALLBACK: maybe it's flattened at route level?
                    if (r.tipo_viaje || r.precio_solo_ida || r.valor_ida) {
                        configs = [{
                            tipo_viaje: r.tipo_viaje || "",
                            tipo_asiento: r.tipo_asiento || "",
                            precio_solo_ida: r.precio_solo_ida ?? r.valor_ida,
                            precio_ida_vuelta: r.precio_ida_vuelta ?? r.valor_ida_vuelta,
                            max_pasajes: r.max_pasajes
                        }];
                    } else {
                        configs = [];
                    }
                }

                // Normalize existing route configs
                const normalizedConfigs = (configs as any[]).map(c => ({
                    ...c,
                    tipo_viaje: normalizeStr(c.tipo_viaje || ""),
                    tipo_asiento: normalizeStr(c.tipo_asiento || ""),
                    precio_solo_ida: c.precio_solo_ida ?? c.valor_ida ?? 0,
                    precio_ida_vuelta: c.precio_ida_vuelta ?? c.valor_ida_vuelta ?? 0,
                    max_pasajes: c.max_pasajes ?? 1
                }))

                return { ...r, configuraciones: normalizedConfigs }
            })

            setRutas(processedRutas)
            return full
        } catch (error) {
            console.error('Error fetching full convenio data:', error)
            toast.error("No se pudieron cargar los detalles completos")
            return null
        } finally {
            setIsLoading(false)
        }
    }, [])

    const handleAddRuta = useCallback(() => {
        // Use global configs as a base for new routes - Clone ONLY the first one to be safe
        const initialConfigs = configuraciones.length > 0 ? [configuraciones[0]] : []

        setRutas(prev => [...prev, {
            origen_codigo: "",
            origen_ciudad: "",
            destino_codigo: "",
            destino_ciudad: "",
            configuraciones: initialConfigs
        }])
    }, [configuraciones])

    const handleUpdateRuta = useCallback((index: number, updates: Partial<Ruta>) => {
        setRutas(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r))
    }, [])

    const handleRemoveRuta = useCallback((index: number) => {
        setRutas(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleAddConfigToRuta = useCallback((rutaIndex: number) => {
        const defaultConfig = { tipo_viaje: "Solo Ida", tipo_asiento: "Semi Cama", precio_solo_ida: 0, precio_ida_vuelta: 0, max_pasajes: 1 }

        setRutas(prev => {
            const newRutas = [...prev]
            // Restrict to ONE configuration per route
            newRutas[rutaIndex].configuraciones = [defaultConfig]
            return newRutas
        })
    }, [])

    const handleUpdateGlobalConfig = useCallback((index: number, updates: Partial<RutaConfiguracion>) => {
        setConfiguraciones(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c));
    }, []);

    const handleUpdateRutaConfig = useCallback(
        (rutaIndex: number, configIndex: number, config: RutaConfiguracion) => {

            const cleanedConfig =
                config.tipo_viaje === "Solo Ida"
                    ? (({ precio_ida_vuelta, ...rest }) => rest)(config)
                    : config;

            setRutas(prev =>
                prev.map((r, i) => {
                    if (i !== rutaIndex) return r;

                    const newConfigs = Array.isArray(r.configuraciones)
                        ? [...r.configuraciones]
                        : [];

                    newConfigs[configIndex] = cleanedConfig;

                    return { ...r, configuraciones: newConfigs };
                })
            );
        },
        []
    );

    const handleRemoveRutaConfig = useCallback((rutaIndex: number, configIndex: number) => {
        setRutas(prev => prev.map((r, i) => {
            if (i !== rutaIndex) return r;
            const newConfigs = (Array.isArray(r.configuraciones) ? r.configuraciones : []).filter((_, ci) => ci !== configIndex);
            return { ...r, configuraciones: newConfigs };
        }));
    }, []);

    const [isSaving, setIsSaving] = useState(false)

    const handleSave = useCallback(async (convenioId: number, data?: Partial<any>, onSuccess?: () => void) => {
        setIsSaving(true)
        try {
            // Recoger data base si se provee, o usar lo que hay en el hook
            // Esta es la "Estrategia de los 3 puntos" centralizada
            const full = await ConveniosService.getConvenioById(convenioId)
            const basePayload = ConveniosService.mapConvenioToUpdateData(full)

            const isRutasEspecificas = (data?.tipo_alcance !== undefined ? data.tipo_alcance : basePayload.tipo_alcance) === "Rutas Especificas";

            // CLEANUP LOGIC FOR VALIDATION
            const mapRootConfig = (c: any) => {
                const { valor_ida, ...rest } = c; // Explicitly remove valor_ida
                return {
                    ...rest,
                    tipo_viaje: normalizeStr(c.tipo_viaje),
                    tipo_asiento: normalizeStr(c.tipo_asiento),
                    precio_solo_ida: c.precio_solo_ida ? Number(c.precio_solo_ida) : 0,
                    precio_ida_vuelta: c.precio_ida_vuelta ? Number(c.precio_ida_vuelta) : 0,
                    max_pasajes: c.max_pasajes ? Number(c.max_pasajes) : 1
                };
            };

            const mapRouteConfig = (c: any) => ({
                tipo_viaje: c.tipo_viaje,
                tipo_asiento: c.tipo_asiento,
                precio_solo_ida: c.precio_solo_ida ? Number(c.precio_solo_ida) : 0,
                precio_ida_vuelta: c.precio_ida_vuelta ? Number(c.precio_ida_vuelta) : 0,
                max_pasajes: c.max_pasajes ? Number(c.max_pasajes) : 1
            });

            // Root configurations (Global) use an ARRAY - Mirror-POST strategy
            let rawConfigs = (data?.configuraciones || configuraciones || [])
            if (!Array.isArray(rawConfigs)) rawConfigs = rawConfigs ? [rawConfigs] : []

            const finalConfigs: any[] = rawConfigs.map((c: any) => {
                const { id, convenio_id, valor_ida, ...rest } = c;
                const tipoViaje = normalizeStr(c.tipo_viaje);
                const baseConfig = {
                    ...rest,
                    tipo_viaje: tipoViaje,
                    tipo_asiento: normalizeStr(c.tipo_asiento),
                    precio_solo_ida: c.precio_solo_ida ? Number(c.precio_solo_ida) : 0,
                    max_pasajes: c.max_pasajes ? Number(c.max_pasajes) : 1
                };
                if (tipoViaje !== "Solo Ida") {
                    return {
                        ...baseConfig,
                        precio_ida_vuelta: c.precio_ida_vuelta ? Number(c.precio_ida_vuelta) : 0
                    };
                }
                return baseConfig;
            });

            const cleanRutas = (Array.isArray(rutas) ? rutas : []).map((ruta: any) => {
                const { configuraciones: routeConfigs } = ruta;

                // Nesting configurations back into an array as per updated backend schema
                // Conditionally include precio_ida_vuelta only if "Ida y Vuelta"
                const nestedConfigs = (Array.isArray(routeConfigs) ? routeConfigs : []).map(c => {
                    const tipoViaje = c.tipo_viaje;
                    const baseConf: any = {
                        tipo_viaje: tipoViaje,
                        tipo_asiento: c.tipo_asiento,
                        precio_solo_ida: c.precio_solo_ida ? Number(c.precio_solo_ida) : 0,
                        max_pasajes: c.max_pasajes ? Number(c.max_pasajes) : 1
                    };
                    // Only include precio_ida_vuelta for "Ida y Vuelta"
                    if (tipoViaje !== "Solo Ida") {
                        baseConf.precio_ida_vuelta = c.precio_ida_vuelta ? Number(c.precio_ida_vuelta) : 0;
                    }
                    return baseConf;
                });

                return {
                    origen_codigo: String(ruta.origen_codigo),
                    destino_codigo: String(ruta.destino_codigo),
                    origen_ciudad: ruta.origen_ciudad,
                    destino_ciudad: ruta.destino_ciudad,
                    configuraciones: nestedConfigs
                };
            });

            // Build final payload - spread ORDER matters: cleanRutas and configuraciones MUST win over ...data
            const finalPayload: any = {
                ...basePayload,
                ...data,
                // These MUST override anything from ...basePayload or ...data
                status: data?.status || basePayload.status || "ACTIVO",
                empresa_id: data?.empresa_id !== undefined ? data.empresa_id : basePayload.empresa_id,
                porcentaje_descuento: data?.porcentaje_descuento !== undefined ? Number(data.porcentaje_descuento) : (basePayload.porcentaje_descuento || 0),
                api_consulta_id: data?.api_consulta_id || basePayload.api_consulta_id || (basePayload as any).api_url_id,
                rutas: isRutasEspecificas ? cleanRutas : [],
                configuraciones: isRutasEspecificas ? [] : finalConfigs,
            }

            // --- STRICT CLEANUP FOR UPDATE (PUT) ---
            // Backend is extremely sensitive to extra fields during PUT
            delete (finalPayload as any).api_url_id;
            delete (finalPayload as any).id;
            delete (finalPayload as any).tipo_consulta;
            delete (finalPayload as any).endpoint;
            // NOTE: status is kept - backend needs it
            delete (finalPayload as any).createdAt;
            delete (finalPayload as any).updatedAt;
            delete (finalPayload as any).empresa;
            delete (finalPayload as any).beneficio_nombre;
            delete (finalPayload as any).beneficio_endpoint_registro;
            delete (finalPayload as any).beneficio_endpoint_validacion;
            delete (finalPayload as any).consumo_tickets;
            delete (finalPayload as any).consumo_monto_descuento;
            delete (finalPayload as any).valor_ida;
            delete (finalPayload as any).valor_ida_vuelta;

            // These were explicitly rejected in the latest logs
            delete (finalPayload as any).tope_cantidad_tickets;
            delete (finalPayload as any).tope_monto_descuento;

            // Arreglo estricto de fechas a ISO-8601 UTC
            const ensureUTC = (dateStr: string, isEnd = false) => {
                if (!dateStr) return null;
                if (dateStr.includes('T')) return dateStr.split('.')[0] + 'Z';
                return `${dateStr}T${isEnd ? '23:59:59' : '00:00:00'}Z`;
            };

            if (finalPayload.fecha_inicio) {
                finalPayload.fecha_inicio = ensureUTC(finalPayload.fecha_inicio);
            }
            if (finalPayload.fecha_termino) {
                finalPayload.fecha_termino = ensureUTC(finalPayload.fecha_termino, true);
            }

            // Pruning final de campos null/empty/array-vacio que el back rechaza
            Object.keys(finalPayload).forEach(key => {
                const value = (finalPayload as any)[key];
                if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
                    delete (finalPayload as any)[key];
                }
            });

            await ConveniosService.updateConvenio(convenioId, finalPayload)

            setConfiguraciones(finalConfigs)
            setRutas(cleanRutas)

            toast.success("Convenio actualizado correctamente")
            onSuccess?.()
            return true
        } catch (error: any) {
            if (error.response) {
                console.error("Error al guardar convenio:", error.response.data);
            }
            toast.error("No se pudo guardar los cambios")
            return false
        } finally {
            setIsSaving(false)
        }
    }, [rutas, configuraciones])

    return {
        rutas,
        setRutas,
        configuraciones,
        setConfiguraciones,
        isLoading,
        isSaving,
        fetchFullConvenio,
        handleSave,
        handleAddRuta,
        handleUpdateRuta,
        handleRemoveRuta,
        handleAddConfigToRuta,
        handleUpdateRutaConfig,
        handleRemoveRutaConfig,
        handleUpdateGlobalConfig,
        normalizeStr
    }
}
