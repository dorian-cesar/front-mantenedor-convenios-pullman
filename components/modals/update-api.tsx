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
import { ApisService, type Api } from "@/services/api.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"

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
    empresa_id: z.number().nullable(),
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
    const [empresas, setEmpresas] = React.useState<Empresa[]>([])
    const [openEmpresaPopover, setOpenEmpresaPopover] = React.useState(false)

    const form = useForm<ApiFormValues>({
        resolver: zodResolver(apiSchema),
        mode: "onChange",
        defaultValues: {
            nombre: "",
            endpoint: "",
            empresa_id: null,
            status: "ACTIVO",
        },
    })

    const empresaSeleccionadaId = form.watch("empresa_id")
    const empresaSeleccionada = empresas.find(e => e.id === empresaSeleccionadaId)

    React.useEffect(() => {
        EmpresasService.getEmpresas({ page: 1, limit: 200, status: "ACTIVO" })
            .then(r => setEmpresas(r.rows))
            .catch(() => console.error("No se pudieron cargar las empresas"))
    }, [])

    React.useEffect(() => {
        if (open && api) {
            form.reset({
                nombre: api.nombre,
                endpoint: api.endpoint,
                empresa_id: api.empresa?.id ?? null,
                status: api.status,
            })
            setOpenEmpresaPopover(false)
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
                empresa_id: data.empresa_id,
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

                        <Form.FormField control={form.control} name="empresa_id" render={({ field }) => (
                            <Form.FormItem className="flex flex-col">
                                <Form.FormLabel>Empresa</Form.FormLabel>
                                <Popover open={openEmpresaPopover} onOpenChange={setOpenEmpresaPopover}>
                                    <PopoverTrigger asChild>
                                        <Form.FormControl>
                                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                {empresaSeleccionada ? empresaSeleccionada.nombre : "Sin empresa (Público)"}
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
                                                    <CommandItem
                                                        value="Sin empresa"
                                                        onSelect={() => {
                                                            field.onChange(null)
                                                            setOpenEmpresaPopover(false)
                                                        }}
                                                    >
                                                        <Icon.CheckIcon className={cn("mr-2 h-4 w-4", field.value === null ? "opacity-100" : "opacity-0")} />
                                                        Sin empresa (Público)
                                                    </CommandItem>
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