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
import { EmpresasService, Empresa } from "@/services/empresa.service"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface UpdateEmpresaModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    empresa: Empresa | null
    onSuccess?: () => void
}

const empresaSchema = z.object({
    nombre: z
        .string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

    rut: z
        .string()
        .min(8, "RUT inválido")
        .max(20, "RUT demasiado largo")
        .transform((val) => val.replace(/\./g, ""))
        .refine((val) => /^[0-9]+-[0-9kK]$/.test(val), {
            message: "Formato de RUT inválido (ej: 12345678-9)",
        }),

    status: z.enum(["ACTIVO", "INACTIVO"]),
})

type EmpresaFormValues = z.infer<typeof empresaSchema>

export default function UpdateEmpresaModal({
    open,
    onOpenChange,
    empresa,
    onSuccess,
}: UpdateEmpresaModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<EmpresaFormValues>({
        resolver: zodResolver(empresaSchema),
        defaultValues: {
            nombre: "",
            rut: "",
            status: "ACTIVO",
        },
    })

    useEffect(() => {
        if (empresa) {
            form.reset({
                nombre: empresa.nombre,
                rut: empresa.rut_empresa,
                status: empresa.status,
            })
        }
    }, [empresa, form])

    const onSubmit = async (data: EmpresaFormValues) => {
        if (!empresa) return

        setIsLoading(true)

        try {
            await EmpresasService.updateEmpresa(empresa.id, {
                nombre: data.nombre,
                rut: data.rut,
                status: data.status,
            })

            toast.success("Empresa actualizada correctamente")

            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating empresa:", error)
            toast.error("No se pudo actualizar la empresa")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Empresa</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos de la empresa.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <Form.FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Nombre de la Empresa</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input placeholder="Ingrese el nombre" {...field} />
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
                                        <Input placeholder="Ej: 12.345.678-9" {...field} />
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
