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
import { UsuariosFrecuentesService, UsuarioFrecuente } from "@/services/usuario-frecuente.service"
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

interface UpdateUsuarioFrecuenteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    usuarioFrecuente: UsuarioFrecuente | null
    onSuccess?: () => void
}

const usuarioFrecuenteSchema = z.object({
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
    status: z.enum(["ACTIVO", "INACTIVO"]),
    imagen_cedula_identidad: z.string().optional(),
    imagen_certificado: z.string().optional(),
})

type UsuarioFrecuenteFormValues = z.infer<typeof usuarioFrecuenteSchema>

export default function UpdateUsuarioFrecuenteModal({
    open,
    onOpenChange,
    usuarioFrecuente,
    onSuccess,
}: UpdateUsuarioFrecuenteModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [previewCedula, setPreviewCedula] = useState<{ src: string; isPDF: boolean } | null>(null)
    const [previewCertificado, setPreviewCertificado] = useState<{ src: string; isPDF: boolean } | null>(null)

    const form = useForm<UsuarioFrecuenteFormValues>({
        resolver: zodResolver(usuarioFrecuenteSchema),
        defaultValues: {
            nombre: "",
            rut: "",
            telefono: "",
            correo: "",
            direccion: "",
            status: "ACTIVO",
            imagen_cedula_identidad: undefined,
            imagen_certificado: undefined,
        },
    })

    useEffect(() => {
        if (usuarioFrecuente) {
            form.reset({
                nombre: usuarioFrecuente.nombre,
                rut: usuarioFrecuente.rut,
                telefono: usuarioFrecuente.telefono,
                correo: usuarioFrecuente.correo,
                direccion: usuarioFrecuente.direccion,
                status: usuarioFrecuente.status,
                imagen_cedula_identidad: usuarioFrecuente.imagen_cedula_identidad || undefined,
                imagen_certificado: usuarioFrecuente.imagen_certificado || undefined,
            })
            if (usuarioFrecuente.imagen_cedula_identidad) {
                setPreviewCedula({
                    src: usuarioFrecuente.imagen_cedula_identidad,
                    isPDF: isPDF(usuarioFrecuente.imagen_cedula_identidad)
                })
            } else {
                setPreviewCedula(null)
            }

            if (usuarioFrecuente.imagen_certificado) {
                setPreviewCertificado({
                    src: usuarioFrecuente.imagen_certificado,
                    isPDF: isPDF(usuarioFrecuente.imagen_certificado)
                })
            } else {
                setPreviewCertificado(null)
            }
        }
    }, [usuarioFrecuente, open, form])

    useEffect(() => {
        if (!open) {
            form.reset({
                nombre: "",
                rut: "",
                telefono: "",
                correo: "",
                direccion: "",
                status: "ACTIVO",
                imagen_cedula_identidad: undefined,
                imagen_certificado: undefined,
            })
            setPreviewCedula(null)
            setPreviewCertificado(null)
        }
    }, [open, form])

    const handleCancel = () => {
        onOpenChange(false)
    }

    const handleFileChange = async (
        file: File,
        fieldName: "imagen_cedula_identidad" | "imagen_certificado",
        setPreview: (value: { src: string; isPDF: boolean } | null) => void
    ) => {
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

            form.setValue(fieldName, base64)

            const fileIsPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            setPreview({ src: base64, isPDF: fileIsPDF })

            toast.info(`Archivo cargado: ${fileSizeInMB.toFixed(2)}MB`)
        } catch {
            toast.error("Error al procesar el archivo")
        }
    }

    const handleRemoveFile = (
        fieldName: "imagen_cedula_identidad" | "imagen_certificado",
        setPreview: (value: null) => void
    ) => {
        form.setValue(fieldName, undefined)
        setPreview(null)
    }

    const renderFilePreview = (
        preview: { src: string; isPDF: boolean } | null,
        fieldName: "imagen_cedula_identidad" | "imagen_certificado",
        setPreview: (value: null) => void
    ) => {
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
                    onClick={() => handleRemoveFile(fieldName, setPreview)}
                >
                    <XIcon className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    const onSubmit = async (data: UsuarioFrecuenteFormValues) => {
        if (!usuarioFrecuente) return

        if (data.imagen_cedula_identidad &&
            data.imagen_cedula_identidad !== usuarioFrecuente.imagen_cedula_identidad) {
            const base64SizeInMB = (data.imagen_cedula_identidad.length * 3 / 4) / (1024 * 1024)
            if (base64SizeInMB > 5) {
                toast.error(`El archivo de cédula excede el límite de 5MB`)
                return
            }
        }

        if (data.imagen_certificado &&
            data.imagen_certificado !== usuarioFrecuente.imagen_certificado) {
            const base64SizeInMB = (data.imagen_certificado.length * 3 / 4) / (1024 * 1024)
            if (base64SizeInMB > 5) {
                toast.error(`El archivo de certificado excede el límite de 5MB`)
                return
            }
        }

        setIsLoading(true)

        try {
            await UsuariosFrecuentesService.updateUsuarioFrecuente(usuarioFrecuente.id, data)

            toast.success("Usuario Frecuente actualizado correctamente")

            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating usuario frecuente:", error)
            toast.error("No se pudo actualizar el usuario frecuente")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Usuario Frecuente</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del usuario frecuente.
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
                                            <Input placeholder="usuario@ejemplo.com" {...field} />
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
                                            </SelectContent>
                                        </Select>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Form.FormField
                                control={form.control}
                                name="imagen_cedula_identidad"
                                render={() => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Cédula de Identidad</Form.FormLabel>
                                        <Form.FormControl>
                                            <div
                                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition min-h-[200px] flex items-center justify-center"
                                                onClick={() => document.getElementById("updateFileInputCedula")?.click()}
                                            >
                                                <input
                                                    id="updateFileInputCedula"
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file)
                                                            handleFileChange(
                                                                file,
                                                                "imagen_cedula_identidad",
                                                                setPreviewCedula
                                                            )
                                                    }}
                                                />

                                                {previewCedula ? (
                                                    renderFilePreview(previewCedula, "imagen_cedula_identidad", setPreviewCedula)
                                                ) : (
                                                    <div className="flex flex-col items-center text-muted-foreground">
                                                        <UploadIcon className="h-8 w-8 mb-2" />
                                                        <p>Haz click para subir la cédula</p>
                                                        <p className="text-xs mt-1">Imagen o PDF (Máximo 5MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            <Form.FormField
                                control={form.control}
                                name="imagen_certificado"
                                render={() => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Certificado</Form.FormLabel>
                                        <Form.FormControl>
                                            <div
                                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition min-h-[200px] flex items-center justify-center"
                                                onClick={() => document.getElementById("updateFileInputCertificado")?.click()}
                                            >
                                                <input
                                                    id="updateFileInputCertificado"
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file)
                                                            handleFileChange(
                                                                file,
                                                                "imagen_certificado",
                                                                setPreviewCertificado
                                                            )
                                                    }}
                                                />

                                                {previewCertificado ? (
                                                    renderFilePreview(previewCertificado, "imagen_certificado", setPreviewCertificado)
                                                ) : (
                                                    <div className="flex flex-col items-center text-muted-foreground">
                                                        <UploadIcon className="h-8 w-8 mb-2" />
                                                        <p>Haz click para subir el certificado</p>
                                                        <p className="text-xs mt-1">Imagen o PDF (Máximo 5MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>

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
