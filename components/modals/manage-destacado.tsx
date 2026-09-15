"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ImagePlus, X, Loader2 } from "lucide-react"
import { ConveniosService, Convenio } from "@/services/convenio.service"
import { toast } from "sonner"
import Image from "next/image"

const manageDestacadoSchema = z.object({
    convenio_id: z.string().min(1, "Debe seleccionar un convenio"),
    descripcion_destacado: z.string().optional(),
    orden_destacado: z.coerce.number().int(),
})

type ManageDestacadoValues = z.infer<typeof manageDestacadoSchema>

interface ManageDestacadoModalProps {
    isOpen: boolean
    onClose: () => void
    convenioToEdit: Convenio | null
    onSuccess: () => void
}

export function ManageDestacadoModal({ isOpen, onClose, convenioToEdit, onSuccess }: ManageDestacadoModalProps) {
    const [allConvenios, setAllConvenios] = useState<Convenio[]>([])
    const [isLoadingConvenios, setIsLoadingConvenios] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [selectedLogo, setSelectedLogo] = useState<File | null>(null)

    const form = useForm<ManageDestacadoValues>({
        resolver: zodResolver(manageDestacadoSchema) as any,
        defaultValues: {
            convenio_id: convenioToEdit ? String(convenioToEdit.id) : "",
            descripcion_destacado: convenioToEdit?.descripcion_destacado || "",
            orden_destacado: convenioToEdit?.orden_destacado || 0,
        },
    })

    useEffect(() => {
        const loadConvenios = async () => {
            setIsLoadingConvenios(true)
            try {
                const response = await ConveniosService.getConvenios({ limit: 100, status: "ACTIVO" })
                // Si es añadir nuevo, mostramos los que no están destacados
                if (!convenioToEdit) {
                    setAllConvenios(response.rows.filter(c => !c.is_destacado))
                } else {
                    setAllConvenios(response.rows)
                }
            } catch (error) {
                console.error("Error al cargar convenios:", error)
                toast.error("No se pudieron cargar los convenios")
            } finally {
                setIsLoadingConvenios(false)
            }
        }

        if (isOpen) {
            loadConvenios()
            
            if (convenioToEdit) {
                form.reset({
                    convenio_id: String(convenioToEdit.id),
                    descripcion_destacado: convenioToEdit.descripcion_destacado || "",
                    orden_destacado: convenioToEdit.orden_destacado || 0,
                })
                
                if (convenioToEdit.logo_destacado) {
                    const logoUrl = convenioToEdit.logo_destacado.startsWith('http') 
                        ? convenioToEdit.logo_destacado 
                        : `${process.env.NEXT_PUBLIC_API_URL}${convenioToEdit.logo_destacado}`
                    setLogoPreview(logoUrl)
                } else {
                    setLogoPreview(null)
                }
            } else {
                form.reset({
                    convenio_id: "",
                    descripcion_destacado: "",
                    orden_destacado: 0,
                })
                setLogoPreview(null)
                setSelectedLogo(null)
            }
        }
    }, [isOpen, convenioToEdit, form])

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("La imagen no debe superar los 5MB")
                return
            }
            setSelectedLogo(file)
            setLogoPreview(URL.createObjectURL(file))
        }
    }

    const onSubmit = async (values: ManageDestacadoValues) => {
        if (!convenioToEdit && !selectedLogo) {
            toast.error("Debe subir un logo para destacar el convenio")
            return
        }

        setIsSubmitting(true)
        try {
            const fullConvenio = allConvenios.find(c => String(c.id) === values.convenio_id)
            if (!fullConvenio) {
                throw new Error("Convenio no encontrado")
            }

            const formData = ConveniosService.mapConvenioToUpdateData(fullConvenio)
            formData.is_destacado = true
            formData.descripcion_destacado = values.descripcion_destacado
            formData.orden_destacado = values.orden_destacado
            
            if (selectedLogo) {
                formData.logo_destacado = selectedLogo
            }

            await ConveniosService.updateConvenio(fullConvenio.id, formData)
            
            toast.success(convenioToEdit ? "Convenio destacado actualizado" : "Convenio añadido al carrusel")
            onSuccess()
            onClose()
        } catch (error) {
            console.error("Error saving destacado:", error)
            toast.error("Ocurrió un error al guardar")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{convenioToEdit ? "Editar Convenio en Carrusel" : "Añadir Convenio al Carrusel"}</DialogTitle>
                    <DialogDescription>
                        Configura la información visual del convenio para la portada.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        
                        <FormField
                            control={form.control}
                            name="convenio_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Seleccionar Convenio</FormLabel>
                                    <Select 
                                        disabled={!!convenioToEdit || isLoadingConvenios}
                                        onValueChange={field.onChange} 
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isLoadingConvenios ? "Cargando..." : "Seleccione un convenio activo..."} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {allConvenios.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.nombre}
                                                </SelectItem>
                                            ))}
                                            {allConvenios.length === 0 && !isLoadingConvenios && (
                                                <SelectItem value="none" disabled>No hay convenios disponibles</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                            <div>
                                <FormLabel className="flex justify-between">
                                    Logo Promocional (Destacado)
                                    <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormDescription className="mt-1.5 mb-4">
                                    Este logo se usará exclusivamente en la tarjeta del carrusel.
                                </FormDescription>
                                
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-center w-full">
                                            <label htmlFor="logo-destacado-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-bray-800 border-muted-foreground/25">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <ImagePlus className="w-8 h-8 mb-3 text-muted-foreground" />
                                                    <p className="mb-2 text-sm text-muted-foreground">
                                                        <span className="font-semibold">Click para subir</span> o arrastrar
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">SVG, PNG, JPG (MAX. 5MB)</p>
                                                </div>
                                                <input 
                                                    id="logo-destacado-upload" 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {(logoPreview) && (
                                        <div className="relative w-32 h-32 rounded-lg border bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
                                            <div className="relative w-full h-full">
                                                <Image 
                                                    src={logoPreview} 
                                                    alt="Preview" 
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => {
                                                    setLogoPreview(null)
                                                    setSelectedLogo(null)
                                                    // Note: We don't remove existing backend logo immediately, only when saved
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="descripcion_destacado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción Promocional Corta</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Ej: 20% de descuento en pasajes..." 
                                                className="resize-none h-20"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormDescription>Se mostrará debajo del logo en el carrusel.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="orden_destacado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Orden de aparición</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormDescription>Los números menores aparecen primero (Ej: 1, 2, 3).</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting || isLoadingConvenios}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
