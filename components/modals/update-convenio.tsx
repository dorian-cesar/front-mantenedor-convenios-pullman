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
import { ConveniosService, Convenio } from "@/services/convenio.service"
import { Empresa } from "@/services/empresa.service"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface UpdateConvenioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    convenio: Convenio | null
    empresas: Empresa[]
    onSuccess?: () => void
}

const convenioSchema = z.object({
    nombre: z
        .string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

    empresa_id: z
        .union([z.number(), z.null()])
        .optional()
        .refine((val) => val !== undefined, {
            message: "Debe seleccionar una empresa",
        }),

    status: z.enum(["ACTIVO", "INACTIVO"]),
})

type ConvenioFormValues = z.infer<typeof convenioSchema>

export default function UpdateConvenioModal({
    open,
    onOpenChange,
    convenio,
    empresas,
    onSuccess,
}: UpdateConvenioModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<ConvenioFormValues>({
        resolver: zodResolver(convenioSchema),
        defaultValues: {
            nombre: "",
            empresa_id: null,
            status: "ACTIVO",
        },
    })

    useEffect(() => {
        if (convenio) {
            form.reset({
                nombre: convenio.nombre,
                empresa_id: convenio.empresa_id,
                status: convenio.status,
            })
        }
    }, [convenio, form])

    const onSubmit = async (data: ConvenioFormValues) => {
        if (!convenio) return

        setIsLoading(true)

        try {
            await ConveniosService.updateConvenio(convenio.id, {
                nombre: data.nombre,
                empresa_id: data.empresa_id,
                status: data.status,
            })

            toast.success("Convenio actualizado correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating convenio:", error)
            toast.error("No se pudo actualizar el convenio")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Convenio</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del convenio.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Form.FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Nombre del Convenio</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input placeholder="Ingrese el nombre del convenio" {...field} />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <Form.FormField
                            control={form.control}
                            name="empresa_id"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Empresa Asociada (Opcional)</Form.FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(value === "null" ? null : Number(value))}
                                        value={field.value === null ? "null" : String(field.value)}
                                    >
                                        <Form.FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione una empresa" />
                                            </SelectTrigger>
                                        </Form.FormControl>
                                        <SelectContent>
                                            <SelectItem value="null">Sin empresa</SelectItem>
                                            {empresas.map((empresa) => (
                                                <SelectItem key={empresa.id} value={String(empresa.id)}>
                                                    {empresa.nombre}
                                                </SelectItem>
                                            ))}
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

                        <div className="flex justify-end space-x-2">
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