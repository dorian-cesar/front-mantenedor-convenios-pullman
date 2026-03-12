"use client"

import { useState, useEffect } from "react"
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
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { CodigosDescuentoService } from "@/services/codigo-descuento.service"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
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
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface AddCodigoDescuentoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export const codigoDescuentoSchema = z.object({
    convenio_id: z
        .number()
        .positive("Debe seleccionar un convenio"),

    codigo: z
        .string()
        .min(3, "El código debe tener al menos 3 caracteres")
        .max(50, "El código es demasiado largo")
        .regex(/^[A-Z0-9_]+$/, "Solo mayúsculas, números y guiones bajos"),

    fecha_inicio: z
        .string()
        .min(1, "Debe seleccionar fecha de inicio"),

    fecha_termino: z
        .string()
        .min(1, "Debe seleccionar fecha de término"),

    max_usos: z
        .number()
        .min(1, "Debe ser al menos 1")
        .max(9_999_999, "Máximo 9,999,999 usos"),
}).refine(
    (data) => {
        const inicio = new Date(data.fecha_inicio)
        const termino = new Date(data.fecha_termino)
        return termino > inicio
    },
    {
        message: "La fecha de término debe ser posterior a la de inicio",
        path: ["fecha_termino"],
    }
)
export type CodigoDescuentoFormValues = z.infer<typeof codigoDescuentoSchema>

export default function AddCodigoDescuentoModal({
    open,
    onOpenChange,
    onSuccess,
}: AddCodigoDescuentoModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [isLoadingConvenios, setIsLoadingConvenios] = useState(true)
    const [openConvenioPopover, setOpenConvenioPopover] = useState(false)

    const form = useForm<CodigoDescuentoFormValues>({
        resolver: zodResolver(codigoDescuentoSchema),
        defaultValues: {
            convenio_id: undefined,
            codigo: "",
            fecha_inicio: "",
            fecha_termino: "",
            max_usos: 100,
        },
    })

    useEffect(() => {
        if (open) {
            fetchConvenios()
        }
    }, [open])

    const fetchConvenios = async () => {
        setIsLoadingConvenios(true)
        try {
            const response = await ConveniosService.getConvenios({
                page: 1,
                limit: 100,
                status: "ACTIVO"
            })
            setConvenios(response.rows.filter(c => c.tipo_consulta === "CODIGO_DESCUENTO"))
        } catch (error) {
            console.error(error)
            toast.error("No se pudieron cargar los convenios")
        } finally {
            setIsLoadingConvenios(false)
        }
    }

    useEffect(() => {
        if (!open) {
            form.reset()
            setOpenConvenioPopover(false)
        }
    }, [open, form])

    const onSubmit = async (data: CodigoDescuentoFormValues) => {
        setIsLoading(true)

        try {
            await CodigosDescuentoService.createCodigoDescuento({
                convenio_id: data.convenio_id,
                codigo: data.codigo,
                fecha_inicio: data.fecha_inicio,
                fecha_termino: data.fecha_termino,
                max_usos: data.max_usos,
            })

            toast.success("Código de descuento creado correctamente")
            form.reset()
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            const errorMessage = error.response?.data?.message || "No se pudo crear el código de descuento"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDateChange = (field: "fecha_inicio" | "fecha_termino", date: Date | undefined) => {
        if (date) {
            form.setValue(field, format(date, "yyyy-MM-dd"))
        } else {
            form.setValue(field, "")
        }
    }

    const convenioSeleccionadoId = form.watch("convenio_id")
    const convenioSeleccionado = convenios.find(c => c.id === convenioSeleccionadoId)

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="sm:max-w-[550px]">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Agregar Nuevo Código de Descuento</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Complete los datos del nuevo código de descuento.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Form.FormField
                            control={form.control}
                            name="convenio_id"
                            render={({ field }) => (
                                <Form.FormItem className="flex flex-col">
                                    <Form.FormLabel>Convenio</Form.FormLabel>
                                    <Popover open={openConvenioPopover} onOpenChange={setOpenConvenioPopover}>
                                        <PopoverTrigger asChild>
                                            <Form.FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    disabled={isLoadingConvenios}
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {convenioSeleccionado 
                                                        ? `${convenioSeleccionado.nombre}${convenioSeleccionado.empresa ? ` - ${convenioSeleccionado.empresa.nombre}` : ""}`
                                                        : "Seleccionar convenio"}
                                                    <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </Form.FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[500px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Buscar convenio..." />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        {isLoadingConvenios ? "Cargando convenios..." : "No se encontró el convenio."}
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {convenios.map((c) => (
                                                            <CommandItem
                                                                key={c.id}
                                                                value={`${c.nombre} ${c.empresa?.nombre || ""}`}
                                                                onSelect={() => {
                                                                    field.onChange(c.id)
                                                                    setOpenConvenioPopover(false)
                                                                }}
                                                            >
                                                                <Icon.CheckIcon
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        c.id === field.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div>
                                                                    <div className="font-medium">{c.nombre}</div>
                                                                    {c.empresa && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {c.empresa.nombre}
                                                                        </div>
                                                                    )}
                                                                </div>
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
                            name="codigo"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Código</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input
                                            placeholder="Ej: VERANO2024"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                        />
                                    </Form.FormControl>
                                    <Form.FormDescription>
                                        Solo mayúsculas, números y guiones bajos
                                    </Form.FormDescription>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Form.FormField
                                control={form.control}
                                name="fecha_inicio"
                                render={({ field }) => (
                                    <Form.FormItem className="flex flex-col">
                                        <Form.FormLabel>Fecha Inicio</Form.FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Form.FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(new Date(field.value), "PPP", { locale: es })
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <Icon.CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </Form.FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value ? new Date(field.value) : undefined}
                                                    onSelect={(date) => handleDateChange("fecha_inicio", date)}
                                                    initialFocus
                                                    locale={es}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />

                            <Form.FormField
                                control={form.control}
                                name="fecha_termino"
                                render={({ field }) => (
                                    <Form.FormItem className="flex flex-col">
                                        <Form.FormLabel>Fecha Término</Form.FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Form.FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(new Date(field.value), "PPP", { locale: es })
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <Icon.CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </Form.FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value ? new Date(field.value) : undefined}
                                                    onSelect={(date) => handleDateChange("fecha_termino", date)}
                                                    initialFocus
                                                    locale={es}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>

                        <Form.FormField
                            control={form.control}
                            name="max_usos"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Máximo de usos</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Ej: 100"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        {convenioSeleccionado && (
                            <div className="rounded-lg border p-3 bg-muted/50">
                                <h4 className="font-medium mb-2">Información del Convenio</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Nombre:</span>
                                        <p className="font-medium">{convenioSeleccionado.nombre}</p>
                                    </div>
                                    {convenioSeleccionado.empresa && (
                                        <div>
                                            <span className="text-muted-foreground">Empresa:</span>
                                            <p className="font-medium">{convenioSeleccionado.empresa.nombre}</p>
                                        </div>
                                    )}
                                    {convenioSeleccionado.tope_monto_descuento && (
                                        <div>
                                            <span className="text-muted-foreground">Tope ventas:</span>
                                            <p className="font-medium">${convenioSeleccionado.tope_monto_descuento.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {convenioSeleccionado.tope_cantidad_tickets && (
                                        <div>
                                            <span className="text-muted-foreground">Tope tickets:</span>
                                            <p className="font-medium">{convenioSeleccionado.tope_cantidad_tickets}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
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

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Icon.PlusIcon className="h-4 w-4 mr-2" />
                                )}
                                Crear Código
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}