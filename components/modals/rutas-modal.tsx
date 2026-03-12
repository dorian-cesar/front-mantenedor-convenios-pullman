"use client"

import { useState, useEffect, useCallback, memo } from "react"
import * as Dialog from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import * as Icon from "lucide-react"
import { ConveniosService, type Convenio, type Ruta } from "@/services/convenio.service"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface RutasModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    convenio: Convenio
    onSuccess?: () => void
}

// --- Subcomponentes para Clean Code ---

interface RutaItemProps {
    ruta: Ruta
    cities: { id: string, name: string }[]
    onRemove: () => void
    onUpdate: (updates: Partial<Ruta>) => void
}

const RutaItem = memo(({ ruta, cities, onRemove, onUpdate }: RutaItemProps) => {
    return (
        <div className="p-5 border rounded-xl space-y-4 relative bg-white shadow-sm transition-all hover:shadow-md border-gray-200">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                onClick={onRemove}
            >
                <Icon.Trash2Icon className="h-4.5 w-4.5" />
            </Button>

            <div className="grid grid-cols-2 gap-6 mr-10">
                <div className="space-y-2">
                    <Label className="text-gray-600 font-medium">Origen</Label>
                    <Select
                        value={ruta.origen_ciudad}
                        onValueChange={(val) => {
                            const city = cities.find(c => c.name === val)
                            onUpdate({ origen_ciudad: val, origen_codigo: city ? String(city.id) : "" })
                        }}
                    >
                        <SelectTrigger className="bg-gray-50/50">
                            <SelectValue placeholder="Ciudad Origen" />
                        </SelectTrigger>
                        <SelectContent>
                            {[...new Map(cities.map(c => [c.name, c])).values()].map(c => (
                                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-gray-600 font-medium">Destino</Label>
                    <Select
                        value={ruta.destino_ciudad}
                        onValueChange={(val) => {
                            const city = cities.find(c => c.name === val)
                            onUpdate({ destino_ciudad: val, destino_codigo: city ? String(city.id) : "" })
                        }}
                    >
                        <SelectTrigger className="bg-gray-50/50">
                            <SelectValue placeholder="Ciudad Destino" />
                        </SelectTrigger>
                        <SelectContent>
                            {[...new Map(cities.map(c => [c.name, c])).values()].map(c => (
                                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
})
RutaItem.displayName = "RutaItem"

// --- Componente Principal ---

export default function RutasModal({ open, onOpenChange, convenio, onSuccess }: RutasModalProps) {
    const [rutas, setRutas] = useState<Ruta[]>([])
    const [cities, setCities] = useState<{ id: string, name: string }[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchCities = useCallback(async () => {
        try {
            const response = await fetch('/api/cities')
            const data = await response.json()
            if (data.cities) {
                setCities(data.cities)
            }
        } catch (error) {
            console.error('Error fetching cities:', error)
            toast.error("No se pudieron cargar las ciudades")
        }
    }, [])

    useEffect(() => {
        if (open && convenio) {
            setRutas(convenio.rutas || [])
            fetchCities()
        }
    }, [open, convenio, fetchCities])

    const handleAddRuta = () => {
        setRutas(prev => [...prev, {
            origen_codigo: "",
            origen_ciudad: "",
            destino_codigo: "",
            destino_ciudad: "",
            configuraciones: []
        }])
    }

    const handleRemoveRuta = useCallback((index: number) => {
        setRutas(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleUpdateRuta = useCallback((index: number, updates: Partial<Ruta>) => {
        setRutas(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r))
    }, [])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const invalidRutas = rutas.some(r => !r.origen_ciudad || !r.destino_ciudad)
            if (invalidRutas) {
                toast.error("Por favor, completa todas las ciudades en las rutas")
                setIsLoading(false)
                return
            }

            // Mapeamos explícitamente para asegurar que los campos son correctos y evitar "undefined" como string
            const rutasLimpias = rutas.map(r => ({
                origen_codigo: r.origen_codigo ? String(r.origen_codigo) : "",
                origen_ciudad: r.origen_ciudad || "",
                destino_codigo: r.destino_codigo ? String(r.destino_codigo) : "",
                destino_ciudad: r.destino_ciudad || ""
            })).filter(r => r.origen_codigo && r.destino_codigo)

            const normalizeStr = (s: string) => {
                if (!s) return s
                const map: Record<string, string> = {
                    "SOLO_IDA": "Solo Ida", "IDA_VUELTA": "Ida y Vuelta",
                    "SEMICAMA": "Semi Cama", "SALON_CAMA": "Salon Cama",
                    "CAMA_PREMIUM": "Cama", "CAMA": "Cama", "EJECUTIVO": "Ejecutivo",
                    "Solo ida": "Solo Ida", "Semi cama": "Semi Cama", "Salon cama": "Salon Cama"
                }
                return map[s] || map[s.toUpperCase()] || s
            }

            const configsLimpias = (convenio.configuraciones || []).map(c => ({
                ...c,
                tipo_viaje: normalizeStr(c.tipo_viaje),
                tipo_asiento: normalizeStr(c.tipo_asiento)
            }))

            await ConveniosService.updateConvenio(convenio.id, {
                nombre: convenio.nombre,
                status: convenio.status,
                empresa_id: convenio.empresa_id,
                tipo_alcance: rutasLimpias.length > 0 ? "Rutas Especificas" : "Global",
                rutas: rutasLimpias.length > 0 ? rutasLimpias : null,
                configuraciones: configsLimpias.length > 0 ? configsLimpias : null,
                codigo: convenio.codigo || null,
                api_consulta_id: convenio.api_consulta_id,
                tipo_descuento: convenio.tipo_descuento,
                valor_descuento: convenio.valor_descuento,
                tope_monto_descuento: convenio.tope_monto_descuento,
                tope_cantidad_tickets: convenio.tope_cantidad_tickets,
                limitar_por_stock: convenio.limitar_por_stock,
                limitar_por_monto: convenio.limitar_por_monto,
                beneficio: convenio.beneficio,
                imagenes: convenio.imagenes || [],
                fecha_inicio: convenio.fecha_inicio || null,
                fecha_termino: convenio.fecha_termino || null,
            })

            toast.success("Trayectos actualizados correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating routes:', error)
            toast.error("Error al actualizar trayectos")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-gray-50/50">
                <Dialog.DialogHeader className="p-6 border-b bg-white">
                    <Dialog.DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Icon.MapPinIcon className="h-6 w-6 text-primary" />
                        Gestionar Trayectos - {convenio.nombre}
                    </Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Define los orígenes y destinos específicos para este convenio.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-bold text-gray-900">Alcance por Rutas</h3>
                            <p className="text-xs text-gray-400">Selecciona los trayectos habilitados para el descuento</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-8 px-3 flex items-center bg-primary/10 rounded-full">
                                <span className="text-xs font-bold text-primary">{rutas.length} seleccionadas</span>
                            </div>
                            <Button type="button" variant="default" size="sm" className="rounded-full px-4 shadow-sm" onClick={handleAddRuta}>
                                <Icon.PlusIcon className="h-4 w-4 mr-2" />
                                Agregar Trayecto
                            </Button>
                        </div>
                    </div>

                    {rutas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-2xl bg-white border-gray-200">
                            <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Icon.MapIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Sin rutas específicas</h4>
                            <p className="text-xs text-gray-400 text-center max-w-[240px]">
                                El convenio se aplicará de forma Global. Agrega rutas si deseas limitar su alcance.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rutas.map((ruta, idx) => (
                                <RutaItem
                                    key={idx}
                                    ruta={ruta}
                                    cities={cities}
                                    onRemove={() => handleRemoveRuta(idx)}
                                    onUpdate={(updates) => handleUpdateRuta(idx, updates)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <Dialog.DialogFooter className="p-6 border-t bg-white">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">Cancelar</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="rounded-full px-8 shadow-md">
                        {isLoading && <Icon.Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                        Aplicar Trayectos
                    </Button>
                </Dialog.DialogFooter>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
