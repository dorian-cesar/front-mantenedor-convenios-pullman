"use client"

import * as React from "react"
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
import { ApisService } from "@/services/api.service"

interface AddApiModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export const apiSchema = z.object({
    nombre: z.string()
        .min(1, "El nombre es requerido")
        .max(100, "El nombre no puede exceder los 100 caracteres"),
    endpoint: z.string()
        .min(1, "El endpoint es requerido")
        .max(500, "El endpoint no puede exceder los 500 caracteres"),
    status: z.enum(["ACTIVO", "INACTIVO"], {
        message: "Debe seleccionar un estado"
    }),
})

export type ApiFormValues = z.infer<typeof apiSchema>

export default function AddApiModal({
    open,
    onOpenChange,
    onSuccess,
}: AddApiModalProps) {

    const [loading, setLoading] = React.useState(false)

    const form = useForm<ApiFormValues>({
        resolver: zodResolver(apiSchema),
        mode: "onChange",
        defaultValues: {
            nombre: "",
            endpoint: "",
            status: "ACTIVO"
        },
    })

    React.useEffect(() => {
        if (open) {
            form.reset()
        }
    }, [open])

    const onSubmit = async (data: ApiFormValues) => {
        setLoading(true)
        try {
            await ApisService.createApi({
                nombre: data.nombre,
                endpoint: data.endpoint,
                status: data.status
            })

            toast.success("API creada correctamente")
            form.reset()
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("No se pudo crear la API")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>
                        Agregar API
                    </Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Complete los datos para agregar una nueva API
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Form.FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <Form.FormItem className="flex flex-col">
                                    <Form.FormLabel>Nombre</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Ej: API Araucana"
                                            maxLength={100}
                                        />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <Form.FormField
                            control={form.control}
                            name="endpoint"
                            render={({ field }) => (
                                <Form.FormItem className="flex flex-col">
                                    <Form.FormLabel>Endpoint</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Ej: /api/integraciones/araucana/validar"
                                            maxLength={500}
                                        />
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
                                        defaultValue={field.value}
                                    >
                                        <Form.FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar estado" />
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

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit" disabled={loading || !form.formState.isValid}>
                                {loading ? (
                                    <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Icon.PlusIcon className="h-4 w-4 mr-2" />
                                )}
                                Crear API
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}