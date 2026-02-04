"use client"

import { useState, useEffect } from "react"
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
import { UsuariosService, Usuario } from "@/services/usuario.service"
import { toast } from "sonner"

interface UpdateUsuarioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    usuario: Usuario | null
    onSuccess?: () => void
}


const usuarioSchema = z
    .object({
        correo: z.string().email("Correo inválido"),

        nombre: z
            .string()
            .transform(val => val.trim())
            .refine(val => val === "" || val.length >= 3, {
                message: "El nombre debe tener al menos 3 caracteres",
            })
            .refine(val => val === "" || val.length <= 100, {
                message: "El nombre es demasiado largo",
            }),

        rut: z
            .string()
            .transform(val => val.trim())
            .refine(val => {
                if (val === "") return true
                const cleaned = val.replace(/\./g, "")
                return /^[0-9]+-[0-9kK]$/.test(cleaned)
            }, {
                message: "Formato de RUT inválido (ej: 12345678-9)",
            }),

        telefono: z
            .string()
            .transform(val => val.trim())
            .refine(val => {
                if (val === "") return true
                return /^[0-9]{8,15}$/.test(val)
            }, {
                message: "Teléfono inválido",
            }),

        password: z.string().min(6).optional().or(z.literal("")),
        confirmPassword: z.string().optional(),

        rol: z.enum(["USUARIO", "SUPER_USUARIO"]),

        status: z.enum(["ACTIVO", "INACTIVO"]),
    })
    .refine(
        (data) => {
            if (!data.password) return true
            return data.password === data.confirmPassword
        },
        {
            path: ["confirmPassword"],
            message: "Las contraseñas no coinciden",
        }
    )

type UsuarioFormValues = z.infer<typeof usuarioSchema>

export default function UpdateUsuarioModal({
    open,
    onOpenChange,
    usuario,
    onSuccess,
}: UpdateUsuarioModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const form = useForm<UsuarioFormValues>({
        resolver: zodResolver(usuarioSchema),
        shouldUnregister: false,
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
        if (usuario) {
            form.reset({
                correo: usuario.correo,
                nombre: usuario.nombre ?? "",
                rut: usuario.rut ?? "",
                telefono: usuario.telefono ?? "",
                password: "",
                confirmPassword: "",
                rol: usuario.rol ?? "USUARIO",
                status: usuario.status,
            })
        }
        setShowPassword(false)
    }, [usuario, form])

    const onSubmit = async (data: UsuarioFormValues) => {
        if (!usuario) return

        setIsLoading(true)

        try {
            await UsuariosService.updateUsuario(usuario.id, {
                correo: data.correo,
                nombre: data.nombre,
                rut: data.rut,
                telefono: data.telefono,
                rol: data.rol,
                status: data.status,
                ...(data.password
                    ? { password: data.password }
                    : {}),
            } as any)

            toast.success("Usuario actualizado correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating usuario:", error)
            toast.error("No se pudo actualizar el usuario")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-lg">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Usuario</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del usuario.
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
                                        <Input {...field} />
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
                                        <Input {...field} />
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
                                        <Input placeholder="12345678-9" {...field} />
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
                                        <Input {...field} />
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
                                    <Form.FormLabel>Nueva contraseña (opcional)</Form.FormLabel>
                                    <Form.FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
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
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                                    <Select onValueChange={field.onChange} value={field.value}>
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
