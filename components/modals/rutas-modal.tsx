"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import * as Icon from "lucide-react"
import { ConveniosService, type Convenio, type Ruta, type RutaConfiguracion } from "@/services/convenio.service"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface RutasModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    convenio: Convenio
    onSuccess?: () => void
}

export default function RutasModal({ open, onOpenChange, convenio, onSuccess }: RutasModalProps) {
    const [rutas, setRutas] = useState<Ruta[]>(convenio.rutas || [])
    const [cities, setCities] = useState<{ id: string, name: string }[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setRutas(convenio.rutas || [])
            fetchCities()
        }
    }, [open, convenio])

    const fetchCities = async () => {
        try {
            const response = await fetch('https://api.prod.kupos.cl/api/v1/bus-inventory/cities', {
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_KUPOS_API_KEY_PROD || ''
                }
            })
            const data = await response.json()
            if (data.status === 'success') {
                const uniqueCities = Array.from(new Set(data.data.map((c: any) => String(c.name))))
                    .map(name => {
                        const found = data.data.find((c: any) => String(c.name) === name)
                        return {
                            id: String(found.id),
                            name: String(name)
                        }
                    })
                setCities(uniqueCities)
            }
        } catch (error) {
            console.error('Error fetching cities:', error)
        }
    }

    const handleAddRuta = () => {
        setRutas(prev => [...prev, {
            origen_codigo: "",
            origen_ciudad: "",
            destino_codigo: "",
            destino_ciudad: "",
            configuraciones: []
        }])
    }

    const handleRemoveRuta = (index: number) => {
        setRutas(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpdateRuta = (index: number, updates: Partial<Ruta>) => {
        setRutas(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r))
    }

    const handleAddConfig = (rutaIndex: number) => {
        setRutas(prev => prev.map((r, i) => i === rutaIndex ? {
            ...r,
            configuraciones: [...(r.configuraciones || []), {
                tipo_viaje: "SOLO_IDA",
                tipo_asiento: "SEMICAMA",
                precio_solo_ida: 0,
                precio_ida_vuelta: 0,
                max_pasajes: 1
            }]
        } : r))
    }

    const handleUpdateConfig = (rutaIndex: number, configIndex: number, updates: Partial<RutaConfiguracion>) => {
        setRutas(prev => prev.map((r, i) => i === rutaIndex ? {
            ...r,
            configuraciones: r.configuraciones?.map((c, j) => j === configIndex ? { ...c, ...updates } : c)
        } : r))
    }

    const handleRemoveConfig = (rutaIndex: number, configIndex: number) => {
        setRutas(prev => prev.map((r, i) => i === rutaIndex ? {
            ...r,
            configuraciones: r.configuraciones?.filter((_, j) => j !== configIndex)
        } : r))
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const configuracionesGlobal = rutas.flatMap(r => r.configuraciones || []).filter(Boolean)
            const rutasSinConfig = rutas.map(({ configuraciones: _, ...r }) => r)

            await ConveniosService.updateConvenio(convenio.id, {
                tipo_alcance: rutas.length > 0 ? "Rutas Especificas" : "Global",
                rutas: rutas.length > 0 ? rutasSinConfig : null,
                configuraciones: configuracionesGlobal.length > 0 ? configuracionesGlobal : null,
            })

            toast.success("Rutas actualizadas correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating routes:', error)
            toast.error("Error al actualizar rutas")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Gestionar Rutas - {convenio.nombre}</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Agregue o quite rutas específicas para este convenio.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Trayectos ({rutas.length})</h3>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddRuta}>
                            <Icon.PlusIcon className="h-4 w-4 mr-2" />
                            Agregar Ruta
                        </Button>
                    </div>

                    {rutas.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                            <p className="text-gray-500">No hay rutas configuradas. El convenio es Global.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rutas.map((ruta, idx) => (
                                <div key={idx} className="p-4 border rounded-lg space-y-4 relative bg-white shadow-sm">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleRemoveRuta(idx)}
                                    >
                                        <Icon.Trash2Icon className="h-4 w-4" />
                                    </Button>

                                    <div className="grid grid-cols-2 gap-4 mr-8">
                                        <div className="space-y-2">
                                            <Label>Origen</Label>
                                            <Select
                                                value={ruta.origen_ciudad}
                                                onValueChange={(val) => {
                                                    const city = cities.find(c => c.name === val)
                                                    handleUpdateRuta(idx, { origen_ciudad: val, origen_codigo: city?.id || "" })
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Ciudad Origen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Destino</Label>
                                            <Select
                                                value={ruta.destino_ciudad}
                                                onValueChange={(val) => {
                                                    const city = cities.find(c => c.name === val)
                                                    handleUpdateRuta(idx, { destino_ciudad: val, destino_codigo: city?.id || "" })
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Ciudad Destino" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-semibold text-gray-700">Configuraciones de Precio</h4>
                                            <Button type="button" variant="ghost" size="xs" className="h-7 text-xs" onClick={() => handleAddConfig(idx)}>
                                                <Icon.PlusIcon className="h-3 w-3 mr-1" />
                                                Agregar Precio
                                            </Button>
                                        </div>

                                        {ruta.configuraciones?.map((conf, cIdx) => (
                                            <div key={cIdx} className="grid grid-cols-5 gap-2 items-end p-2 rounded bg-gray-50 border border-gray-100 relative group">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-gray-500">Viaje</Label>
                                                    <Select value={conf.tipo_viaje} onValueChange={(val) => handleUpdateConfig(idx, cIdx, { tipo_viaje: val })}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="SOLO_IDA">Ida</SelectItem>
                                                            <SelectItem value="IDA_VUELTA">Ida/Vuelta</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-gray-500">Asiento</Label>
                                                    <Select value={conf.tipo_asiento} onValueChange={(val) => handleUpdateConfig(idx, cIdx, { tipo_asiento: val })}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="CLASICO">Clásico</SelectItem>
                                                            <SelectItem value="SEMICAMA">Semicama</SelectItem>
                                                            <SelectItem value="SALON_CAMA">Salón Cama</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-gray-500">Precio</Label>
                                                    <Input
                                                        type="number"
                                                        value={conf.precio_solo_ida}
                                                        onChange={(e) => handleUpdateConfig(idx, cIdx, { precio_solo_ida: Number(e.target.value) })}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-gray-500">Max</Label>
                                                    <Input
                                                        type="number"
                                                        value={conf.max_pasajes}
                                                        onChange={(e) => handleUpdateConfig(idx, cIdx, { max_pasajes: Number(e.target.value) })}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleRemoveConfig(idx, cIdx)}
                                                >
                                                    <Icon.XIcon className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Dialog.DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Icon.Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </Dialog.DialogFooter>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
