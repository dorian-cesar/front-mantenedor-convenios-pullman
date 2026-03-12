import { useState, useCallback } from "react"
import { ConveniosService, type Convenio, type Ruta, type RutaConfiguracion, normalizeStr } from "@/services/convenio.service"
import { toast } from "sonner"

export function useConvenioForm() {
    const [rutas, setRutas] = useState<Ruta[]>([])
    const [configuraciones, setConfiguraciones] = useState<RutaConfiguracion[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchFullConvenio = useCallback(async (id: number) => {
        setIsLoading(true)
        try {
            const full = await ConveniosService.getConvenioById(id)

            // Normalize global configurations
            const normalizedRootConfigs = (full.configuraciones || []).map(c => ({
                ...c,
                tipo_viaje: normalizeStr(c.tipo_viaje),
                tipo_asiento: normalizeStr(c.tipo_asiento)
            }))
            setConfiguraciones(normalizedRootConfigs)

            // Process and rescue routes
            const processedRutas = (full.rutas || []).map(r => {
                let configs = r.configuraciones || []

                // Rescue logic: If route has no config but convenio has root configs
                if (configs.length === 0 && normalizedRootConfigs.length > 0) {
                    configs = normalizedRootConfigs
                } else {
                    // Normalize existing route configs
                    configs = configs.map(c => ({
                        ...c,
                        tipo_viaje: normalizeStr(c.tipo_viaje),
                        tipo_asiento: normalizeStr(c.tipo_asiento)
                    }))
                }

                return { ...r, configuraciones: configs }
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
        // Use global configs as a base for new routes
        const initialConfigs = configuraciones.length > 0 ? configuraciones : []

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
        const defaultConfig = configuraciones.length > 0
            ? configuraciones[0]
            : { tipo_viaje: "Solo Ida", tipo_asiento: "Semi Cama", precio_solo_ida: 0, precio_ida_vuelta: 0, max_pasajes: 1 }

        setRutas(prev => {
            const newRutas = [...prev]
            newRutas[rutaIndex].configuraciones = [
                ...(newRutas[rutaIndex].configuraciones || []),
                defaultConfig
            ]
            return newRutas
        })
    }, [configuraciones])

    const handleUpdateRutaConfig = useCallback((rutaIndex: number, configIndex: number, config: RutaConfiguracion) => {
        setRutas(prev => {
            const newRutas = [...prev]
            if (newRutas[rutaIndex].configuraciones) {
                const configs = [...newRutas[rutaIndex].configuraciones!]
                configs[configIndex] = config
                newRutas[rutaIndex].configuraciones = configs
            }
            return newRutas
        })
    }, [])

    const handleRemoveRutaConfig = useCallback((rutaIndex: number, configIndex: number) => {
        setRutas(prev => {
            const newRutas = [...prev]
            if (newRutas[rutaIndex].configuraciones) {
                newRutas[rutaIndex].configuraciones = newRutas[rutaIndex].configuraciones!.filter((_, i) => i !== configIndex)
            }
            return newRutas
        })
    }, [])

    const [isSaving, setIsSaving] = useState(false)

    const handleSave = useCallback(async (convenioId: number, data?: Partial<any>, onSuccess?: () => void) => {
        setIsSaving(true)
        try {
            // Recoger data base si se provee, o usar lo que hay en el hook
            // Esta es la "Estrategia de los 3 puntos" centralizada
            const full = await ConveniosService.getConvenioById(convenioId)
            const basePayload = ConveniosService.mapConvenioToUpdateData(full)

            const cleanRutas = (rutas || []).map((ruta: any) => {
                const r = { ...ruta }
                delete r.configuraciones
                return r
            })
            // Normalize global configs from hook state, but prefer configs passed in `data` if they exist (e.g. from Main Edit Modal)
            const rawConfigs = data?.configuraciones || configuraciones || []
            const globalConfigs = rawConfigs.map((c: any) => ({
                ...c,
                tipo_viaje: normalizeStr(c.tipo_viaje),
                tipo_asiento: normalizeStr(c.tipo_asiento),
                precio_solo_ida: c.precio_solo_ida ? Number(c.precio_solo_ida) : 0,
                precio_ida_vuelta: c.precio_ida_vuelta ? Number(c.precio_ida_vuelta) : 0,
                max_pasajes: c.max_pasajes ? Number(c.max_pasajes) : 1
            }))

            const finalPayload = {
                ...basePayload,
                ...data, // Sobrescribir con data específica si viene (ej. del Form)
                empresa_id: data?.empresa_id !== undefined ? data.empresa_id : basePayload.empresa_id,
                rutas: cleanRutas,
                configuraciones: globalConfigs.slice(0, 1),
            }

            // Eliminar campos prohibidos por el backend en el update
            delete (finalPayload as any).id;
            delete (finalPayload as any).tipo_consulta;

            // Arreglo estricto de fechas a ISO-8601
            if (finalPayload.fecha_inicio === "") {
                delete finalPayload.fecha_inicio;
            } else if (finalPayload.fecha_inicio && typeof finalPayload.fecha_inicio === 'string') {
                if (!finalPayload.fecha_inicio.includes('T')) {
                    finalPayload.fecha_inicio = new Date(`${finalPayload.fecha_inicio}T00:00:00`).toISOString();
                }
            }

            if (finalPayload.fecha_termino === "") {
                delete finalPayload.fecha_termino;
            } else if (finalPayload.fecha_termino && typeof finalPayload.fecha_termino === 'string') {
                if (!finalPayload.fecha_termino.includes('T')) {
                    finalPayload.fecha_termino = new Date(`${finalPayload.fecha_termino}T23:59:59`).toISOString();
                }
            }

            // Pruning final de campos null que el back a veces rechaza con "is not allowed"
            Object.keys(finalPayload).forEach(key => {
                if ((finalPayload as any)[key] === null) {
                    delete (finalPayload as any)[key];
                }
            });

            await ConveniosService.updateConvenio(convenioId, finalPayload)
            toast.success("Convenio actualizado correctamente")
            onSuccess?.()
            return true
        } catch (error) {
            console.error("Error unificado al guardar:", error)
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
        normalizeStr
    }
}
