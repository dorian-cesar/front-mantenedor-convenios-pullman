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
import { EstudiantesService, Estudiante } from "@/services/estudiante.service"
import { toast } from "sonner"
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
    imagen_base64: z.string().optional(),
    status: z.enum(["ACTIVO", "INACTIVO"]),
})

type EstudianteFormValues = z.infer<typeof estudianteSchema>

export default function UpdateEstudianteModal({
    open,
    onOpenChange,
    estudiante,
    onSuccess,
}: UpdateEstudianteModalProps) {
    const [isLoading, setIsLoading] = useState(false)

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
            status: "ACTIVO",
        },
    })

    useEffect(() => {
        if (estudiante) {
            form.reset({
                nombre: estudiante.nombre,
                rut: estudiante.rut,
                telefono: estudiante.telefono,
                correo: estudiante.correo,
                direccion: estudiante.direccion,
                carnet_estudiante: estudiante.carnet_estudiante,
                fecha_vencimiento: estudiante.fecha_vencimiento,
                imagen_base64: estudiante.imagen_base64 || "",
                status: estudiante.status,
            })
        }
    }, [estudiante, form])

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
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Estudiante</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del estudiante.
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
