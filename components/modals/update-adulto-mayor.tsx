"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import * as Form from "@/components/ui/form"
import * as Icon from "lucide-react"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { AdultosMayoresService, AdultoMayor } from "@/services/adulto-mayor.service"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { fileToBase64, getFileSrc, isPDF } from "@/utils/helpers"
import { FileTextIcon, UploadIcon, XIcon } from "lucide-react"

interface UpdateAdultoMayorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    adultoMayor: AdultoMayor | null
    onSuccess?: () => void
}

const adultoMayorSchema = z.object({
    nombre: z
        .string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es demasiado largo"),
    rut: z
        .string()
        .min(8, "RUT inválido")
        .max(20, "RUT demasiado largo")
        .transform((val) => val.replace(/\./g, ""))
        .refine((val) => /^[0-9]+-[0-9kK]$/.test(val), {
            message: "Formato de RUT inválido (ej: 12345678-9)",
        }),
    telefono: z.string().min(1, "El teléfono es requerido"),
    correo: z.string().email("Correo electrónico inválido"),
    direccion: z.string().min(1, "La dirección es requerida"),
    status: z.enum(["ACTIVO", "INACTIVO", "RECHAZADO"]),
    imagen_cedula_identidad: z.string().optional(),
})

type AdultoMayorFormValues = z.infer<typeof adultoMayorSchema>

export default function UpdateAdultoMayorModal({
    open,
    onOpenChange,
    adultoMayor,
    onSuccess,
}: UpdateAdultoMayorModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [preview, setPreview] = useState<{ src: string; isPDF: boolean } | null>(null)
    const [originalFile, setOriginalFile] = useState<string | undefined>(undefined)

    const form = useForm<AdultoMayorFormValues>({
        resolver: zodResolver(adultoMayorSchema),
        defaultValues: {
            nombre: "",
            rut: "",
            telefono: "",
            correo: "",
            direccion: "",
            status: "ACTIVO",
            imagen_cedula_identidad: "",
        },
    })

    useEffect(() => {
        if (adultoMayor) {
            form.reset({
                nombre: adultoMayor.nombre,
                rut: adultoMayor.rut,
                telefono: adultoMayor.telefono,
                correo: adultoMayor.correo,
                direccion: adultoMayor.direccion,
                status: adultoMayor.status,
                imagen_cedula_identidad: adultoMayor.imagen_cedula_identidad || "",
            })

            setOriginalFile(adultoMayor.imagen_cedula_identidad)

            if (adultoMayor.imagen_cedula_identidad) {
                setPreview({
                    src: adultoMayor.imagen_cedula_identidad,
                    isPDF: isPDF(adultoMayor.imagen_cedula_identidad)
                })
            } else {
                setPreview(null)
            }
        }
    }, [adultoMayor, form])

    const handleCancel = () => {
        form.reset()
        setPreview(originalFile ? { src: originalFile, isPDF: isPDF(originalFile) } : null)
        onOpenChange(false)
    }

    const handleFileChange = async (file: File) => {
        if (!file) return

        const fileSizeInMB = file.size / (1024 * 1024)

        if (fileSizeInMB > 5) {
            toast.error(`El archivo no puede superar 5MB. Este archivo pesa ${fileSizeInMB.toFixed(2)}MB`)
            return
        }

        try {
            const base64 = await fileToBase64(file)

            const base64SizeInMB = (base64.length * 3 / 4) / (1024 * 1024)

            if (base64SizeInMB > 5) {
                toast.error(`El archivo en base64 excede el límite de 5MB (${base64SizeInMB.toFixed(2)}MB)`)
                return
            }

            form.setValue("imagen_cedula_identidad", base64)

            // Detectar si es PDF
            const fileIsPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            setPreview({ src: base64, isPDF: fileIsPDF })

            toast.info(`Archivo cargado: ${fileSizeInMB.toFixed(2)}MB`)
        } catch (error) {
            toast.error("Error al procesar el archivo")
        }
    }

    const handleRemoveFile = () => {
        form.setValue("imagen_cedula_identidad", "")
        setPreview(null)
    }

    const renderFilePreview = () => {
        if (!preview) return null

        return (
            <div className="relative">
                {preview.isPDF ? (
                    <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                        <FileTextIcon className="h-12 w-12 text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Documento PDF</span>
                    </div>
                ) : (
                    <img
                        src={getFileSrc(preview.src) || ""}
                        alt="Preview"
                        className="mx-auto max-h-40 rounded-md object-contain"
                    />
                )}
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveFile}
                >
                    <XIcon className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    const onSubmit = async (data: AdultoMayorFormValues) => {
        if (!adultoMayor) return

        if (data.imagen_cedula_identidad && data.imagen_cedula_identidad !== originalFile) {
            const base64SizeInMB = (data.imagen_cedula_identidad.length * 3 / 4) / (1024 * 1024)

            if (base64SizeInMB > 5) {
                toast.error(`El archivo excede el límite de 5MB (${base64SizeInMB.toFixed(2)}MB). Por favor, selecciona un archivo más pequeño.`)
                return
            }
        }

        setIsLoading(true)

        try {
            await AdultosMayoresService.updateAdultoMayor(adultoMayor.id, data)

            toast.success("Adulto Mayor actualizado correctamente")

            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating adulto mayor:", error)
            toast.error("No se pudo actualizar el adulto mayor")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Adulto Mayor</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del adulto mayor.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Form.FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Nombre</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="Nombre completo" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            <Form.FormField
                                control={form.control}
                                name="rut"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>RUT</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="12.345.678-9" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            <Form.FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Teléfono</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="+569..." {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            <Form.FormField
                                control={form.control}
                                name="correo"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Correo</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="adulto@ejemplo.com" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            <Form.FormField
                                control={form.control}
                                name="direccion"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Dirección</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="Dirección completa" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            <Form.FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Estado</Form.FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <Form.FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione estado" />
                                                </SelectTrigger>
                                            </Form.FormControl>

                                            <SelectContent>
                                                <SelectItem value="ACTIVO">Activo</SelectItem>
                                                <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                                <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>

                        <Form.FormField
                            control={form.control}
                            name="imagen_cedula_identidad"
                            render={() => (
                                <Form.FormItem>
                                    <Form.FormLabel>Foto frontal de Carnet de Identidad</Form.FormLabel>
                                    <Form.FormControl>
                                        <div
                                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition min-h-[200px] flex items-center justify-center"
                                            onClick={() => document.getElementById("updateFileInput")?.click()}
                                        >
                                            <input
                                                id="updateFileInput"
                                                type="file"
                                                accept="image/*,application/pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleFileChange(file)
                                                }}
                                            />

                                            {preview ? (
                                                renderFilePreview()
                                            ) : (
                                                <div className="flex flex-col items-center text-muted-foreground">
                                                    <UploadIcon className="h-8 w-8 mb-2" />
                                                    <p>Haz click para subir el carnet</p>
                                                    <p className="text-xs mt-1">Imagen o PDF (Máximo 5MB)</p>
                                                </div>
                                            )}
                                        </div>
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                )}
                                Guardar Cambios
                            </Button>
                        </div>

                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
