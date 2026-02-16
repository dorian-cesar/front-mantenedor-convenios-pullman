"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import * as Form from "@/components/ui/form"
import * as Icon from "lucide-react"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { EstudiantesService } from "@/services/estudiante.service"
import { toast } from "sonner"
import { fileToBase64 } from "@/utils/helpers"

interface AddEstudianteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const estudianteSchema = z.object({
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
    carnet_estudiante: z.string().min(1, "El carnet de estudiante es requerido"),
    fecha_vencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
    imagen_base64: z
        .string()
        .nonempty("La imagen es requerida"),
})

type EstudianteFormValues = z.infer<typeof estudianteSchema>

export default function AddEstudianteModal({
    open,
    onOpenChange,
    onSuccess,
}: AddEstudianteModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const form = useForm<EstudianteFormValues>({
        resolver: zodResolver(estudianteSchema),
        defaultValues: {
            nombre: "",
            rut: "",
            telefono: "",
            correo: "",
            direccion: "",
            carnet_estudiante: "",
            fecha_vencimiento: "",
            imagen_base64: "",
        },
    })

    // Limpiar el formulario cuando se abre el modal
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Si se está cerrando el modal, limpiar todo
            handleCancel()
        }
        onOpenChange(open)
    }

    const handleCancel = () => {
        form.reset()
        setPreview(null)
        onOpenChange(false)
    }

    const handleImageChange = async (file: File) => {
        if (!file) return

        // Calcular el tamaño del archivo original
        const fileSizeInMB = file.size / (1024 * 1024)

        // Verificar si el archivo original ya excede el límite
        if (fileSizeInMB > 50) {
            toast.error(`La imagen no puede superar 50MB. Esta imagen pesa ${fileSizeInMB.toFixed(2)}MB`)
            return
        }

        try {
            const base64 = await fileToBase64(file)

            // Calcular el tamaño aproximado en base64
            // El base64 aumenta el tamaño aproximadamente un 33%
            const base64SizeInMB = (base64.length * 3 / 4) / (1024 * 1024)

            console.log(`Tamaño original: ${fileSizeInMB.toFixed(2)}MB`)
            console.log(`Tamaño base64: ${base64SizeInMB.toFixed(2)}MB`)

            if (base64SizeInMB > 50) {
                toast.error(`La imagen en base64 excede el límite de 50MB (${base64SizeInMB.toFixed(2)}MB)`)
                return
            }

            form.setValue("imagen_base64", base64)
            setPreview(base64)

            // Mostrar mensaje informativo
            toast.info(`Imagen cargada: ${fileSizeInMB.toFixed(2)}MB (${base64SizeInMB.toFixed(2)}MB en base64)`)
        } catch (error) {
            toast.error("Error al procesar la imagen")
        }
    }


    const onSubmit = async (data: EstudianteFormValues) => {

        const base64SizeInMB = (data.imagen_base64.length * 3 / 4) / (1024 * 1024)

        if (base64SizeInMB > 50) {
            toast.error(`La imagen excede el límite de 50MB (${base64SizeInMB.toFixed(2)}MB). Por favor, selecciona una imagen más pequeña.`)
            return
        }

        setIsLoading(true)

        try {
            await EstudiantesService.createEstudiante(data)

            toast.success("Estudiante creado correctamente")

            form.reset()
            setPreview(null)
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error creating estudiante:", error)
            toast.error("No se pudo crear el estudiante")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={handleOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Agregar Nuevo Estudiante</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Complete los datos del nuevo estudiante.
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
                                            <Input placeholder="estudiante@ejemplo.com" {...field} />
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
                                name="carnet_estudiante"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Carnet Estudiante</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="Código carnet" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            <Form.FormField
                                control={form.control}
                                name="fecha_vencimiento"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Fecha Vencimiento</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input type="date" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>

                        <Form.FormField
                            control={form.control}
                            name="imagen_base64"
                            render={() => (
                                <Form.FormItem>
                                    <Form.FormLabel>Imagen del Estudiante</Form.FormLabel>
                                    <Form.FormControl>
                                        <div
                                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition"
                                            onClick={() => document.getElementById("fileInput")?.click()}
                                        >
                                            <input
                                                id="fileInput"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleImageChange(file)
                                                }}
                                            />

                                            {preview ? (
                                                <img
                                                    src={preview}
                                                    alt="Preview"
                                                    className="mx-auto max-h-40 rounded-md object-contain"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center text-muted-foreground">
                                                    <Icon.UploadIcon className="h-8 w-8 mb-2" />
                                                    <p>Haz click para subir una imagen aquí</p>
                                                    <p className="text-xs">Máximo 2MB</p>
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
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Icon.PlusIcon className="h-4 w-4 mr-2" />
                                )}
                                Crear Estudiante
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}