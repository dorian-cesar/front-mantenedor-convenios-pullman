"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { EstudiantesService, type Estudiante } from "@/services/estudiante.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { toast } from "sonner"
import { fileToBase64, formatRut, getFileSrc, isPDF, rotateImage } from "@/utils/helpers"
import { UploadIcon, RotateCwIcon, XIcon, FileTextIcon, Loader2Icon, PencilIcon } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface UpdateEstudianteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    estudiante: Estudiante | null
    onSuccess?: () => void
}

const updateSchema = () => z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    rut: z.string().min(1, "El RUT es requerido"),
    telefono: z.string().min(1, "El teléfono es requerido"),
    correo: z.string().email("Correo electrónico inválido"),
    direccion: z.string().min(1, "La dirección es requerida"),
    status: z.enum(["ACTIVO", "INACTIVO", "RECHAZADO"]),
    imagenes: z.any().optional(),
})

type EstudianteFormValues = z.infer<ReturnType<typeof updateSchema>>

export default function UpdateEstudianteModal({
    open,
    onOpenChange,
    estudiante,
    onSuccess,
}: UpdateEstudianteModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null)
    const [previews, setPreviews] = useState<Record<string, { src: string; isPDF: boolean }>>({})
    const [loadingConvenio, setLoadingConvenio] = useState(false)

    const form = useForm<EstudianteFormValues>({
        resolver: zodResolver(updateSchema()),
        defaultValues: {
            nombre: "",
            rut: "",
            telefono: "",
            correo: "",
            direccion: "",
            status: "ACTIVO",
            imagenes: {},
        },
    })

    const fetchConvenioData = async (convenioId: number) => {
        setLoadingConvenio(true)
        try {
            const convenio = await ConveniosService.getConvenioById(convenioId)
            setSelectedConvenio(convenio)
        } catch (error) {
            console.error("Error fetching convenio:", error)
        } finally {
            setLoadingConvenio(false)
        }
    }

    useEffect(() => {
        if (estudiante && open) {
            form.reset({
                nombre: estudiante.nombre || "",
                rut: estudiante.rut || "",
                telefono: estudiante.telefono || "",
                correo: estudiante.correo || "",
                direccion: estudiante.direccion || "",
                status: estudiante.status,
                imagenes: estudiante.imagenes || {},
            })

            const initialPreviews: Record<string, { src: string; isPDF: boolean }> = {}
            if (estudiante.imagenes) {
                Object.entries(estudiante.imagenes).forEach(([key, value]) => {
                    if (value) {
                        initialPreviews[key] = {
                            src: value as string,
                            isPDF: isPDF(value as string)
                        }
                    }
                })
            }
            setPreviews(initialPreviews)

            if (estudiante.convenio_id) {
                fetchConvenioData(estudiante.convenio_id)
            }
        }
    }, [estudiante, open, form])

    const handleFileChange = async (file: File, label: string) => {
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            toast.error(`El archivo "${label}" supera los 5MB.`)
            return
        }

        try {
            const base64 = await fileToBase64(file)
            const current = form.getValues("imagenes") || {}
            form.setValue("imagenes", { ...current, [label]: base64 })
            
            const isPDFFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            setPreviews(p => ({ ...p, [label]: { src: base64, isPDF: isPDFFile } }))
            toast.info(`Cargado: ${label}`)
        } catch {
            toast.error("Error al cargar el archivo.")
        }
    }

    const handleRemove = (label: string) => {
        const cur = { ...form.getValues("imagenes") || {} }
        delete cur[label]
        form.setValue("imagenes", cur)
        const p = { ...previews }
        delete p[label]
        setPreviews(p)
    }

    const handleRotate = async (label: string) => {
        const preview = previews[label]
        if (!preview || preview.isPDF) return;

        try {
            const rotatedBase64 = await rotateImage(preview.src, 90);
            const current = form.getValues("imagenes") || {}
            form.setValue("imagenes", { ...current, [label]: rotatedBase64 })
            setPreviews(p => ({ ...p, [label]: { ...preview, src: rotatedBase64 } }));
            toast.success("Imagen rotada");
        } catch {
            toast.error("Error al rotar la imagen");
        }
    }

    const renderFilePreview = (label: string) => {
        const preview = previews[label]
        if (!preview) return null

        return (
            <div className="w-full flex flex-col items-center gap-2">
                <div className="relative border rounded-lg bg-background p-2 w-full flex justify-center">
                    {preview.isPDF ? (
                        <div className="flex items-center justify-center p-4">
                            <FileTextIcon className="h-10 w-10 text-primary" />
                            <span className="ml-2 text-sm text-muted-foreground truncate max-w-[150px]">PDF</span>
                        </div>
                    ) : (
                        <img
                            src={getFileSrc(preview.src) || ""}
                            alt="Preview"
                            className="max-h-32 rounded-md object-contain"
                        />
                    )}
                </div>

                <div className="flex gap-2 w-full justify-center">
                    {!preview.isPDF && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRotate(label);
                            }}
                        >
                            <RotateCwIcon className="h-3 w-3" />
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 px-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(label);
                        }}
                    >
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        )
    }

    const onSubmit = async (data: EstudianteFormValues) => {
        if (!estudiante) return
        setIsLoading(true)

        try {
            await EstudiantesService.updateEstudiante(estudiante.id, data)
            toast.success("Estudiante actualizado correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating estudiante:", error)
            toast.error("No se pudo actualizar el estudiante")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Estudiante</DialogTitle>
                    <DialogDescription>
                        Modifique los datos del estudiante.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre completo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="rut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RUT</FormLabel>
                                        <FormControl>
                                            <Input placeholder="12.345.678-9" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+569..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="correo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="estudiante@ejemplo.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="direccion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Dirección completa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione estado" />
                                                </SelectTrigger>
                                            </FormControl>

                                            <SelectContent>
                                                <SelectItem value="ACTIVO">Activo</SelectItem>
                                                <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                                <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {selectedConvenio && (
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                {(() => {
                                    const labels = [...(selectedConvenio.imagenes || [])];
                                    if (labels.length === 0) {
                                        labels.push("Foto frontal de Carnet de Identidad", "Certificado Alumno Regular");
                                    } else {
                                        if (!labels.some(l => l.toLowerCase().includes("carnet"))) labels.push("Foto frontal de Carnet de Identidad");
                                        if (!labels.some(l => l.toLowerCase().includes("certificado"))) labels.push("Certificado Alumno Regular");
                                    }
                                    
                                    return labels.map((label: string) => (
                                        <div key={label} className="space-y-2">
                                            <FormLabel className="text-xs font-semibold">{label}</FormLabel>
                                            <div
                                                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition min-h-[140px] flex items-center justify-center relative"
                                                onClick={() => document.getElementById(`update-file-est-${label}`)?.click()}
                                            >
                                                <input
                                                    id={`update-file-est-${label}`}
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleFileChange(file, label)
                                                    }}
                                                />

                                                {previews[label] ? (
                                                    renderFilePreview(label)
                                                ) : (
                                                    <div className="flex flex-col items-center text-muted-foreground">
                                                        <UploadIcon className="h-6 w-6 mb-1" />
                                                        <p className="text-[10px]">Subir {label}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit" disabled={isLoading || loadingConvenio}>
                                {isLoading ? (
                                    <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                )}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}