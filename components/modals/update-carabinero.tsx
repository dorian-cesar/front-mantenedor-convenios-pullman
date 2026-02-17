"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import * as Form from "@/components/ui/form"
import * as Icon from "lucide-react"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { CarabinerosService, Carabinero } from "@/services/carabineros.service"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface UpdateCarabineroModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    carabinero: Carabinero | null;
    onSuccess?: () => void
}

const carabineroSchema = z.object({
    nombre_completo: z
        .string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es demasiado largo"),
    rut: z
        .string()
        .min(7, "RUT inválido")
        .max(8, "RUT inválido")
        .transform((val) => val.replace(/\./g, ""))
        .refine((val) => /^[0-9]+$/.test(val), {
            message: "El RUT no debe incluir dígito verificador ni guión",
        }),
    status: z.enum(["ACTIVO", "INACTIVO"]),
})

type CarabineroFormValues = z.infer<typeof carabineroSchema>

export default function UpdateCarabineroModal({
    open,
    onOpenChange,
    carabinero,
    onSuccess,
}: UpdateCarabineroModalProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<CarabineroFormValues>({
        resolver: zodResolver(carabineroSchema),
        defaultValues: {
            nombre_completo: "",
            rut: "",
            status: "ACTIVO",
        },
    })

    useEffect(() => {
        if (carabinero) {
            form.reset({
                nombre_completo: carabinero.nombre_completo,
                rut: carabinero.rut,
                status: carabinero.status,
            })
        }
    }, [carabinero, form])

    const onSubmit = async (data: CarabineroFormValues) => {
        if (!carabinero) return

        setLoading(true)
        try {
            await CarabinerosService.updateCarabinero(carabinero.rut, data)
            toast.success("Carabinero actualizado correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating carabinero:", error)
            toast.error("No se pudo actualizar el carabinero")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Adulto Mayor</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del adulto mayor.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <Form.FormField
                                control={form.control}
                                name="nombre_completo"
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
                                            <Input placeholder="12345678" {...field} disabled />
                                        </Form.FormControl>
                                        <Form.FormDescription>
                                            Ingrese el RUT sin puntos ni dígito verificador.
                                        </Form.FormDescription>
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