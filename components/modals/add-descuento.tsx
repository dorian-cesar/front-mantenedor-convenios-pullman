import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { DescuentosService } from "@/services/descuento.service"
import type { Convenio } from "@/services/convenio.service"

interface AddDescuentoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    convenios: Convenio[]
}

export default function AddDescuentoModal({ open, onOpenChange, onSuccess, convenios }: AddDescuentoModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        convenio_id: 0,
        codigo_descuento_id: 0,
        tipo_pasajero_id: 1, // Default
        pasajero_id: 0,
        porcentaje_descuento: 10,
        status: "ACTIVO" as "ACTIVO" | "INACTIVO"
    })

    // Simular opciones de tipos de pasajero (deberías obtener esto de la API)
    const tiposPasajero = [
        { id: 1, nombre: "ESTUDIANTE" },
        { id: 2, nombre: "ADULTO" },
        { id: 3, nombre: "ADULTO_MAYOR" }
    ]

    // Simular códigos de descuento (deberías obtener esto de la API)
    const codigosDescuento = [
        { id: 1, codigo: "DESC2024" },
        { id: 2, codigo: "DESC2025" },
        { id: 3, codigo: "DESC2026" }
    ]

    // Simular pasajeros (deberías obtener esto de la API)
    const pasajeros = [
        { id: 1, rut: "11111111-1", nombres: "Juan", apellidos: "Pérez" },
        { id: 2, rut: "22222222-2", nombres: "María", apellidos: "González" },
        { id: 3, rut: "33333333-3", nombres: "Carlos", apellidos: "Rodríguez" }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validaciones básicas
        if (formData.convenio_id === 0) {
            toast.error("Seleccione un convenio")
            return
        }
        
        if (formData.pasajero_id === 0) {
            toast.error("Seleccione un pasajero")
            return
        }

        setIsLoading(true)

        try {
            await DescuentosService.createDescuento(formData)
            toast.success("Descuento creado correctamente")
            onSuccess?.()
            onOpenChange(false)
            setFormData({
                convenio_id: 0,
                codigo_descuento_id: 0,
                tipo_pasajero_id: 1,
                pasajero_id: 0,
                porcentaje_descuento: 10,
                status: "ACTIVO"
            })
        } catch (error) {
            console.error('Error creating descuento:', error)
            toast.error("Error al crear el descuento")
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Nuevo Descuento</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Complete los datos para crear un nuevo descuento.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="convenio_id">Convenio *</Label>
                            <Select
                                value={formData.convenio_id.toString()}
                                onValueChange={(value) => handleChange("convenio_id", Number(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar convenio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {convenios.map((convenio) => (
                                        <SelectItem key={convenio.id} value={convenio.id.toString()}>
                                            {convenio.nombre} {convenio.empresa ? `(${convenio.empresa.nombre})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pasajero_id">Pasajero *</Label>
                            <Select
                                value={formData.pasajero_id.toString()}
                                onValueChange={(value) => handleChange("pasajero_id", Number(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar pasajero" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pasajeros.map((pasajero) => (
                                        <SelectItem key={pasajero.id} value={pasajero.id.toString()}>
                                            {pasajero.nombres} {pasajero.apellidos} ({pasajero.rut})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="codigo_descuento_id">Código de Descuento *</Label>
                            <Select
                                value={formData.codigo_descuento_id.toString()}
                                onValueChange={(value) => handleChange("codigo_descuento_id", Number(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar código" />
                                </SelectTrigger>
                                <SelectContent>
                                    {codigosDescuento.map((codigo) => (
                                        <SelectItem key={codigo.id} value={codigo.id.toString()}>
                                            {codigo.codigo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tipo_pasajero_id">Tipo de Pasajero</Label>
                            <Select
                                value={formData.tipo_pasajero_id.toString()}
                                onValueChange={(value) => handleChange("tipo_pasajero_id", Number(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposPasajero.map((tipo) => (
                                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                            {tipo.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="porcentaje_descuento">Porcentaje de Descuento *</Label>
                            <Input
                                id="porcentaje_descuento"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.porcentaje_descuento}
                                onChange={(e) => handleChange("porcentaje_descuento", Number(e.target.value))}
                                placeholder="Ej: 15"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: "ACTIVO" | "INACTIVO") => handleChange("status", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVO">Activo</SelectItem>
                                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Dialog.DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creando..." : "Crear Descuento"}
                        </Button>
                    </Dialog.DialogFooter>
                </form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}