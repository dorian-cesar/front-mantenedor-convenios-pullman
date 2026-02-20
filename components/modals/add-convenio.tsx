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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { refine, z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ConveniosService } from "@/services/convenio.service"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Empresa {
    id: number
    nombre: string
}

interface Api {
    id: number
    nombre: string
}

interface AddConvenioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    empresas: Empresa[]
    apis: Api[]
}

export const convenioSchema = z.object({
    nombre: z.string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

    empresa_id: z.number()
        .int("Debe seleccionar una empresa")
        .positive("Debe seleccionar una empresa"),

    tipo_consulta: z.enum(
        ["CODIGO_DESCUENTO", "API_EXTERNA"],
        { message: "Debe seleccionar un tipo de consulta" }
    ),

    codigo: z.string().optional(),
    porcentaje_descuento: z.number().min(0).max(100).optional(),
    api_consulta_id: z.number().optional().nullable(),

    tope_monto_descuento: z
        .number()
        .min(1, "Debe ser mayor a 0")
        .optional(),

    tope_cantidad_tickets: z
        .number()
        .min(1, "Debe ser mayor a 0")
        .optional(),

    limitar_por_stock: z
        .boolean()
        .nullable()
        .optional(),

    limitar_por_monto: z
        .boolean()
        .nullable()
        .optional(),

    beneficio: z
        .boolean(),

    imagenes: z.array(z.string())
        .optional(),

    fecha_inicio: z.string()
        .min(1, "La fecha de inicio es obligatoria"),

    fecha_termino: z.string()
        .min(1, "La fecha de término es obligatoria"),
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
        if (data.porcentaje_descuento !== undefined) {
            return data.porcentaje_descuento >= 0 && data.porcentaje_descuento <= 100;
        }
        return true;
    }, {
        message: "Debe ingresar un porcentaje de descuento válido (0-100)",
        path: ["porcentaje_descuento"],
    })
    .refine((data) => {
        return data.fecha_inicio <= data.fecha_termino;
    }, {
        message: "La fecha de término debe ser posterior a la fecha de inicio",
        path: ["fecha_termino"],
    });

export type ConvenioFormValues = z.infer<typeof convenioSchema>

