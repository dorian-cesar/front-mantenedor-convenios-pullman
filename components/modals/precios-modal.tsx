"use client"

import { useState, useEffect, useCallback, memo } from "react"
import * as Dialog from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import * as Icon from "lucide-react"
import { ConveniosService, type Convenio, type RutaConfiguracion } from "@/services/convenio.service"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface PreciosModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    convenio: Convenio
    onSuccess?: () => void
}

const ConfigPrecioItem = memo(({
    config,
    onUpdate,
    onRemove
}: {
    config: RutaConfiguracion,
    onUpdate: (updates: Partial<RutaConfiguracion>) => void,
    onRemove: () => void
}) => {
    return (
        <div className="grid grid-cols-5 gap-3 items-end p-4 rounded-xl bg-white border border-gray-100 shadow-sm relative group transition-all hover:border-primary/20">
            <div className="space-y-1">
                <Label className="text-[10px] uppercase text-gray-400 font-bold">Tipo Asiento</Label>
                <Select value={config.tipo_asiento} onValueChange={(val) => onUpdate({ tipo_asiento: val })}>
                    <SelectTrigger className="h-10 text-xs border-gray-100 bg-gray-50/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Semi Cama">Semi Cama</SelectItem>
                        <SelectItem value="Cama">Cama</SelectItem>
                        <SelectItem value="Salon Cama">Salón Cama</SelectItem>
                        <SelectItem value="Ejecutivo">Ejecutivo</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label className="text-[10px] uppercase text-gray-400 font-bold">Precio Ida ($)</Label>
                <Input
                    type="number"
                    value={config.precio_solo_ida || ""}
                    placeholder="0"
                    onChange={(e) => onUpdate({ precio_solo_ida: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="h-10 text-xs border-gray-100 bg-gray-50/30"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-[10px] uppercase text-gray-400 font-bold">Precio Ida/Vta ($)</Label>
                <Input
                    type="number"
                    value={config.precio_ida_vuelta || ""}
                    placeholder="0"
                    onChange={(e) => onUpdate({ precio_ida_vuelta: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="h-10 text-xs border-gray-100 bg-gray-50/30"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-[10px] uppercase text-gray-400 font-bold">Stock Máx</Label>
                <Input
                    type="number"
                    value={config.max_pasajes || ""}
                    placeholder="0"
                    onChange={(e) => onUpdate({ max_pasajes: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="h-10 text-xs border-gray-100 bg-gray-50/30"
                />
            </div>
            <div className="flex justify-end pb-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    onClick={onRemove}
                >
                    <Icon.Trash2Icon className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
})
ConfigPrecioItem.displayName = "ConfigPrecioItem"

export default function PreciosModal({ open, onOpenChange, convenio, onSuccess }: PreciosModalProps) {
    const [configuraciones, setConfiguraciones] = useState<RutaConfiguracion[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && convenio) {
            // Lógica de MERGE: Agrupamos las configuraciones por tipo_asiento y max_pasajes
            const rawConfigs = convenio.configuraciones || []
            const mergedMap = new Map<string, RutaConfiguracion>()

            rawConfigs.forEach(conf => {
                const key = `${conf.tipo_asiento}-${conf.max_pasajes}`
                if (mergedMap.has(key)) {
                    const existing = mergedMap.get(key)!
                    mergedMap.set(key, {
                        ...existing,
                        precio_solo_ida: conf.precio_solo_ida || existing.precio_solo_ida,
                        precio_ida_vuelta: conf.precio_ida_vuelta || existing.precio_ida_vuelta,
                    })
                } else {
                    mergedMap.set(key, { ...conf })
                }
            })

            setConfiguraciones(Array.from(mergedMap.values()))
        }
    }, [open, convenio])

    const handleAddConfig = () => {
        setConfiguraciones(prev => [...prev, {
            tipo_viaje: "Solo Ida",
            tipo_asiento: "Semi Cama",
            precio_solo_ida: 0,
            precio_ida_vuelta: 0,
            max_pasajes: 1
        }])
    }

    const handleUpdateConfig = useCallback((index: number, updates: Partial<RutaConfiguracion>) => {
        setConfiguraciones(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c))
    }, [])

    const handleRemoveConfig = useCallback((index: number) => {
        setConfiguraciones(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            // Lógica de SPLIT: Separamos cada fila en dos objetos si tiene ambos precios
            const finalConfigs: RutaConfiguracion[] = []

            configuraciones.forEach(c => {
                if (c.precio_solo_ida !== undefined && c.precio_solo_ida !== null && Number(c.precio_solo_ida) >= 0) {
                    finalConfigs.push({
                        tipo_viaje: "Solo Ida",
                        tipo_asiento: c.tipo_asiento,
                        precio_solo_ida: Number(c.precio_solo_ida),
                        max_pasajes: Number(c.max_pasajes) || 1
                    })
                }
                if (c.precio_ida_vuelta !== undefined && c.precio_ida_vuelta !== null && Number(c.precio_ida_vuelta) >= 0) {
                    finalConfigs.push({
                        tipo_viaje: "Ida y Vuelta",
                        tipo_asiento: c.tipo_asiento,
                        precio_ida_vuelta: Number(c.precio_ida_vuelta),
                        max_pasajes: Number(c.max_pasajes) || 1
                    })
                }
            })

            // Payload completo y seguro para evitar 400
            await ConveniosService.updateConvenio(convenio.id, {
                nombre: convenio.nombre,
                status: convenio.status,
                empresa_id: convenio.empresa_id || null,
                configuraciones: finalConfigs.length > 0 ? finalConfigs : null,
                rutas: (convenio.rutas && convenio.rutas.length > 0) ? convenio.rutas : null,
                tipo_alcance: convenio.tipo_alcance || "Global",
                // Campos base con defaults seguros
                codigo: convenio.codigo || null,
                tipo_descuento: convenio.tipo_descuento || null,
                valor_descuento: convenio.valor_descuento ?? null,
                api_consulta_id: convenio.api_consulta_id || null,
                fecha_inicio: convenio.fecha_inicio || null,
                fecha_termino: convenio.fecha_termino || null,
                limitar_por_stock: convenio.limitar_por_stock ?? null,
                limitar_por_monto: convenio.limitar_por_monto ?? null,
                tope_cantidad_tickets: convenio.tope_cantidad_tickets || null,
                tope_monto_descuento: convenio.tope_monto_descuento || null,
                beneficio: !!convenio.beneficio,
                imagenes: convenio.imagenes || [],
            })

            toast.success("Precios actualizados correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating prices:', error)
            toast.error("Error al actualizar precios")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-gray-50/50">
                <Dialog.DialogHeader className="p-6 border-b bg-white">
                    <Dialog.DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Icon.BadgeDollarSign className="h-6 w-6 text-primary" />
                        Configuración de Precios - {convenio.nombre}
                    </Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Define las tarifas globales que se aplicarán a este convenio.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-bold text-gray-900">Tarifas del Convenio</h3>
                            <p className="text-xs text-gray-400">Agrega reglas de precio por tipo de viaje y asiento</p>
                        </div>
                        <Button type="button" variant="default" size="sm" className="rounded-full px-4 shadow-sm" onClick={handleAddConfig}>
                            <Icon.PlusIcon className="h-4 w-4 mr-2" />
                            Nuevo Precio
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {configuraciones.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl bg-white border-gray-200">
                                <Icon.DollarSign className="h-10 w-10 text-gray-200 mb-2" />
                                <p className="text-sm text-gray-400">No hay precios configurados aún.</p>
                            </div>
                        ) : (
                            configuraciones.map((config, idx) => (
                                <ConfigPrecioItem
                                    key={idx}
                                    config={config}
                                    onUpdate={(updates) => handleUpdateConfig(idx, updates)}
                                    onRemove={() => handleRemoveConfig(idx)}
                                />
                            ))
                        )}
                    </div>
                </div>

                <Dialog.DialogFooter className="p-6 border-t bg-white">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">Cancelar</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="rounded-full px-8 shadow-md">
                        {isLoading && <Icon.Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Precios
                    </Button>
                </Dialog.DialogFooter>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
