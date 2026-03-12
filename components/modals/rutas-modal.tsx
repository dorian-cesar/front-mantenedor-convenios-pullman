"use client"

import { useState, useEffect, useCallback, memo } from "react"
import * as Dialog from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import * as Icon from "lucide-react"
import { ConveniosService, type Convenio, type Ruta, type TipoDescuento, type RutaConfiguracion } from "@/services/convenio.service"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mr-10">
                <div className="space-y-2">
                    <Label className="text-gray-600 font-medium text-xs">Origen</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full h-10 text-sm justify-between px-3 bg-gray-50/50", !ruta.origen_ciudad && "text-muted-foreground")}
                            >
                                {ruta.origen_ciudad || "Seleccionar origen"}
                                <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Buscar ciudad..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No se encontraron ciudades.</CommandEmpty>
                                    <CommandGroup>
                                        {cities.map((city) => (
                                            <CommandItem
                                                key={city.id}
                                                value={city.name}
                                                onSelect={() => {
                                                    onUpdate({ origen_ciudad: city.name, origen_codigo: String(city.id) })
                                                }}
                                            >
                                                <Icon.CheckIcon className={cn("mr-2 h-4 w-4", ruta.origen_ciudad === city.name ? "opacity-100" : "opacity-0")} />
                                                {city.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label className="text-gray-600 font-medium text-xs">Destino</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full h-10 text-sm justify-between px-3 bg-gray-50/50", !ruta.destino_ciudad && "text-muted-foreground")}
                            >
                                {ruta.destino_ciudad || "Seleccionar destino"}
                                <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Buscar ciudad..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No se encontraron ciudades.</CommandEmpty>
                                    <CommandGroup>
                                        {cities.filter(c => c.name !== ruta.origen_ciudad).map((city) => (
                                            <CommandItem
                                                key={city.id}
                                                value={city.name}
                                                onSelect={() => {
                                                    onUpdate({ destino_ciudad: city.name, destino_codigo: String(city.id) })
                                                }}
                                            >
                                                <Icon.CheckIcon className={cn("mr-2 h-4 w-4", ruta.destino_ciudad === city.name ? "opacity-100" : "opacity-0")} />
                                                {city.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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

            const normalizeStr = (s: string | undefined) => {
                if (!s) return ""
                const map: Record<string, string> = {
                    "SOLO_IDA": "Solo Ida", "IDA_VUELTA": "Ida y Vuelta",
                    "SEMICAMA": "Semi Cama", "SALON_CAMA": "Salon Cama",
                    "CAMA_PREMIUM": "Cama", "CAMA": "Cama", "EJECUTIVO": "Ejecutivo",
                    "Solo ida": "Solo Ida", "Semi cama": "Semi Cama", "Salon cama": "Salon Cama",
                    "Ida y vuelta": "Ida y Vuelta"
                }
                const upperS = s.toUpperCase().replace(/\s+/g, '_')
                return map[upperS] || map[s] || s
            }

            const cleanConfigs = (configs?: any[]) => {
                if (!configs) return []
                return configs.slice(0, 1).map(c => ({
                    tipo_viaje: normalizeStr(c.tipo_viaje),
                    tipo_asiento: normalizeStr(c.tipo_asiento),
                    precio_solo_ida: c.precio_solo_ida !== null && c.precio_solo_ida !== undefined ? Number(c.precio_solo_ida) : undefined,
                    precio_ida_vuelta: c.precio_ida_vuelta !== null && c.precio_ida_vuelta !== undefined ? Number(c.precio_ida_vuelta) : undefined,
                    max_pasajes: c.max_pasajes !== null && c.max_pasajes !== undefined ? Number(c.max_pasajes) : undefined
                }))
            }

            const rutasLimpias = rutas.map(r => ({
                origen_codigo: r.origen_codigo ? String(r.origen_codigo) : "",
                origen_ciudad: r.origen_ciudad || "",
                destino_codigo: r.destino_codigo ? String(r.destino_codigo) : "",
                destino_ciudad: r.destino_ciudad || "",
                configuraciones: cleanConfigs(r.configuraciones)
            })).filter(r => r.origen_codigo && r.destino_codigo)

            const configsGlobalesLimpias = cleanConfigs(convenio.configuraciones)

            const empresaId = typeof convenio.empresa === 'object' && convenio.empresa !== null
                ? convenio.empresa.id
                : (typeof convenio.empresa_id === 'number' ? convenio.empresa_id : null);

            await ConveniosService.updateConvenio(convenio.id, {
                nombre: convenio.nombre,
                status: convenio.status,
                empresa_id: empresaId,
                tipo_alcance: rutasLimpias.length > 0 ? "Rutas Especificas" : "Global",
                rutas: rutasLimpias,
                configuraciones: configsGlobalesLimpias.length > 0 ? configsGlobalesLimpias : [],
                codigo: convenio.codigo || null,
                api_consulta_id: convenio.api_consulta_id || null,
                tipo_descuento: (convenio.tipo_descuento as TipoDescuento) || null,
                valor_descuento: convenio.valor_descuento !== null && convenio.valor_descuento !== undefined ? Number(convenio.valor_descuento) : null,
                tope_monto_descuento: convenio.tope_monto_descuento !== null && convenio.tope_monto_descuento !== undefined ? Number(convenio.tope_monto_descuento) : null,
                tope_cantidad_tickets: convenio.tope_cantidad_tickets !== null && convenio.tope_cantidad_tickets !== undefined ? Number(convenio.tope_cantidad_tickets) : null,
                limitar_por_stock: convenio.limitar_por_stock ?? null,
                limitar_por_monto: convenio.limitar_por_monto ?? null,
                beneficio: !!convenio.beneficio,
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