export default function AddConvenioModal({
    open,
    onOpenChange,
    onSuccess,
    empresas,
    apis
}: AddConvenioModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [openEmpresaPopover, setOpenEmpresaPopover] = useState(false)
    const [openApiPopover, setOpenApiPopover] = useState(false)
    const [imagenesInputs, setImagenesInputs] = useState<string[]>([])

    const form = useForm<ConvenioFormValues>({
        resolver: zodResolver(convenioSchema),
        mode: "onChange",
        defaultValues: {
            nombre: "",                       // texto
            empresa_id: undefined,            // number | undefined
            tipo_consulta: undefined,         // enum | undefined
            codigo: "",                        // texto opcional
            porcentaje_descuento: undefined,   // number opcional
            tope_monto_descuento: undefined,      // number opcional
            tope_cantidad_tickets: undefined,  // number opcional
            api_consulta_id: undefined,        // number | undefined
            limitar_por_stock: undefined,      // boolean | undefined
            limitar_por_monto: undefined,      // boolean | undefined
            beneficio: false,
            imagenes: [],
            fecha_inicio: "",
            fecha_termino: "",
        },
    })


    const empresaSeleccionadaId = form.watch("empresa_id")
    const empresaSeleccionada = empresas.find(
        (empresa) => empresa.id === empresaSeleccionadaId
    )

    const apiSeleccionadaId = form.watch("api_consulta_id")
    const apiSeleccionada = apis.find(
        (api) => api.id === apiSeleccionadaId
    )

    const beneficioValue = form.watch("beneficio")

    useEffect(() => {
        if (!beneficioValue) {
            setImagenesInputs([])
            form.setValue("imagenes", [])
        }
    }, [beneficioValue, form])

    useEffect(() => {
        if (!open) {
            form.reset()
            setOpenEmpresaPopover(false)
            setOpenApiPopover(false)
            setImagenesInputs([])
        }
    }, [open, form])

    const handleAddImagen = () => {
        setImagenesInputs([...imagenesInputs, ""])
    }

    const handleRemoveImagen = (index: number) => {
        const newImagenes = imagenesInputs.filter((_, i) => i !== index)
        setImagenesInputs(newImagenes)
        // Actualizar el array de imágenes en el formulario
        const currentImagenes = form.getValues("imagenes") || []
        form.setValue(
            "imagenes",
            currentImagenes.filter((_, i) => i !== index)
        )
    }

    const handleImagenChange = (index: number, value: string) => {
        const newImagenes = [...imagenesInputs]
        newImagenes[index] = value
        setImagenesInputs(newImagenes)

        // Actualizar el array de imágenes en el formulario
        const currentImagenes = form.getValues("imagenes") || []
        currentImagenes[index] = value
        form.setValue("imagenes", currentImagenes.filter(img => img.trim() !== ""))
    }

    const onSubmit = async (data: ConvenioFormValues) => {
        setIsLoading(true)

        try {
            await ConveniosService.createConvenio({
                nombre: data.nombre,
                empresa_id: data.empresa_id,
                tipo_consulta: data.tipo_consulta,
                codigo: data.codigo || undefined,
                porcentaje_descuento: data.porcentaje_descuento,
                tope_monto_descuento: data.tope_monto_descuento,
                tope_cantidad_tickets: data.tope_cantidad_tickets,
                api_consulta_id: data.api_consulta_id || undefined,
                limitar_por_stock: data.limitar_por_stock || undefined,
                limitar_por_monto: data.limitar_por_monto || undefined,
                beneficio: data.beneficio,
                imagenes: data.imagenes?.filter(img => img.trim() !== "") || [],
                fecha_inicio: data.fecha_inicio,
                fecha_termino: data.fecha_termino,
            })

            toast.success("Convenio creado correctamente")
            form.reset()
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("No se pudo crear el convenio")
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-h-[90vh] overflow-y-auto">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Agregar Nuevo Convenio</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Complete los datos del nuevo convenio.
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
                                    <Form.FormLabel>Empresa</Form.FormLabel>
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
                                                        : "Seleccionar empresa"}
                                                    <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </Form.FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[462px] p-0">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Buscar empresa..."
                                                    className={cn("outline-none")}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No se encontró la empresa.</CommandEmpty>
                                                    <CommandGroup>
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
                            name="tipo_consulta"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Tipo de consulta</Form.FormLabel>
                                    <Select onValueChange={field.onChange}>
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
                                            <Input placeholder="Ingrese el código de descuento" {...field} />
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
                                            type="number"
                                            placeholder="Ej: 10"
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                field.onChange(value === "" ? undefined : Number(value))
                                            }}
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
                                            // Convierte string a boolean o null
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
                                                type="number"
                                                placeholder="Ej: 50"
                                                value={field.value ?? ""} // Muestra vacío si es undefined
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Convierte a número o undefined
                                                    field.onChange(value === "" ? undefined : Number(value));
                                                }}
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
                                            // Convierte string a boolean o null
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
                                name="tope_monto_descuento"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Tope monto ventas</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Ej: 1000000"
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    field.onChange(value === "" ? undefined : Number(value))
                                                }}
                                            />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        )}

                        <Form.FormField
                            control={form.control}
                            name="beneficio"
                            render={({ field }) => (
                                <Form.FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <Form.FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </Form.FormControl>
                                    <div className="space-y-1 leading-none">
                                        <Form.FormLabel className="text-sm font-medium">
                                            ¿Es un beneficio?
                                        </Form.FormLabel>
                                    </div>
                                </Form.FormItem>
                            )}
                        />

                        {/* Campos de imágenes condicionales */}
                        {beneficioValue && (
                            <div className="space-y-4 border rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Imágenes del beneficio</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddImagen}
                                    >
                                        <Icon.PlusIcon className="h-4 w-4 mr-2" />
                                        Agregar imagen
                                    </Button>
                                </div>

                                {imagenesInputs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay imágenes agregadas.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {imagenesInputs.map((imagen, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    placeholder={`Nombre de la imagen ${index + 1}`}
                                                    value={imagen}
                                                    onChange={(e) => handleImagenChange(index, e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveImagen(index)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                                >
                                                    <Icon.Trash2Icon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <Form.FormField
                                control={form.control}
                                name="fecha_inicio"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Fecha de inicio</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            <Form.FormField
                                control={form.control}
                                name="fecha_termino"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Fecha de término</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>


                        <div className="flex justify-end space-x-2">
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
                                    <Icon.PlusIcon className="h-4 w-4 mr-2" />
                                )}
                                Crear Convenio
                            </Button>
                        </div>

                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
