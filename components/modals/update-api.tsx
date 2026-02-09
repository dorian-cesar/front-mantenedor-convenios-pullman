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
import { ApisService, type Api } from "@/services/api.service"

interface UpdateApiModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    api: Api | null
    onSuccess?: () => void
}

export const apiSchema = z.object({
    nombre: z.string()
        .min(1, "El nombre es requerido")
        .max(100, "El nombre no puede exceder los 100 caracteres"),
    endpoint: z.string()
        .min(1, "El endpoint es requerido")
        .max(500, "El endpoint no puede exceder los 500 caracteres"),
    status: z.enum(["ACTIVO", "INACTIVO"]),
})

export type ApiFormValues = z.infer<typeof apiSchema>

export default function UpdateApiModal({
    open,
    onOpenChange,
    api,
    onSuccess,
}: UpdateApiModalProps) {
    const [loading, setLoading] = React.useState(false)

    const form = useForm<ApiFormValues>({
        resolver: zodResolver(apiSchema),
        mode: "onChange",
        defaultValues: {
            nombre: "",
            endpoint: "",
            status: "ACTIVO",
        },
    })

    React.useEffect(() => {
        if (open && api) {
            form.reset({
                nombre: api.nombre,
                endpoint: api.endpoint,
                status: api.status,
            })
        }
    }, [api, open, form])

    const onSubmit = async (data: ApiFormValues) => {
        if (!api) return
        setLoading(true)
        try {
            await ApisService.updateApi(api.id, {
                nombre: data.nombre,
                endpoint: data.endpoint,
                status: data.status,
            })
            toast.success("API actualizada correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("No se pudo actualizar la API")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar API</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos de la API.
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
                                    <Select onValueChange={field.onChange} value={field.value}>
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