"use client"

import { useState, useEffect, useCallback, memo } from "react"
import * as Dialog from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import * as Icon from "lucide-react"
import { type Convenio, type RutaConfiguracion } from "@/services/convenio.service"
import { useConvenio } from "@/components/providers/convenio-provider"
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
                <Label className="text-[10px] uppercase text-gray-400 font-bold">Tipo Viaje</Label>
                <Select value={config.tipo_viaje} onValueChange={(val) => onUpdate({ tipo_viaje: val })}>
                    <SelectTrigger className="h-10 text-xs border-gray-100 bg-gray-50/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Solo Ida">Solo Ida</SelectItem>
                        <SelectItem value="Ida y Vuelta">Ida y Vuelta</SelectItem>
                    </SelectContent>
                </Select>
            </div>
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
                <Label className="text-[10px] uppercase text-gray-400 font-bold">Precio Solo Ida ($)</Label>
                <Input
                    type="number"
                    value={config.precio_solo_ida || ""}
                    placeholder="0"
                    onChange={(e) => onUpdate({ precio_solo_ida: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="h-10 text-xs border-gray-100 bg-gray-50/30"
                />
            </div>
            {config.tipo_viaje === "Ida y Vuelta" && (
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
            )}
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
    const {
        configuraciones,
        setConfiguraciones,
        fetchFullConvenio: fetchFull,
        handleSave: unifiedSave,
        handleUpdateGlobalConfig,
        isSaving: isLoading,
        normalizeStr
    } = useConvenio()
    
    const [currentId, setCurrentId] = useState<number | null>(null)

    const fetchFullConvenio = useCallback(async (id: number) => {
        await fetchFull(id)
    }, [fetchFull])

    useEffect(() => {
        if (open && convenio) {
            if (currentId === convenio.id) return;
            setCurrentId(convenio.id)
            fetchFullConvenio(convenio.id)
        } else if (!open) {
            setCurrentId(null)
        }
    }, [open, convenio, currentId, fetchFullConvenio])

    const handleUpdateConfig = useCallback((index: number, updates: Partial<RutaConfiguracion>) => {
        handleUpdateGlobalConfig(index, updates)
    }, [handleUpdateGlobalConfig])

    const handleSave = async () => {
        // En PreciosModal, enviamos las configuraciones globales actuales (están en el hook)
        const success = await unifiedSave(convenio.id, { configuraciones }, () => {
            onSuccess?.()
            onOpenChange(false)
        })
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
