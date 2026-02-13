"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import * as Form from "@/components/ui/form"
import * as Icon from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
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
    apis: Array<{ id: number; nombre: string }>
    onSuccess?: () => void
}

export const convenioSchema = z.object({
    nombre: z.string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

    empresa_id: z.union([z.number(), z.null()]).optional(),

    status: z.enum(["ACTIVO", "INACTIVO"]),

    tipo_consulta: z.enum(
        ["CODIGO_DESCUENTO", "API_EXTERNA"],
        { message: "Debe seleccionar un tipo de consulta" }
    ),

    codigo: z.string().optional(),

    // Changed to string for input handling
    porcentaje_descuento: z.string().optional(),
    api_consulta_id: z.number().optional().nullable(),

    // Changed to string for input handling
    tope_monto_ventas: z.string().optional(),

    // Changed to string for input handling
    tope_cantidad_tickets: z.string().optional(),

    limitar_por_stock: z
        .boolean()
        .nullable()
        .optional(),

    limitar_por_monto: z
        .boolean()
        .nullable()
        .optional(),
})
    .refine((data) => {
        if (data.tipo_consulta === "CODIGO_DESCUENTO") {
            return data.codigo && data.codigo.length >= 3;
        }
        return true;
    }, {
        message: "El código debe tener al menos 3 caracteres",
        path: ["codigo"],
    })
    .refine((data) => {
        if (data.tipo_consulta === "CODIGO_DESCUENTO") {
            return data.codigo && /^[A-Z0-9]+$/.test(data.codigo);
        }
        return true;
    }, {
        message: "El código debe estar en mayúsculas y sin espacios",
        path: ["codigo"],
    })
    .refine((data) => {
        if (data.tipo_consulta === "API_EXTERNA") {
            return data.api_consulta_id && data.api_consulta_id > 0;
        }
        return true;
    }, {
        message: "Debe seleccionar una API",
        path: ["api_consulta_id"],
    })
    .refine((data) => {
        if (data.porcentaje_descuento) {
            const val = Number(data.porcentaje_descuento);
            return !isNaN(val) && val >= 0 && val <= 100;
        }
        return true;
    }, {
        message: "Debe ingresar un porcentaje de descuento válido (0-100)",
        path: ["porcentaje_descuento"],
    })
    .refine((data) => {
        if (data.tope_monto_ventas) {
            const val = Number(data.tope_monto_ventas);
            return !isNaN(val) && val > 0;
        }
        return true;
    }, {
        message: "El monto debe ser mayor a 0",
        path: ["tope_monto_ventas"],
    })
    .refine((data) => {
        if (data.tope_cantidad_tickets) {
            const val = Number(data.tope_cantidad_tickets);
            return !isNaN(val) && val > 0;
        }
        return true;
    }, {
        message: "La cantidad debe ser mayor a 0",
        path: ["tope_cantidad_tickets"],
    });

export const descuentoSchema = z.object({
    porcentaje_descuento: z.string()
        .min(1, "El porcentaje es requerido")
        .refine((val) => {
            const num = Number(val)
            return !isNaN(num) && num >= 1 && num <= 100
        }, "El porcentaje debe ser entre 1 y 100"),
    status: z.enum(["ACTIVO", "INACTIVO"]),
})

export type DescuentoFormValues = z.infer<typeof descuentoSchema>
type ConvenioFormValues = z.infer<typeof convenioSchema>

