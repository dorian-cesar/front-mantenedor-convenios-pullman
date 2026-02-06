"use client"

import * as React from "react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { DescuentosService } from "@/services/descuento.service"

interface Convenio {
    id: number
    nombre: string
}

interface CodigoDescuento {
    id: number
    codigo: string
}

interface Descuento {
    id: number
    // convenio_id: number
    // codigo_descuento_id: number
    porcentaje_descuento: number
    status: "ACTIVO" | "INACTIVO"
}

interface UpdateDescuentoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    descuento: Descuento | null
    // convenios: Convenio[]
    // codigos: CodigoDescuento[]
    onSuccess?: () => void
}

export const descuentoSchema = z.object({
    // convenio_id: z.number().int().positive(),
    // codigo_descuento_id: z.number().int().positive(),
    porcentaje_descuento: z.number().min(1).max(100),
    status: z.enum(["ACTIVO", "INACTIVO"]),
})

export type DescuentoFormValues = z.infer<typeof descuentoSchema>

export default function UpdateDescuentoModal({
    open,
    onOpenChange,
    descuento,
    // convenios,
    // codigos,
    onSuccess,
}: UpdateDescuentoModalProps) {
    const [loading, setLoading] = React.useState(false)
    // const [openConveniosPopover, setOpenConveniosPopover] = React.useState(false)
    // const [openCodigosPopover, setOpenCodigosPopover] = React.useState(false)

    const [porcentajeInput, setPorcentajeInput] = React.useState("")

    const form = useForm<DescuentoFormValues>({
        resolver: zodResolver(descuentoSchema),
        mode: "onChange",
        defaultValues: {
            // convenio_id: undefined,
            // codigo_descuento_id: undefined,
            porcentaje_descuento: undefined,
            status: "ACTIVO",
        },
    })

    // const convenioSeleccionadoId = form.watch("convenio_id")
    // const convenioSeleccionado = convenios.find(c => c.id === convenioSeleccionadoId)

    // const codigoSeleccionadoId = form.watch("codigo_descuento_id")
    // const codigoSeleccionado = codigos.find(c => c.id === codigoSeleccionadoId)

    React.useEffect(() => {
        if (open && descuento) {
            form.reset({
                // convenio_id: descuento.convenio_id,
                // codigo_descuento_id: descuento.codigo_descuento_id,
                porcentaje_descuento: descuento.porcentaje_descuento,
                status: descuento.status,
            })
            setPorcentajeInput(descuento.porcentaje_descuento.toString())
        }
    }, [descuento, open, form])

    React.useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "porcentaje_descuento" && value.porcentaje_descuento !== undefined) {
                setPorcentajeInput(value.porcentaje_descuento.toString())
            }
        })
        return () => subscription.unsubscribe()
    }, [form])

    const onSubmit = async (data: DescuentoFormValues) => {
        if (!descuento) return
        setLoading(true)
        try {
            await DescuentosService.updateDescuento(descuento.id, {
                // convenio_id: data.convenio_id,
                // codigo_descuento_id: data.codigo_descuento_id,
                porcentaje_descuento: data.porcentaje_descuento,
                status: data.status,
            })
            toast.success("Descuento actualizado correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("No se pudo actualizar el descuento")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Descuento</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del descuento.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* <Form.FormField
                            control={form.control}
                            name="convenio_id"
                            render={({ field }) => (
                                <Form.FormItem className="flex flex-col">
                                    <Form.FormLabel>Convenio</Form.FormLabel>
                                    <Popover open={openConveniosPopover} onOpenChange={setOpenConveniosPopover}>
                                        <PopoverTrigger asChild>
                                            <Form.FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openConveniosPopover}
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {convenioSeleccionado
                                                        ? convenioSeleccionado.nombre
                                                        : "Seleccionar convenio"}
                                                    <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </Form.FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[462px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar convenio..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontró el convenio.</CommandEmpty>
                                                    <CommandGroup>
                                                        {convenios.map((c, idx) => (
                                                            <CommandItem
                                                                key={`${c.id}-${idx}`}
                                                                value={c.nombre}
                                                                onSelect={() => {
                                                                    field.onChange(c.id)
                                                                    setOpenConveniosPopover(false)
                                                                }}
                                                            >
                                                                <Icon.CheckIcon
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        c.id === field.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {c.nombre}
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
                            name="codigo_descuento_id"
                            render={({ field }) => (
                                <Form.FormItem className="flex flex-col">
                                    <Form.FormLabel>Código Descuento</Form.FormLabel>
                                    <Popover open={openCodigosPopover} onOpenChange={setOpenCodigosPopover}>
                                        <PopoverTrigger asChild>
                                            <Form.FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCodigosPopover}
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {codigoSeleccionado ? codigoSeleccionado.codigo : "Seleccionar código"}
                                                    <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </Form.FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[462px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar código..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontró el código.</CommandEmpty>
                                                    <CommandGroup>
                                                        {codigos.map((c, idx) => (
                                                            <CommandItem
                                                                key={`${c.id}-${idx}`}
                                                                value={c.codigo}
                                                                onSelect={() => {
                                                                    field.onChange(c.id)
                                                                    setOpenCodigosPopover(false)
                                                                }}
                                                            >
                                                                <Icon.CheckIcon
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        c.id === field.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {c.codigo}
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
                        /> */}

                        <Form.FormField
                            control={form.control}
                            name="porcentaje_descuento"
                            render={({ field }) => (
                                <Form.FormItem className="flex flex-col">
                                    <Form.FormLabel>Porcentaje Descuento</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={porcentajeInput}
                                            onChange={(e) => {
                                                const val = e.target.value

                                                setPorcentajeInput(val)

                                                if (val === "") {
                                                    field.onChange(undefined)
                                                } else {
                                                    const num = Number(val)
                                                    if (!isNaN(num) && num >= 0 && num <= 100) {
                                                        field.onChange(num)
                                                    }
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value
                                                if (val === "") {
                                                    setPorcentajeInput("")
                                                    field.onChange(undefined)
                                                } else {
                                                    const num = Number(val)
                                                    if (isNaN(num) || num < 1 || num > 100) {
                                                        const prevValue = field.value
                                                        setPorcentajeInput(prevValue ? prevValue.toString() : "")
                                                    }
                                                }
                                            }}
                                            placeholder="Ej: 10"
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
