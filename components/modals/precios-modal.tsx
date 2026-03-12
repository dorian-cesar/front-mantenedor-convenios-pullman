"use client"

import { useState, useEffect, useCallback, memo } from "react"
import * as Dialog from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import * as Icon from "lucide-react"
import { ConveniosService, type Convenio, type RutaConfiguracion, type Ruta, type TipoDescuento } from "@/services/convenio.service"
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
    showRemove = false,
    onRemove
}: {
    config: RutaConfiguracion,
    onUpdate: (updates: Partial<RutaConfiguracion>) => void,
    showRemove?: boolean,
    onRemove?: () => void
}) => {
    return (
        <div className="grid grid-cols-4 gap-3 items-end p-4 rounded-xl bg-white border border-gray-100 shadow-sm relative group transition-all hover:border-primary/20">
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
            {showRemove && onRemove && (
                <div className="flex justify-end pb-0.5 col-span-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        onClick={onRemove}
                    >
                        <Icon.Trash2Icon className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    )
})
ConfigPrecioItem.displayName = "ConfigPrecioItem"

export default function PreciosModal({ open, onOpenChange, convenio, onSuccess }: PreciosModalProps) {
    const [configuraciones, setConfiguraciones] = useState<RutaConfiguracion[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && convenio) {
            // Lógica de MERGE para mostrar una sola fila consolidada
            const rawConfigs = convenio.configuraciones || []

            if (rawConfigs.length === 0) {
                setConfiguraciones([{
                    tipo_viaje: "Solo Ida",
                    tipo_asiento: "Semi Cama",
                    precio_solo_ida: 0,
                    precio_ida_vuelta: 0,
                    max_pasajes: 1
                }])
            } else {
                // Consolidamos todas en una si el usuario quiere "una sola"
                // O tomamos la primera y mezclamos valores si hay varias (fallback seguro)
                const consolidated: RutaConfiguracion = {
                    tipo_viaje: "Solo Ida",
                    tipo_asiento: rawConfigs[0].tipo_asiento || "Semi Cama",
                    precio_solo_ida: rawConfigs.find(c => c.tipo_viaje === "Solo Ida")?.precio_solo_ida || 0,
                    precio_ida_vuelta: rawConfigs.find(c => c.tipo_viaje === "Ida y Vuelta")?.precio_ida_vuelta || 0,
                    max_pasajes: rawConfigs[0].max_pasajes || 1
                }
                setConfiguraciones([consolidated])
            }
        }
    }, [open, convenio])

    const handleUpdateConfig = useCallback((index: number, updates: Partial<RutaConfiguracion>) => {
        setConfiguraciones(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c))
    }, [])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const finalConfigs = configuraciones.slice(0, 1).map(c => ({
                tipo_viaje: c.tipo_viaje || "Solo Ida",
                tipo_asiento: c.tipo_asiento || "Semi Cama",
                precio_solo_ida: c.precio_solo_ida !== null && c.precio_solo_ida !== undefined ? Number(c.precio_solo_ida) : undefined,
                precio_ida_vuelta: c.precio_ida_vuelta !== null && c.precio_ida_vuelta !== undefined ? Number(c.precio_ida_vuelta) : undefined,
                max_pasajes: c.max_pasajes !== null && c.max_pasajes !== undefined ? Number(c.max_pasajes) : undefined
            }))

            // Payload optimizado siguiendo el esquema del backend
            const empresaId = typeof convenio.empresa === 'object' && convenio.empresa !== null
                ? convenio.empresa.id
                : (typeof convenio.empresa_id === 'number' ? convenio.empresa_id : null);

            await ConveniosService.updateConvenio(convenio.id, {
                nombre: convenio.nombre,
                status: convenio.status,
                empresa_id: empresaId,
                tipo_alcance: convenio.tipo_alcance || "Global",
                configuraciones: finalConfigs,
                rutas: convenio.rutas || [],
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

            toast.success("Precios actualizados correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating prices:', error)
            toast.error("Error al actualizar precios. Verifique los datos.")
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
                            <h3 className="text-sm font-bold text-gray-900">Tarifa Única</h3>
                            <p className="text-xs text-gray-400">Configura los precios base para este convenio</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {configuraciones.map((config, idx) => (
                            <ConfigPrecioItem
                                key={idx}
                                config={config}
                                onUpdate={(updates) => handleUpdateConfig(idx, updates)}
                                showRemove={false}
                            />
                        ))}
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
