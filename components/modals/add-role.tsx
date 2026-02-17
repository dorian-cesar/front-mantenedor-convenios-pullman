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
import { RolesService } from "@/services/roles.service"

interface AddRoleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const rolesSchema = z.object({
    nombre: z
        .string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es demasiado largo"),
    status: z.enum(["ACTIVO", "INACTIVO"]),
})

type RoleFormValues = z.infer<typeof rolesSchema>

export default function AddRoleModal({
    open,
    onOpenChange,
    onSuccess,
}: AddRoleModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<RoleFormValues>({
        resolver: zodResolver(rolesSchema),
        defaultValues: {
            nombre: "",
            status: "ACTIVO",
        },
    })

    useEffect(() => {
        if (!open) {
            form.reset()
        }
    }, [open, form])

    const onSubmit = async (data: RoleFormValues) => {
        setIsLoading(true)

        try {
            await RolesService.createRole({
                nombre: data.nombre,
                status: data.status,
            })

            toast.success("Rol creado correctamente")

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
                    <Dialog.DialogTitle>Agregar Nuevo Rol</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Complete los datos del nuevo rol del sistema.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

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
                                Crear Rol
                            </Button>
                        </div>

                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}