export default function UpdateConvenioModal({
    open,
    onOpenChange,
    convenio,
    empresas,
    apis,
    onSuccess,
}: UpdateConvenioModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [openEmpresaPopover, setOpenEmpresaPopover] = useState(false)
    const [openApiPopover, setOpenApiPopover] = useState(false)

    const form = useForm<ConvenioFormValues>({
        resolver: zodResolver(convenioSchema),
        mode: "onChange",
        defaultValues: {
            nombre: "",
            empresa_id: null,
            status: "ACTIVO",
            tipo_consulta: "CODIGO_DESCUENTO",
            codigo: "",
            porcentaje_descuento: "",
            tope_monto_ventas: "",
            tope_cantidad_tickets: "",
            api_consulta_id: undefined,
            limitar_por_stock: undefined,
            limitar_por_monto: undefined,
        },
    })

    const tipoConsulta = form.watch("tipo_consulta")
    const empresaSeleccionadaId = form.watch("empresa_id")
    const empresaSeleccionada = empresas.find(
        (empresa) => empresa.id === empresaSeleccionadaId
    )

    const apiSeleccionadaId = form.watch("api_consulta_id")
    const apiSeleccionada = apis.find(
        (api) => api.id === apiSeleccionadaId
    )

    useEffect(() => {
        if (convenio) {
            form.reset({
                nombre: convenio.nombre || "",
                empresa_id: convenio.empresa_id || null,
                status: convenio.status || "ACTIVO",
                tipo_consulta: convenio.tipo_consulta || "CODIGO_DESCUENTO",
                codigo: convenio.codigo || "",
                // Convert numbers to strings for input handling
                porcentaje_descuento: convenio.porcentaje_descuento?.toString() || "",
                tope_monto_ventas: convenio.tope_monto_ventas?.toString() || "",
                tope_cantidad_tickets: convenio.tope_cantidad_tickets?.toString() || "",

                api_consulta_id: convenio.api_consulta_id ?? undefined,
                limitar_por_stock: convenio.limitar_por_stock ?? undefined,
                limitar_por_monto: convenio.limitar_por_monto ?? undefined,
            })
        }
        setOpenEmpresaPopover(false)
        setOpenApiPopover(false)
    }, [convenio, form])

    useEffect(() => {
        if (!open) {
            setOpenEmpresaPopover(false)
            setOpenApiPopover(false)
        }
    }, [open])

    const onSubmit = async (data: ConvenioFormValues) => {
        if (!convenio) return

        setIsLoading(true)

        try {
            const updateData = {
                nombre: data.nombre,
                empresa_id: data.empresa_id,
                status: data.status,
                tipo_consulta: data.tipo_consulta,
                codigo: data.codigo,
                // Convert strings back to numbers (or undefined if empty)
                porcentaje_descuento: data.porcentaje_descuento ? Number(data.porcentaje_descuento) : undefined,
                tope_monto_ventas: data.tope_monto_ventas ? Number(data.tope_monto_ventas) : undefined,
                tope_cantidad_tickets: data.tope_cantidad_tickets ? Number(data.tope_cantidad_tickets) : undefined,

                api_consulta_id: data.api_consulta_id,
                limitar_por_stock: data.limitar_por_stock,
                limitar_por_monto: data.limitar_por_monto,
            }

            await ConveniosService.updateConvenio(convenio.id, updateData)

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
            <Dialog.DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                <Form.FormItem className="flex flex-col">
                                    <Form.FormLabel>Empresa Asociada (Opcional)</Form.FormLabel>
                                    <Popover open={openEmpresaPopover} onOpenChange={setOpenEmpresaPopover}>
                                        <PopoverTrigger asChild>
                                            <Form.FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openEmpresaPopover}
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {empresaSeleccionada
                                                        ? empresaSeleccionada.nombre
                                                        : field.value === null
                                                            ? "Sin empresa"
                                                            : "Seleccionar empresa"}
                                                    <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </Form.FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar empresa..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontró la empresa.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="null"
                                                            onSelect={() => {
                                                                field.onChange(null)
                                                                setOpenEmpresaPopover(false)
                                                            }}
                                                        >
                                                            <Icon.CheckIcon
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value === null
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            Sin empresa
                                                        </CommandItem>
                                                        {empresas.map((empresa) => (
                                                            <CommandItem
                                                                key={empresa.id}
                                                                value={empresa.nombre}
                                                                onSelect={() => {
                                                                    field.onChange(empresa.id)
                                                                    setOpenEmpresaPopover(false)
                                                                }}
                                                            >
                                                                <Icon.CheckIcon
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        empresa.id === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {empresa.nombre}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
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

                        <Form.FormField
                            control={form.control}
                            name="tipo_consulta"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Tipo de consulta</Form.FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <Form.FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar tipo de consulta" />
                                            </SelectTrigger>
                                        </Form.FormControl>
                                        <SelectContent>
                                            <SelectItem value="CODIGO_DESCUENTO">Código descuento</SelectItem>
                                            <SelectItem value="API_EXTERNA">API</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        {(form.watch("tipo_consulta") === "API_EXTERNA" ? (
                            <Form.FormField
                                control={form.control}
                                name="api_consulta_id"
                                render={({ field }) => (
                                    <Form.FormItem className="flex flex-col">
                                        <Form.FormLabel>API</Form.FormLabel>
                                        <Popover open={openApiPopover} onOpenChange={setOpenApiPopover}>
                                            <PopoverTrigger asChild>
                                                <Form.FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openApiPopover}
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {apiSeleccionada
                                                            ? apiSeleccionada.nombre
                                                            : "Seleccionar API"}
                                                        <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </Form.FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[462px] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Buscar API..."
                                                        className={cn("outline-none")}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>No se encontró la API.</CommandEmpty>
                                                        <CommandGroup>
                                                            {apis.map((api) => (
                                                                <CommandItem
                                                                    key={api.id}
                                                                    value={api.nombre}
                                                                    onSelect={() => {
                                                                        field.onChange(api.id)
                                                                        setOpenApiPopover(false)
                                                                    }}
                                                                >
                                                                    <Icon.CheckIcon
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            api.id === field.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {api.nombre}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                        ) : form.watch("tipo_consulta") === "CODIGO_DESCUENTO" ? (
                            <Form.FormField
                                control={form.control}
                                name="codigo"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Código de descuento</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="Ingrese el código de descuento" {...field} value={field.value || ""} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        ) : null)}

                        <Form.FormField
                            control={form.control}
                            name="porcentaje_descuento"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Porcentaje de descuento</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input
                                            {...field}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="Ej: 15"
                                            value={field.value || ""}
                                        />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />


                        <Form.FormField
                            control={form.control}
                            name="limitar_por_stock"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Limitar por stock</Form.FormLabel>
                                    <Select
                                        value={
                                            field.value === null || field.value === undefined
                                                ? ""
                                                : field.value
                                                    ? "true"
                                                    : "false"
                                        }
                                        onValueChange={(value) => {
                                            if (value === "") {
                                                field.onChange(null);
                                            } else {
                                                field.onChange(value === "true");
                                            }
                                        }}
                                    >
                                        <Form.FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                        </Form.FormControl>
                                        <SelectContent>
                                            <SelectItem value="true">Limitar</SelectItem>
                                            <SelectItem value="false">No limitar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        {form.watch("limitar_por_stock") === true && (
                            <Form.FormField
                                control={form.control}
                                name="tope_cantidad_tickets"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Tope cantidad tickets</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input
                                                {...field}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Ej: 50"
                                                value={field.value || ""}
                                            />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        )}


                        <Form.FormField
                            control={form.control}
                            name="limitar_por_monto"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Limitar por monto</Form.FormLabel>
                                    <Select
                                        value={
                                            field.value === null || field.value === undefined
                                                ? ""
                                                : field.value
                                                    ? "true"
                                                    : "false"
                                        }
                                        onValueChange={(value) => {
                                            if (value === "") {
                                                field.onChange(null);
                                            } else {
                                                field.onChange(value === "true");
                                            }
                                        }}
                                    >
                                        <Form.FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                        </Form.FormControl>
                                        <SelectContent>
                                            <SelectItem value="true">Limitar</SelectItem>
                                            <SelectItem value="false">No limitar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        {form.watch("limitar_por_monto") === true && (
                            <Form.FormField
                                control={form.control}
                                name="tope_monto_ventas"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Tope monto ventas</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input
                                                {...field}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Ej: 1000000"
                                                value={field.value || ""}
                                            />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        )}

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
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
