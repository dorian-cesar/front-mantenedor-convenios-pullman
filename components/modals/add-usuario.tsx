"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import * as Form from "@/components/ui/form"
import * as Icon from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { UsuariosService } from "@/services/usuario.service"
import { toast } from "sonner"

interface AddUsuarioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const usuarioSchema = z
    .object({
        correo: z
            .string()
            .email("Debe ingresar un correo válido"),

        nombre: z
            .string()
            .min(3, "El nombre debe tener al menos 3 caracteres")
            .max(100, "El nombre es demasiado largo"),

        rut: z
            .string()
            .transform((val) => val.replace(/\./g, ""))
            .optional()
            .refine(
                (val) => {
                    if (!val || val.trim() === "") return true
                    return /^[0-9]+-[0-9kK]$/.test(val)
                },
                {
                    message: "Formato de RUT inválido (ej: 12345678-9)",
                }
            ),

        telefono: z
            .string()
            .min(6, "Teléfono inválido")
            .max(20, "Teléfono inválido")
            .optional()
            .or(z.literal("")),

        password: z
            .string()
            .min(6, "La contraseña debe tener al menos 6 caracteres"),

        confirmPassword: z.string(),

        rol: z.enum(["USUARIO", "SUPER_USUARIO"]),

        status: z.enum(["ACTIVO", "INACTIVO"]),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
    })

type UsuarioFormValues = z.infer<typeof usuarioSchema>

export default function AddUsuarioModal({
    open,
    onOpenChange,
    onSuccess,
}: AddUsuarioModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const form = useForm<UsuarioFormValues>({
        resolver: zodResolver(usuarioSchema),
        defaultValues: {
            correo: "",
            nombre: "",
            rut: "",
            telefono: "",
            password: "",
            confirmPassword: "",
            rol: "USUARIO",
            status: "ACTIVO",
        },
    })

    useEffect(() => {
        if (!open) {
            form.reset()
            setShowPassword(false)
        }
    }, [open, form])

    const onSubmit = async (data: UsuarioFormValues) => {
        setIsLoading(true)

        try {
            await UsuariosService.createUsuario({
                correo: data.correo,
                password: data.password,
                rol: data.rol,
                status: data.status,
                nombre: data.nombre,
                rut: data.rut || null,
                telefono: data.telefono || null,
            } as any)

            toast.success("Usuario creado correctamente")

            form.reset()
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error creating usuario:", error)
            toast.error("No se pudo crear el usuario")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-lg">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Agregar Nuevo Usuario</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Complete los datos del nuevo usuario del sistema.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <Form.FormField
                            control={form.control}
                            name="correo"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Correo</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input placeholder="usuario@correo.cl" {...field} />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

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
                                    <Form.FormLabel>RUT (opcional)</Form.FormLabel>
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
                                    <Form.FormLabel>Teléfono (opcional)</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input placeholder="+56 9 1234 5678" {...field} />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <Form.FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Contraseña</Form.FormLabel>
                                    <Form.FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="********"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-2.5 text-muted-foreground"
                                                onClick={() => setShowPassword((v) => !v)}
                                            >
                                                {showPassword ? (
                                                    <Icon.EyeOffIcon className="h-4 w-4" />
                                                ) : (
                                                    <Icon.EyeIcon className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <Form.FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Confirmar contraseña</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="********"
                                            {...field}
                                        />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <Form.FormField
                            control={form.control}
                            name="rol"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Rol</Form.FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <Form.FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </Form.FormControl>
                                        <SelectContent>
                                            <SelectItem value="USUARIO">Usuario</SelectItem>
                                            <SelectItem value="SUPER_USUARIO">Super Usuario</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <Form.FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
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

                        <div className="flex justify-end gap-2">
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
