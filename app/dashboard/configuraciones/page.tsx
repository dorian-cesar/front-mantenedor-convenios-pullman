"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as Card from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"
import { ConfiguracionService } from "@/services/configuracion.service"
import { Save } from "lucide-react"

export default function ConfiguracionesPage() {
    const [limiteDestacados, setLimiteDestacados] = useState("4")
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await ConfiguracionService.getParametro('LIMITE_DESTACADOS')
                if (config && config.valor) {
                    setLimiteDestacados(config.valor)
                }
            } catch (error) {
                console.error("Error cargando configuración", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleSave = async () => {
        if (!limiteDestacados || isNaN(Number(limiteDestacados))) {
            toast.error("Por favor ingrese un número válido")
            return
        }

        setIsSaving(true)
        try {
            await ConfiguracionService.setParametro('LIMITE_DESTACADOS', limiteDestacados)
            toast.success("Configuración guardada exitosamente")
        } catch (error) {
            toast.error("Error al guardar la configuración")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="p-8">Cargando configuración...</div>
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader 
                title="Configuraciones Generales" 
                description="Administra los parámetros globales del portal de venta de convenios."
            />

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card.Card>
                    <Card.CardHeader>
                        <Card.CardTitle>Convenios Destacados</Card.CardTitle>
                        <Card.CardDescription>
                            Configura cómo se muestran las tarjetas en la portada
                        </Card.CardDescription>
                    </Card.CardHeader>
                    <Card.CardContent className="space-y-4">
                        <Field>
                            <FieldLabel>Límite de tarjetas visibles a la vez</FieldLabel>
                            <Input 
                                type="number" 
                                min="1"
                                max="10"
                                value={limiteDestacados} 
                                onChange={(e) => setLimiteDestacados(e.target.value)} 
                                placeholder="Ej: 4"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Si marcas más convenios como destacados que este límite, se mostrarán en un carrusel giratorio.
                            </p>
                        </Field>
                    </Card.CardContent>
                    <Card.CardFooter>
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="w-full"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </Card.CardFooter>
                </Card.Card>
            </div>
        </div>
    )
}
