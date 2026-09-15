"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import * as Card from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfiguracionService } from "@/services/configuracion.service"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

export default function CargosPage() {
    const [tipoCargo, setTipoCargo] = useState<string>("PORCENTAJE")
    const [valorCargo, setValorCargo] = useState<string>("0")
    const [cargoActivo, setCargoActivo] = useState<boolean>(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const { user, initialized: authInitialized } = useAuth()

    const isReadOnlyRole = user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user" || user?.rol?.toUpperCase() === "SISTEMA";

    const fetchConfig = async () => {
        if (!authInitialized) return;
        
        setIsLoading(true)
        try {
            const config = await ConfiguracionService.getParametros()
            setTipoCargo(config.CARGO_SERVICIO_TIPO || "PORCENTAJE")
            setValorCargo(config.CARGO_SERVICIO_VALOR || "0")
            setCargoActivo(config.CARGO_SERVICIO_ACTIVO !== "false")
        } catch (error) {
            console.error('Error fetching config:', error)
            toast.error("No se pudo cargar la configuración")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchConfig()
    }, [authInitialized])

    const handleSave = async () => {
        if (!valorCargo || isNaN(Number(valorCargo))) {
            toast.error("El valor del cargo debe ser un número válido")
            return
        }

        setIsSaving(true)
        try {
            await ConfiguracionService.updateParametros({
                CARGO_SERVICIO_TIPO: tipoCargo as "PORCENTAJE" | "FIJO",
                CARGO_SERVICIO_VALOR: valorCargo,
                CARGO_SERVICIO_ACTIVO: cargoActivo ? "true" : "false"
            })
            toast.success("Configuración de Cargo guardada correctamente")
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error("Error al guardar la configuración")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8">
            <PageHeader 
                title="Cargos por Servicio" 
                description="Configura el cargo por servicio que se aplicará en las compras del portal."
            />
            
            <Card.Card className="max-w-2xl">
                <Card.CardHeader>
                    <Card.CardTitle>Configuración Global</Card.CardTitle>
                    <Card.CardDescription>
                        Este cargo se aplicará a todas las compras realizadas a través del portal. 
                        Puedes configurar si es un porcentaje del total base, o un monto fijo por asiento.
                    </Card.CardDescription>
                </Card.CardHeader>
                <Card.CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="h-40 flex items-center justify-center">Cargando...</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="activar-cargo" className="text-base">Activar Cargo por Servicio</Label>
                                    <p className="text-sm text-muted-foreground">Si está desactivado, no se cobrará ningún cargo extra en el portal.</p>
                                </div>
                                <Switch 
                                    id="activar-cargo"
                                    checked={cargoActivo}
                                    onCheckedChange={setCargoActivo}
                                    disabled={isReadOnlyRole}
                                />
                            </div>

                            <div className={`space-y-4 ${!cargoActivo ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="grid gap-2">
                                <Label htmlFor="tipo-cargo">Tipo de Cargo</Label>
                                <Select 
                                    value={tipoCargo} 
                                    onValueChange={setTipoCargo}
                                    disabled={isReadOnlyRole}
                                >
                                    <SelectTrigger id="tipo-cargo" className="w-full">
                                        <SelectValue placeholder="Selecciona el tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PORCENTAJE">Porcentaje (%)</SelectItem>
                                        <SelectItem value="FIJO">Monto Fijo ($)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="valor-cargo">
                                    Valor del Cargo {tipoCargo === 'PORCENTAJE' ? '(%)' : '($)'}
                                </Label>
                                <Input 
                                    id="valor-cargo" 
                                    type="number"
                                    min="0"
                                    step={tipoCargo === 'PORCENTAJE' ? '0.1' : '1'}
                                    value={valorCargo}
                                    onChange={(e) => setValorCargo(e.target.value)}
                                    placeholder={tipoCargo === 'PORCENTAJE' ? 'Ej: 10' : 'Ej: 1500'}
                                    disabled={isReadOnlyRole}
                                />
                            </div>
                            </div>
                        </div>
                    )}
                </Card.CardContent>
                <Card.CardFooter>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || isLoading || isReadOnlyRole}
                    >
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </Card.CardFooter>
            </Card.Card>
        </div>
    )
}
