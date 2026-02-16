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
import { UsuariosFrecuentesService } from "@/services/usuario-frecuente.service"
import { toast } from "sonner"

interface AddUsuarioFrecuenteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
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
})

type UsuarioFrecuenteFormValues = z.infer<typeof usuarioFrecuenteSchema>

export default function AddUsuarioFrecuenteModal({
    open,
    onOpenChange,
    onSuccess,
}: AddUsuarioFrecuenteModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const form = useForm<UsuarioFrecuenteFormValues>({
        resolver: zodResolver(usuarioFrecuenteSchema),
        defaultValues: {
            nombre: "",
            rut: "",
            telefono: "",
            correo: "",
            direccion: "",
        },
    })

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleCancel()
        }
        onOpenChange(open)
    }

    const handleCancel = () => {
        form.reset()
        setPreview(null)
        onOpenChange(false)
    }

    const onSubmit = async (data: UsuarioFrecuenteFormValues) => {
        setIsLoading(true)

        try {
            await UsuariosFrecuentesService.createUsuarioFrecuente(data)

            toast.success("Usuario Frecuente creado correctamente")

            form.reset()
            setPreview(null)
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error creating usuario frecuente:", error)
            toast.error("No se pudo crear el usuario frecuente")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={handleOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Agregar Nuevo Usuario Frecuente</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Complete los datos del nuevo usuario frecuente.
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
                        </div>

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
                                Crear Usuario
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
