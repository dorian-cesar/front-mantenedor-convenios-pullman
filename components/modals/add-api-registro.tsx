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
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ApisRegistroService } from "@/services/api-registro.service"

interface Empresa {
    id: number
    nombre: string
}

interface AddApiRegistroModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    empresas: Empresa[]
}

const schema = z.object({
    nombre: z.string().min(1, "El nombre es requerido").max(100),
    endpoint: z.string().min(1, "El endpoint es requerido").max(500),
    empresa_id: z.number().positive("Debe seleccionar una empresa"),
    status: z.enum(["ACTIVO", "INACTIVO"]),
})

type FormValues = z.infer<typeof schema>

export default function AddApiRegistroModal({ open, onOpenChange, onSuccess, empresas }: AddApiRegistroModalProps) {
    const [loading, setLoading] = React.useState(false)
    const [openEmpresaPopover, setOpenEmpresaPopover] = React.useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: { nombre: "", endpoint: "", empresa_id: undefined, status: "ACTIVO" },
    })

    const empresaSeleccionadaId = form.watch("empresa_id")
    const empresaSeleccionada = empresas.find(e => e.id === empresaSeleccionadaId)

    React.useEffect(() => {
        if (!open) {
            form.reset()
            setOpenEmpresaPopover(false)
        }
    }, [open, form])

    const onSubmit = async (data: FormValues) => {
        setLoading(true)
        try {
            await ApisRegistroService.createApiRegistro(data)
            toast.success("API de Registro creada correctamente")
            form.reset()
            onSuccess?.()
            onOpenChange(false)
        } catch {
            toast.error("No se pudo crear la API de Registro")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Agregar API de Registro</Dialog.DialogTitle>
                    <Dialog.DialogDescription>Complete los datos para agregar una nueva API de Registro de beneficiarios.</Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <Form.FormField control={form.control} name="nombre" render={({ field }) => (
                            <Form.FormItem>
                                <Form.FormLabel>Nombre</Form.FormLabel>
                                <Form.FormControl><Input {...field} placeholder="Ej: API Registro Universitarios" maxLength={100} /></Form.FormControl>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        <Form.FormField control={form.control} name="endpoint" render={({ field }) => (
                            <Form.FormItem>
                                <Form.FormLabel>Endpoint</Form.FormLabel>
                                <Form.FormControl><Input {...field} placeholder="Ej: /api/beneficiarios" maxLength={500} /></Form.FormControl>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        <Form.FormField control={form.control} name="empresa_id" render={({ field }) => (
                            <Form.FormItem className="flex flex-col">
                                <Form.FormLabel>Empresa</Form.FormLabel>
                                <Popover open={openEmpresaPopover} onOpenChange={setOpenEmpresaPopover}>
                                    <PopoverTrigger asChild>
                                        <Form.FormControl>
                                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                {empresaSeleccionada ? empresaSeleccionada.nombre : "Seleccionar empresa"}
                                                <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </Form.FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar empresa..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontró.</CommandEmpty>
                                                <CommandGroup>
                                                    {empresas.map(e => (
                                                        <CommandItem key={e.id} value={e.nombre}
                                                            onSelect={() => { field.onChange(e.id); setOpenEmpresaPopover(false) }}>
                                                            <Icon.CheckIcon className={cn("mr-2 h-4 w-4", e.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {e.nombre}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        <Form.FormField control={form.control} name="status" render={({ field }) => (
                            <Form.FormItem>
                                <Form.FormLabel>Estado</Form.FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <Form.FormControl><SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger></Form.FormControl>
                                    <SelectContent>
                                        <SelectItem value="ACTIVO">Activo</SelectItem>
                                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
                            <Button type="submit" disabled={loading || !form.formState.isValid}>
                                {loading ? <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : <Icon.PlusIcon className="h-4 w-4 mr-2" />}
                                Crear API
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
