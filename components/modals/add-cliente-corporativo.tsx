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
import { ClienteCorporativoService } from "@/services/cliente-corporativo.service"
import { toast } from "sonner"
import { formatRut, validateRut } from "@/utils/helpers"

interface AddClienteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    nombreTabla: string
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

export default function AddClienteCorporativoModal({
    open,
    onOpenChange,
    nombreTabla,
    onSuccess,
}: AddClienteModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<ClienteFormValues>({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            rut: "",
            nombre_completo: "",
        },
    })

    const onSubmit = async (values: ClienteFormValues) => {
        setIsLoading(true)
        try {
            await ClienteCorporativoService.createCliente(nombreTabla, {
                rut: values.rut,
                nombre_completo: values.nombre_completo,
                status: "ACTIVO"
            })

            toast.success("Cliente agregado correctamente")
            form.reset()
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "No se pudo agregar el cliente"
            toast.error(errMsg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="sm:max-w-[425px]">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Agregar Cliente Manual</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Ingrese los datos del nuevo cliente para esta nómina.
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
                                    <Icon.UserPlus2 className="h-4 w-4 mr-2" />
                                )}
                                Agregar a Nómina
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
