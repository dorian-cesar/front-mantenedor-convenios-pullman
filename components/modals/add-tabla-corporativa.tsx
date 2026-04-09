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
import { ClienteCorporativoService } from "@/services/cliente-corporativo.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface AddTablaCorporativaModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const tablaSchema = z.object({
    nombre_display: z
        .string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre es demasiado largo"),
    empresa_id: z.string().min(1, "Debe seleccionar una empresa"),
    convenio_id: z.string().optional(),
    nombre_tabla_personalizado: z.string().optional(),
})

type TablaFormValues = z.infer<typeof tablaSchema>

export default function AddTablaCorporativaModal({
    open,
    onOpenChange,
    onSuccess,
}: AddTablaCorporativaModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [openEmpresaPopover, setOpenEmpresaPopover] = useState(false)

    const form = useForm<TablaFormValues>({
        resolver: zodResolver(tablaSchema),
        defaultValues: {
            nombre_display: "",
            empresa_id: "",
            convenio_id: "",
            nombre_tabla_personalizado: "",
        },
    })

    const selectedEmpresaId = form.watch("empresa_id")
    const empresaSeleccionada = empresas.find(e => e.id.toString() === selectedEmpresaId)

    useEffect(() => {
        if (open) {
            fetchInitialData()
        }
    }, [open])

    useEffect(() => {
        if (selectedEmpresaId) {
            // Limpiar convenio seleccionado al cambiar de empresa
            form.setValue("convenio_id", "");
            fetchConvenios(Number(selectedEmpresaId))
        } else {
            setConvenios([])
        }
    }, [selectedEmpresaId])

    const fetchInitialData = async () => {
        setIsLoadingData(true)
        try {
            const resp = await EmpresasService.getEmpresas({ limit: 200, status: "ACTIVO" })
            setEmpresas(resp.rows)
        } catch (error) {
            toast.error("Error al cargar empresas")
        } finally {
            setIsLoadingData(false)
        }
    }

    const fetchConvenios = async (empresaId: number) => {
        setIsLoadingData(true)
        try {
            // Quitamos el filtro de status para que aparezcan todos
            const resp: any = await ConveniosService.getConvenios({ empresa_id: empresaId, limit: 300 })
            // Flexibilidad si el back devuelve array directo o { rows: [] }
            const data = Array.isArray(resp) ? resp : (resp.rows || [])
            setConvenios(data)
            
            if (data.length === 0) {
                console.warn("No se encontraron convenios para la empresa:", empresaId)
            }
        } catch (error) {
            console.error("Error fetching convenios", error)
            toast.error("Error al cargar convenios de la empresa")
        } finally {
            setIsLoadingData(false)
        }
    }

    const onSubmit = async (values: TablaFormValues) => {
        setIsLoading(true)
        try {
            await ClienteCorporativoService.createTabla({
                nombre_display: values.nombre_display,
                empresa_id: Number(values.empresa_id),
                convenio_id: values.convenio_id ? Number(values.convenio_id) : undefined,
                nombre_tabla_personalizado: values.nombre_tabla_personalizado || undefined
            })

            toast.success("Nómina corporativa creada correctamente")
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "No se pudo crear la nómina"
            toast.error(errMsg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="sm:max-w-[500px]">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Nueva Nómina Corporativa</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Crea una nueva tabla física para gestionar la nómina de una empresa.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <Form.FormField
                            control={form.control}
                            name="nombre_display"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Nombre Visible (Público)</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input placeholder="Ej: Nómina Minera Escondida 2024" {...field} />
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
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {empresaSeleccionada
                                                        ? `${empresaSeleccionada.nombre} (${empresaSeleccionada.rut_empresa})`
                                                        : "Seleccione una empresa"}
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
                                                        {empresas.map((emp) => (
                                                            <CommandItem
                                                                key={emp.id}
                                                                value={emp.nombre}
                                                                onSelect={() => {
                                                                    form.setValue("empresa_id", emp.id.toString())
                                                                    setOpenEmpresaPopover(false)
                                                                }}
                                                            >
                                                                <Icon.CheckIcon
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        emp.id.toString() === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {emp.nombre} ({emp.rut_empresa})
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
                            name="convenio_id"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Convenio Asociado (Opcional)</Form.FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <Form.FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un convenio" />
                                            </SelectTrigger>
                                        </Form.FormControl>
                                        <SelectContent>
                                            {isLoadingData ? (
                                                <div className="flex items-center justify-center p-4">
                                                    <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                                    <span className="text-xs">Cargando convenios...</span>
                                                </div>
                                            ) : convenios.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-muted-foreground">
                                                    No se encontraron convenios activos para esta empresa.
                                                </div>
                                            ) : (
                                                convenios.map((conv) => (
                                                    <SelectItem key={conv.id} value={conv.id.toString()}>
                                                        {conv.nombre} {conv.status !== 'ACTIVO' ? `(${conv.status})` : ''}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <Form.FormField
                            control={form.control}
                            name="nombre_tabla_personalizado"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Nombre Físico Tabla (Opcional)</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input placeholder="Ej: minera_escondida" {...field} />
                                    </Form.FormControl>
                                    <Form.FormDescription>
                                        Si se deja vacío, se generará uno automáticamente.
                                    </Form.FormDescription>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading || isLoadingData}>
                                {isLoading ? (
                                    <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Icon.DatabaseBackup className="h-4 w-4 mr-2" />
                                )}
                                Crear Tabla Física
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
