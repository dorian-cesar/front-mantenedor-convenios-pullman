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
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ConveniosService } from "@/services/convenio.service"
import { toast } from "sonner"

interface Empresa {
    id: number
    nombre: string
}

interface AddConvenioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    empresas: Empresa[]
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

    tope_monto_ventas: z
        .number()
        .min(1, "Debe ser mayor a 0")
        .optional(),

    tope_cantidad_tickets: z
        .number()
        .min(1, "Debe ser mayor a 0")
        .optional(),

    status: z.enum(["ACTIVO", "INACTIVO"], {
        message: "Debe seleccionar un estado"
    }),
})

export type ConvenioFormValues = z.infer<typeof convenioSchema>

export default function AddConvenioModal({
    open,
    onOpenChange,
    onSuccess,
    empresas,
}: AddConvenioModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [openEmpresaPopover, setOpenEmpresaPopover] = useState(false)

    const form = useForm<ConvenioFormValues>({
        resolver: zodResolver(convenioSchema),
        mode: "onChange",
        defaultValues: {
            nombre: "",
            empresa_id: undefined,
            tipo_consulta: undefined,
            tope_monto_ventas: undefined,
            tope_cantidad_tickets: undefined,
            status: "ACTIVO",
        },
    })


    const empresaSeleccionadaId = form.watch("empresa_id")
    const empresaSeleccionada = empresas.find(
        (empresa) => empresa.id === empresaSeleccionadaId
    )

    useEffect(() => {
        if (!open) {
            form.reset()
            setOpenEmpresaPopover(false)
        }
    }, [open, form])

    const onSubmit = async (data: ConvenioFormValues) => {
        setIsLoading(true)

        try {
            await ConveniosService.createConvenio({
                nombre: data.nombre,
                empresa_id: data.empresa_id,
                tipo_consulta: data.tipo_consulta,
                tope_monto_ventas: data.tope_monto_ventas,
                tope_cantidad_tickets: data.tope_cantidad_tickets,
                status: data.status,
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
            <Dialog.DialogContent>
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

                        <Form.FormField
                            control={form.control}
                            name="tope_monto_ventas"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Tope monto ventas</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Ej: 1000000"
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
