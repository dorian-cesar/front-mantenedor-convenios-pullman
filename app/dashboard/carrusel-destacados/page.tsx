"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as Card from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"
import { ConfiguracionService } from "@/services/configuracion.service"
import { ConveniosService, Convenio } from "@/services/convenio.service"
import { Save, Plus, Edit, Trash2, ArrowUpDown } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Image from "next/image"
import { ManageDestacadoModal } from "@/components/modals/manage-destacado"

export default function CarruselDestacadosPage() {
    const [limiteDestacados, setLimiteDestacados] = useState("4")
    const [isSavingLimit, setIsSavingLimit] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [destacados, setDestacados] = useState<Convenio[]>([])
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            // 1. Fetch limit config
            const config = await ConfiguracionService.getParametro('LIMITE_DESTACADOS')
            if (config && config.valor) {
                setLimiteDestacados(config.valor)
            }
            
            // 2. Fetch destacados
            const res = await ConveniosService.getConvenios({ limit: 100 }) // Adjust limit if needed
            // We can filter locally or use a specific endpoint if one exists
            // Since we added an endpoint for public /api/convenios/destacados in backend, 
            // but we can just filter all active ones locally or fetch them all
            const filtered = res.rows.filter(c => c.is_destacado)
            filtered.sort((a, b) => (a.orden_destacado || 0) - (b.orden_destacado || 0))
            setDestacados(filtered)
        } catch (error) {
            console.error("Error cargando configuración", error)
            toast.error("Error al cargar los datos")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSaveLimit = async () => {
        if (!limiteDestacados || isNaN(Number(limiteDestacados))) {
            toast.error("Por favor ingrese un número válido")
            return
        }

        setIsSavingLimit(true)
        try {
            await ConfiguracionService.setParametro('LIMITE_DESTACADOS', limiteDestacados)
            toast.success("Límite guardado exitosamente")
        } catch (error) {
            toast.error("Error al guardar la configuración")
            console.error(error)
        } finally {
            setIsSavingLimit(false)
        }
    }

    const handleRemoveDestacado = async (convenio: Convenio) => {
        if (!confirm(`¿Está seguro de quitar a "${convenio.nombre}" del carrusel?`)) return
        
        try {
            const formData = ConveniosService.mapConvenioToUpdateData(convenio)
            formData.is_destacado = false
            await ConveniosService.updateConvenio(convenio.id, formData)
            toast.success("Convenio removido del carrusel")
            fetchData()
        } catch (error) {
            console.error("Error al remover destacado:", error)
            toast.error("Hubo un error al remover del carrusel")
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader 
                title="Carrusel de Destacados" 
                description="Administra los convenios y el layout que se muestran en el carrusel de la portada."
            />

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card.Card>
                    <Card.CardHeader>
                        <Card.CardTitle>Límite del Carrusel</Card.CardTitle>
                        <Card.CardDescription>
                            Tarjetas visibles a la vez en pantalla
                        </Card.CardDescription>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <Field>
                            <Input 
                                type="number" 
                                min="1"
                                max="10"
                                value={limiteDestacados} 
                                onChange={(e) => setLimiteDestacados(e.target.value)} 
                                placeholder="Ej: 4"
                            />
                        </Field>
                    </Card.CardContent>
                    <Card.CardFooter>
                        <Button 
                            onClick={handleSaveLimit} 
                            disabled={isSavingLimit}
                            className="w-full"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSavingLimit ? "Guardando..." : "Guardar Límite"}
                        </Button>
                    </Card.CardFooter>
                </Card.Card>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Convenios Destacados Activos</h3>
                    <Button onClick={() => { setSelectedConvenio(null); setIsModalOpen(true) }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir al Carrusel
                    </Button>
                </div>
                
                <Card.Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Orden</TableHead>
                                <TableHead>Logo</TableHead>
                                <TableHead>Convenio</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Cargando datos...
                                    </TableCell>
                                </TableRow>
                            ) : destacados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No hay convenios destacados configurados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                destacados.map((convenio) => (
                                    <TableRow key={convenio.id}>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                                                {convenio.orden_destacado || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {convenio.logo_destacado ? (
                                                <div className="relative h-10 w-24 rounded overflow-hidden bg-white border">
                                                    <Image 
                                                        src={convenio.logo_destacado.startsWith('http') ? convenio.logo_destacado : `${process.env.NEXT_PUBLIC_API_URL}${convenio.logo_destacado}`}
                                                        alt={convenio.nombre}
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-24 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                                    Sin Logo
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{convenio.nombre}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {convenio.descripcion_destacado || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="icon"
                                                    onClick={() => { setSelectedConvenio(convenio); setIsModalOpen(true) }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="destructive" 
                                                    size="icon"
                                                    onClick={() => handleRemoveDestacado(convenio)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card.Card>
            </div>

            {isModalOpen && (
                <ManageDestacadoModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedConvenio(null)
                    }}
                    convenioToEdit={selectedConvenio}
                    onSuccess={fetchData}
                />
            )}
        </div>
    )
}
