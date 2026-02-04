"use client"

import { useEffect, useState } from "react"
import * as Dialog from "@/components/ui/dialog"
import * as Form from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import * as Icon from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { PasajerosService } from "@/services/pasajero.service"
import type { Empresa } from "@/services/empresa.service"
import type { Convenio } from "@/services/convenio.service"

interface AddPasajeroModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    empresas: Empresa[]
    convenios: Convenio[]
    tiposPasajero: { id: number; nombre: string }[]
}

const pasajeroSchema = z.object({
    rut: z
        .string()
        .min(8, "RUT inválido")
        .transform(v => v.replace(/\./g, ""))
        .refine(v => /^[0-9]+-[0-9kK]$/.test(v), {
            message: "Formato de RUT inválido (ej: 12345678-9)",
        }),

    nombres: z.string().min(2, "Nombre muy corto").optional(),
    apellidos: z.string().min(2, "Apellido muy corto").optional(),

    fecha_nacimiento: z.string().optional(),

    correo: z.string().email("Correo inválido").optional(),

    telefono: z
        .string()
        .min(6, "Teléfono inválido")
        .optional(),

    tipo_pasajero_id: z.number().optional(),
    empresa_id: z.number().optional(),
    convenio_id: z.number().optional(),

    status: z.enum(["ACTIVO", "INACTIVO"]),
})

type PasajeroFormValues = z.infer<typeof pasajeroSchema>

export default function AddPasajeroModal({
    open,
    onOpenChange,
    onSuccess,
    empresas,
    convenios,
    tiposPasajero,
}: AddPasajeroModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<PasajeroFormValues>({
        resolver: zodResolver(pasajeroSchema),
        shouldUnregister: false,
        defaultValues: {
            rut: "",
            nombres: "",
            apellidos: "",
            fecha_nacimiento: "",
            correo: "",
            telefono: "",
            tipo_pasajero_id: undefined,
            empresa_id: undefined,
            convenio_id: undefined,
            status: "ACTIVO",
        },
    })

    useEffect(() => {
        if (!open) {
            form.reset()
        }
    }, [open, form])

    const onSubmit = async (data: PasajeroFormValues) => {
        setIsLoading(true)

        try {
            await PasajerosService.createPasajero({
                ...data,
                nombres: data.nombres || undefined,
                apellidos: data.apellidos || undefined,
                correo: data.correo || undefined,
                telefono: data.telefono || undefined,
                fecha_nacimiento: data.fecha_nacimiento || undefined,
            })

            toast.success("Pasajero creado correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error creating pasajero:", error)
            toast.error("No se pudo crear el pasajero")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Nuevo Pasajero</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Ingrese los datos del pasajero.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* RUT */}
                        <Form.FormField
                            control={form.control}
                            name="rut"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>RUT *</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input placeholder="12345678-9" {...field} />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Nombres */}
                            <Form.FormField
                                control={form.control}
                                name="nombres"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Nombres</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            {/* Apellidos */}
                            <Form.FormField
                                control={form.control}
                                name="apellidos"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Apellidos</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>

                        {/* Fecha nacimiento */}
                        <Form.FormField
                            control={form.control}
                            name="fecha_nacimiento"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Fecha de nacimiento</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input type="date" {...field} />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Correo */}
                            <Form.FormField
                                control={form.control}
                                name="correo"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Correo</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input type="email" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            {/* Teléfono */}
                            <Form.FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Teléfono</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>

                        {/* Tipo pasajero */}
                        <Form.FormField
                            control={form.control}
                            name="tipo_pasajero_id"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Tipo de pasajero</Form.FormLabel>
                                    <Select
                                        onValueChange={(v) => field.onChange(Number(v))}
                                        value={field.value ? String(field.value) : ""}
                                    >
                                        <Form.FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione tipo" />
                                            </SelectTrigger>
                                        </Form.FormControl>
                                        <SelectContent>
                                            {tiposPasajero.map((t) => (
                                                <SelectItem key={t.id} value={String(t.id)}>
                                                    {t.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Empresa */}
                            <Form.FormField
                                control={form.control}
                                name="empresa_id"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Empresa</Form.FormLabel>
                                        <Select
                                            onValueChange={(v) => field.onChange(Number(v))}
                                            value={field.value ? String(field.value) : ""}
                                        >
                                            <Form.FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione empresa" />
                                                </SelectTrigger>
                                            </Form.FormControl>
                                            <SelectContent>
                                                {empresas.map((e) => (
                                                    <SelectItem key={e.id} value={String(e.id)}>
                                                        {e.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            {/* Convenio */}
                            <Form.FormField
                                control={form.control}
                                name="convenio_id"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Convenio</Form.FormLabel>
                                        <Select
                                            onValueChange={(v) => field.onChange(Number(v))}
                                            value={field.value ? String(field.value) : ""}
                                        >
                                            <Form.FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione convenio" />
                                                </SelectTrigger>
                                            </Form.FormControl>
                                            <SelectContent>
                                                {convenios.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>

                        {/* Estado */}
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

                        <div className="flex justify-end gap-2 pt-2">
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
                                Crear Pasajero
                            </Button>
                        </div>

                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
