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
import { ClienteCorporativoService, type ClienteCorporativo } from "@/services/cliente-corporativo.service"
import { toast } from "sonner"
import { formatRut, validateRut } from "@/utils/helpers"

interface UpdateClienteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    nombreTabla: string
    cliente: ClienteCorporativo | null
    onSuccess?: () => void
}

const clienteSchema = z.object({
    rut: z.string()
        .min(1, "El RUT es requerido")
        .refine(validateRut, "RUT inválido"),
    nombre_completo: z.string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(150, "Nombre demasiado largo"),
})

type ClienteFormValues = z.infer<typeof clienteSchema>

export default function UpdateClienteCorporativoModal({
    open,
    onOpenChange,
    nombreTabla,
    cliente,
    onSuccess,
}: UpdateClienteModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<ClienteFormValues>({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            rut: "",
            nombre_completo: "",
        },
    })

    useEffect(() => {
        if (open && cliente) {
            form.reset({
                rut: cliente.rut,
                nombre_completo: cliente.nombre_completo,
            })
        } else if (!open) {
            form.reset()
        }
    }, [open, cliente, form])

    const onSubmit = async (values: ClienteFormValues) => {
        if (!cliente) return
        setIsLoading(true)
        try {
            await ClienteCorporativoService.updateCliente(nombreTabla, cliente.rut, {
                rut: values.rut,
                nombre_completo: values.nombre_completo,
            })

            toast.success("Cliente actualizado correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "No se pudo actualizar el cliente"
            toast.error(errMsg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="sm:max-w-[425px]">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Cliente</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del cliente.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <Form.FormField
                            control={form.control}
                            name="rut"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>RUT</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input 
                                            placeholder="12.345.678-9" 
                                            {...field} 
                                            onChange={(e) => field.onChange(formatRut(e.target.value))}
                                            disabled={true} // Por seguridad, el RUT suele ser el identificador único no editable
                                        />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <Form.FormField
                            control={form.control}
                            name="nombre_completo"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Nombre Completo</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input placeholder="Ej: Juan Pérez González" {...field} />
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
