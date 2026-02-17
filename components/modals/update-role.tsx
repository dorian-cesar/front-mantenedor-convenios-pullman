"use client";

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
import { toast } from "sonner"
import { RolesService, Role } from "@/services/roles.service"

interface UpdateRoleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    role: Role | null
    onSuccess?: () => void
}

const roleSchema = z.object({
    nombre: z
        .string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es demasiado largo"),
    status: z.enum(["ACTIVO", "INACTIVO"]),
})

type RoleFormValues = z.infer<typeof roleSchema>

export default function UpdateRoleModal({
    open,
    onOpenChange,
    role,
    onSuccess,
}: UpdateRoleModalProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            nombre: role?.nombre || "",
            status: role?.status || "ACTIVO",
        },
    })

    useEffect(() => {
        if (role) {
            form.reset({
                nombre: role.nombre,
                status: role.status,
            })
        }
    }, [role, form])

    const onSubmit = async (data: RoleFormValues) => {
        if (!role) return

        setLoading(true)

        try {
            await RolesService.updateRole(role.id, data)

            toast.success("Rol actualizado correctamente")

            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating role:", error)
            toast.error("No se pudo actualizar el rol")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Rol</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del rol.
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
                                            <Input placeholder="ROL_SISTEMA" {...field} />
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
                                disabled={loading}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit" disabled={loading}>
                                {loading ? (
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