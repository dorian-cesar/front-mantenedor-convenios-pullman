"use client"

import { useState, useEffect, useCallback } from "react"
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
import { ConveniosService, Convenio, type Ruta, type RutaConfiguracion, type TipoAlcance, type TipoDescuento } from "@/services/convenio.service"
import { Empresa } from "@/services/empresa.service"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface UpdateConvenioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    convenio: Convenio | null
    empresas: Empresa[]
    apis: Array<{ id: number; nombre: string }>
    onSuccess?: () => void
}

interface City {
    id: number
    name: string
}

const rutaConfiguracionSchema = z.object({
    tipo_viaje: z.string().min(1, "Requerido"),
    tipo_asiento: z.string().min(1, "Requerido"),
    precio_solo_ida: z.number().min(0).optional(),
    precio_ida_vuelta: z.number().min(0).optional(),
    max_pasajes: z.number().min(1).optional(),
})

const rutaSchema = z.object({
    origen_codigo: z.string().min(1),
    origen_ciudad: z.string().min(1),
    destino_codigo: z.string().min(1),
    destino_ciudad: z.string().min(1),
    configuraciones: z.array(rutaConfiguracionSchema).optional(),
})

const convenioSchema = z.object({
    nombre: z.string().min(3, "Al menos 3 caracteres").max(100, "Demasiado largo"),
    empresa_id: z.union([z.number(), z.null()]).optional(),
    status: z.enum(["ACTIVO", "INACTIVO"]),
    tipo_consulta: z.enum(["CODIGO_DESCUENTO", "API_EXTERNA"], { message: "Seleccione un tipo" }),
    codigo: z.string().optional(),
    api_consulta_id: z.number().optional().nullable(),
    tipo_descuento: z.enum(["Porcentaje", "Monto Fijo", "Tarifa Plana"]).optional(),
    valor_descuento: z.number().min(0).optional(),
    tipo_alcance: z.enum(["Global", "Rutas Especificas"]).default("Global"),
    tope_monto_descuento: z.number().min(1).optional(),
    tope_cantidad_tickets: z.number().min(1).optional(),
    limitar_por_stock: z.boolean().nullable().optional(),
    limitar_por_monto: z.boolean().nullable().optional(),
    beneficio: z.boolean().optional(),
    imagenes: z.array(z.string()).optional(),
    fecha_inicio: z.string().optional(),
    fecha_termino: z.string().optional(),
    rutas: z.array(rutaSchema).optional(),
})
    .refine((data) => {
        if (data.tipo_consulta === "CODIGO_DESCUENTO") return data.codigo && data.codigo.length >= 3
        return true
    }, { message: "El código debe tener al menos 3 caracteres", path: ["codigo"] })
    .refine((data) => {
        if (data.tipo_consulta === "CODIGO_DESCUENTO") return data.codigo && /^[A-Z0-9]+$/.test(data.codigo)
        return true
    }, { message: "El código debe estar en mayúsculas y sin espacios", path: ["codigo"] })
    .refine((data) => {
        if (data.tipo_consulta === "API_EXTERNA") return data.api_consulta_id && data.api_consulta_id > 0
        return true
    }, { message: "Debe seleccionar una API", path: ["api_consulta_id"] })

type ConvenioFormValues = z.infer<typeof convenioSchema>

// â€”â€”â€” Sub-componente configuración de ruta â€”â€”â€”
function RutaConfiguracionForm({
    config,
    onUpdate,
    onRemove,
}: {
    config: RutaConfiguracion
    onUpdate: (c: RutaConfiguracion) => void
    onRemove: () => void
}) {
    return (
        <div className="border rounded-md p-3 space-y-3 bg-muted/30">
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Configuración</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={onRemove}>
                    <Icon.XIcon className="h-3 w-3" />
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-xs">Tipo viaje</Label>
                    <Select value={config.tipo_viaje} onValueChange={(v) => onUpdate({ ...config, tipo_viaje: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Solo Ida">Solo Ida</SelectItem>
                            <SelectItem value="Ida y Vuelta">Ida y Vuelta</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs">Tipo asiento</Label>
                    <Select value={config.tipo_asiento} onValueChange={(v) => onUpdate({ ...config, tipo_asiento: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Semi Cama">Semi Cama</SelectItem>
                            <SelectItem value="Cama">Cama</SelectItem>
                            <SelectItem value="Salon Cama">Salón Cama</SelectItem>
                            <SelectItem value="Ejecutivo">Ejecutivo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs">Precio Solo Ida</Label>
                    <Input className="h-8 text-xs" type="number" placeholder="0"
                        value={config.precio_solo_ida ?? ""}
                        onChange={(e) => onUpdate({ ...config, precio_solo_ida: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                    <Label className="text-xs">Precio Ida y Vuelta</Label>
                    <Input className="h-8 text-xs" type="number" placeholder="0"
                        value={config.precio_ida_vuelta ?? ""}
                        onChange={(e) => onUpdate({ ...config, precio_ida_vuelta: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                    <Label className="text-xs">Máx. pasajes</Label>
                    <Input className="h-8 text-xs" type="number" placeholder="0"
                        value={config.max_pasajes ?? ""}
                        onChange={(e) => onUpdate({ ...config, max_pasajes: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
            </div>
        </div>
    )
}

// â€”â€”â€” Componente principal â€”â€”â€”
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
    const [imagenesInputs, setImagenesInputs] = useState<string[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [loadingCities, setLoadingCities] = useState(false)
    const [rutas, setRutas] = useState<Ruta[]>([])

    const form = useForm<ConvenioFormValues>({
        resolver: zodResolver(convenioSchema),
        mode: "onChange",
        defaultValues: {
            nombre: "",
            empresa_id: null,
            status: "ACTIVO",
            tipo_consulta: "CODIGO_DESCUENTO",
            codigo: "",
            api_consulta_id: undefined,
            tipo_descuento: undefined,
            valor_descuento: undefined,
            tipo_alcance: "Global",
            tope_monto_descuento: undefined,
            tope_cantidad_tickets: undefined,
            limitar_por_stock: undefined,
            limitar_por_monto: undefined,
            beneficio: false,
            imagenes: [],
            fecha_inicio: "",
            fecha_termino: "",
            rutas: [],
        },
    })

    const tipoAlcance = form.watch("tipo_alcance")
    const beneficioValue = form.watch("beneficio")
    const tipoDescuento = form.watch("tipo_descuento")
    const empresaSeleccionadaId = form.watch("empresa_id")
    const apiSeleccionadaId = form.watch("api_consulta_id")
    const empresaSeleccionada = empresas.find((e) => e.id === empresaSeleccionadaId)
    const apiSeleccionada = apis.find((a) => a.id === apiSeleccionadaId)

    const fetchCities = useCallback(async (q = "") => {
        setLoadingCities(true)
        try {
            const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`)
            const data = await res.json()
            setCities(data.cities || [])
        } catch {
            toast.error("No se pudieron cargar las ciudades")
        } finally {
            setLoadingCities(false)
        }
    }, [])

    useEffect(() => {
        if (tipoAlcance === "Rutas Especificas" && cities.length === 0) {
            fetchCities()
        }
    }, [tipoAlcance, cities.length, fetchCities])

    // Pre-cargar datos del convenio cuando se abre el modal
    useEffect(() => {
        if (convenio && open) {
            form.reset({
                nombre: convenio.nombre || "",
                empresa_id: convenio.empresa_id || null,
                status: convenio.status || "ACTIVO",
                tipo_consulta: convenio.tipo_consulta || "CODIGO_DESCUENTO",
                codigo: convenio.codigo || "",
                api_consulta_id: convenio.api_consulta_id ?? undefined,
                tipo_descuento: convenio.tipo_descuento as TipoDescuento | undefined,
                valor_descuento: convenio.valor_descuento ?? undefined,
                tipo_alcance: (convenio.tipo_alcance as TipoAlcance) || "Global",
                tope_monto_descuento: convenio.tope_monto_descuento ?? undefined,
                tope_cantidad_tickets: convenio.tope_cantidad_tickets ?? undefined,
                limitar_por_stock: convenio.limitar_por_stock ?? undefined,
                limitar_por_monto: convenio.limitar_por_monto ?? undefined,
                beneficio: convenio.beneficio ?? false,
                imagenes: convenio.imagenes || [],
                fecha_inicio: convenio.fecha_inicio?.split("T")[0] || "",
                fecha_termino: convenio.fecha_termino?.split("T")[0] || "",
                rutas: [],
            })

            // Pre-cargar imágenes
            if (convenio.imagenes && convenio.imagenes.length > 0) {
                setImagenesInputs(convenio.imagenes)
            } else {
                setImagenesInputs([])
            }

            // Pre-cargar rutas en estado local (no en form)
            if (convenio.rutas && convenio.rutas.length > 0) {
                setRutas(convenio.rutas)
                // Cargar ciudades si hay rutas específicas
                if (convenio.tipo_alcance === "Rutas Especificas") {
                    fetchCities()
                }
            } else {
                setRutas([])
            }
        }
        setOpenEmpresaPopover(false)
        setOpenApiPopover(false)
    }, [convenio, open, form, fetchCities])

    useEffect(() => {
        if (!open) {
            setOpenEmpresaPopover(false)
            setOpenApiPopover(false)
        }
    }, [open])

    // â€”â€”â€” Helpers imágenes â€”â€”â€”
    const handleAddImagen = () => setImagenesInputs([...imagenesInputs, ""])
    const handleRemoveImagen = (index: number) => {
        const newImagenes = imagenesInputs.filter((_, i) => i !== index)
        setImagenesInputs(newImagenes)
        form.setValue("imagenes", (form.getValues("imagenes") || []).filter((_, i) => i !== index))
    }
    const handleImagenChange = (index: number, value: string) => {
        const newImagenes = [...imagenesInputs]
        newImagenes[index] = value
        setImagenesInputs(newImagenes)
        const current = form.getValues("imagenes") || []
        current[index] = value
        form.setValue("imagenes", current.filter(img => img.trim() !== ""))
    }

    // â€”â€”â€” Helpers rutas â€”â€”â€”
    const handleAddRuta = () => setRutas([...rutas, { origen_codigo: "", origen_ciudad: "", destino_codigo: "", destino_ciudad: "", configuraciones: [] }])
    const handleRemoveRuta = (index: number) => setRutas(rutas.filter((_, i) => i !== index))
    const handleUpdateRuta = (index: number, fields: Partial<Ruta>) => {
        setRutas(prev => prev.map((r, i) => i === index ? { ...r, ...fields } : r))
    }
    const handleAddConfigToRuta = (rutaIndex: number) => {
        const newRutas = [...rutas]
        newRutas[rutaIndex].configuraciones = [...(newRutas[rutaIndex].configuraciones || []), { tipo_viaje: "", tipo_asiento: "" }]
        setRutas(newRutas)
    }
    const handleUpdateConfigRuta = (rutaIndex: number, configIndex: number, config: RutaConfiguracion) => {
        const newRutas = [...rutas]
        const configs = [...(newRutas[rutaIndex].configuraciones || [])]
        configs[configIndex] = config
        newRutas[rutaIndex].configuraciones = configs
        setRutas(newRutas)
    }
    const handleRemoveConfigRuta = (rutaIndex: number, configIndex: number) => {
        const newRutas = [...rutas]
        newRutas[rutaIndex].configuraciones = (newRutas[rutaIndex].configuraciones || []).filter((_, i) => i !== configIndex)
        setRutas(newRutas)
    }

    const getValorDescuentoLabel = (tipo?: string) => {
        if (tipo === "Porcentaje") return "Valor del descuento (%)"
        if (tipo === "Monto Fijo") return "Monto de descuento ($)"
        if (tipo === "Tarifa Plana") return "Precio plano ($)"
        return "Valor del descuento"
    }

    const onSubmit = async (data: ConvenioFormValues) => {
        if (!convenio) return
        setIsLoading(true)
        try {
            // Las configuraciones van a nivel raíz
            const configuracionesGlobal = rutas.flatMap(r => r.configuraciones || []).filter(Boolean)
            const rutasSinConfig = tipoAlcance === "Rutas Especificas"
                ? rutas.map(({ configuraciones: _, ...r }) => r)
                : null

            await ConveniosService.updateConvenio(convenio.id, {
                nombre: data.nombre,
                empresa_id: data.empresa_id,
                status: data.status,
                // tipo_consulta no se envía en actualización
                codigo: data.codigo || null,
                api_consulta_id: data.api_consulta_id,
                tipo_descuento: data.tipo_descuento as TipoDescuento | undefined,
                valor_descuento: data.valor_descuento,
                tipo_alcance: data.tipo_alcance as TipoAlcance,
                tope_monto_descuento: data.tope_monto_descuento,
                tope_cantidad_tickets: data.tope_cantidad_tickets,
                limitar_por_stock: data.limitar_por_stock,
                limitar_por_monto: data.limitar_por_monto,
                beneficio: data.beneficio,
                imagenes: data.imagenes?.filter(img => img.trim() !== "") || [],
                fecha_inicio: data.fecha_inicio || null,
                fecha_termino: data.fecha_termino || null,
                rutas: rutasSinConfig,
                configuraciones: configuracionesGlobal.length > 0 ? configuracionesGlobal : null,
            })
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
                    <Dialog.DialogDescription>Modifique los datos del convenio.</Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* Nombre */}
                        <Form.FormField control={form.control} name="nombre" render={({ field }) => (
                            <Form.FormItem>
                                <Form.FormLabel>Nombre del Convenio</Form.FormLabel>
                                <Form.FormControl><Input placeholder="Ingrese el nombre del convenio" {...field} /></Form.FormControl>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        {/* Empresa */}
                        <Form.FormField control={form.control} name="empresa_id" render={({ field }) => (
                            <Form.FormItem className="flex flex-col">
                                <Form.FormLabel>Empresa Asociada</Form.FormLabel>
                                <Popover open={openEmpresaPopover} onOpenChange={setOpenEmpresaPopover}>
                                    <PopoverTrigger asChild>
                                        <Form.FormControl>
                                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                {empresaSeleccionada ? empresaSeleccionada.nombre : field.value === null ? "Sin empresa" : "Seleccionar empresa"}
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
                                                    <CommandItem value="null" onSelect={() => { field.onChange(null); setOpenEmpresaPopover(false) }}>
                                                        <Icon.CheckIcon className={cn("mr-2 h-4 w-4", field.value === null ? "opacity-100" : "opacity-0")} />
                                                        Sin empresa
                                                    </CommandItem>
                                                    {empresas.map((empresa) => (
                                                        <CommandItem key={empresa.id} value={empresa.nombre}
                                                            onSelect={() => { field.onChange(empresa.id); setOpenEmpresaPopover(false) }}>
                                                            <Icon.CheckIcon className={cn("mr-2 h-4 w-4", empresa.id === field.value ? "opacity-100" : "opacity-0")} />
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
                        )} />

                        {/* Estado */}
                        <Form.FormField control={form.control} name="status" render={({ field }) => (
                            <Form.FormItem>
                                <Form.FormLabel>Estado</Form.FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <Form.FormControl><SelectTrigger><SelectValue placeholder="Seleccione estado" /></SelectTrigger></Form.FormControl>
                                    <SelectContent>
                                        <SelectItem value="ACTIVO">Activo</SelectItem>
                                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        {/* Tipo de consulta */}
                        <Form.FormField control={form.control} name="tipo_consulta" render={({ field }) => (
                            <Form.FormItem>
                                <Form.FormLabel>Tipo de consulta</Form.FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <Form.FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger></Form.FormControl>
                                    <SelectContent>
                                        <SelectItem value="CODIGO_DESCUENTO">Código descuento</SelectItem>
                                        <SelectItem value="API_EXTERNA">API</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        {form.watch("tipo_consulta") === "API_EXTERNA" && (
                            <Form.FormField control={form.control} name="api_consulta_id" render={({ field }) => (
                                <Form.FormItem className="flex flex-col">
                                    <Form.FormLabel>API</Form.FormLabel>
                                    <Popover open={openApiPopover} onOpenChange={setOpenApiPopover}>
                                        <PopoverTrigger asChild>
                                            <Form.FormControl>
                                                <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                    {apiSeleccionada ? apiSeleccionada.nombre : "Seleccionar API"}
                                                    <Icon.ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </Form.FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar API..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontró la API.</CommandEmpty>
                                                    <CommandGroup>
                                                        {apis.map((api) => (
                                                            <CommandItem key={api.id} value={api.nombre}
                                                                onSelect={() => { field.onChange(api.id); setOpenApiPopover(false) }}>
                                                                <Icon.CheckIcon className={cn("mr-2 h-4 w-4", api.id === field.value ? "opacity-100" : "opacity-0")} />
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
                            )} />
                        )}

                        {form.watch("tipo_consulta") === "CODIGO_DESCUENTO" && (
                            <Form.FormField control={form.control} name="codigo" render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Código de descuento</Form.FormLabel>
                                    <Form.FormControl><Input placeholder="Ej: VERANO2026" {...field} value={field.value || ""} /></Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )} />
                        )}

                        {/* Tipo de descuento + Valor */}
                        <div className="grid grid-cols-2 gap-4">
                            <Form.FormField control={form.control} name="tipo_descuento" render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Tipo de descuento</Form.FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <Form.FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></Form.FormControl>
                                        <SelectContent>
                                            <SelectItem value="Porcentaje">Porcentaje</SelectItem>
                                            <SelectItem value="Monto Fijo">Monto Fijo</SelectItem>
                                            <SelectItem value="Tarifa Plana">Tarifa Plana</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )} />

                            <Form.FormField control={form.control} name="valor_descuento" render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>{getValorDescuentoLabel(tipoDescuento)}</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input type="number" placeholder="Ej: 15" value={field.value ?? ""}
                                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )} />
                        </div>

                        {/* Tipo de alcance */}
                        <Form.FormField control={form.control} name="tipo_alcance" render={({ field }) => (
                            <Form.FormItem>
                                <Form.FormLabel>Tipo de alcance</Form.FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <Form.FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></Form.FormControl>
                                    <SelectContent>
                                        <SelectItem value="Global">Global</SelectItem>
                                        <SelectItem value="Rutas Especificas">Rutas Específicas</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        {/* Rutas (condicional) */}
                        {tipoAlcance === "Rutas Especificas" && (
                            <div className="space-y-4 border rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Rutas</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddRuta}>
                                        <Icon.PlusIcon className="h-4 w-4 mr-2" />Agregar Ruta
                                    </Button>
                                </div>

                                {loadingCities && (
                                    <div className="flex justify-center py-4">
                                        <Icon.Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                )}

                                {rutas.length === 0 && !loadingCities && (
                                    <p className="text-sm text-muted-foreground text-center py-2">No hay rutas configuradas.</p>
                                )}

                                {rutas.map((ruta, rutaIndex) => (
                                    <div key={rutaIndex} className="border rounded-md p-4 space-y-3 bg-muted/20">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Ruta {rutaIndex + 1}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleRemoveRuta(rutaIndex)}>
                                                <Icon.Trash2Icon className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Ciudad Origen</Label>
                                                <Select value={ruta.origen_ciudad}
                                                    onValueChange={(val) => {
                                                        const city = cities.find(c => c.name === val)
                                                        handleUpdateRuta(rutaIndex, { origen_ciudad: val, origen_codigo: city ? String(city.id) : ruta.origen_codigo })
                                                    }}>
                                                    <SelectTrigger className="text-xs"><SelectValue placeholder="Seleccionar origen" /></SelectTrigger>
                                                    <SelectContent>
                                                        {cities.length > 0
                                                            ? [...new Map(cities.map(c => [c.name, c])).values()].map((city) => (
                                                                <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                                                            ))
                                                            : ruta.origen_ciudad && (
                                                                <SelectItem value={ruta.origen_ciudad}>{ruta.origen_ciudad}</SelectItem>
                                                            )
                                                        }
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs">Ciudad Destino</Label>
                                                <Select value={ruta.destino_ciudad}
                                                    onValueChange={(val) => {
                                                        const city = cities.find(c => c.name === val)
                                                        handleUpdateRuta(rutaIndex, { destino_ciudad: val, destino_codigo: city ? String(city.id) : ruta.destino_codigo })
                                                    }}>
                                                    <SelectTrigger className="text-xs"><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
                                                    <SelectContent>
                                                        {cities.length > 0
                                                            ? [...new Map(cities.filter(c => c.name !== ruta.origen_ciudad).map(c => [c.name, c])).values()].map((city) => (
                                                                <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                                                            ))
                                                            : ruta.destino_ciudad && (
                                                                <SelectItem value={ruta.destino_ciudad}>{ruta.destino_ciudad}</SelectItem>
                                                            )
                                                        }
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-medium text-muted-foreground">Configuraciones</Label>
                                                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAddConfigToRuta(rutaIndex)}>
                                                    <Icon.PlusIcon className="h-3 w-3 mr-1" />Agregar
                                                </Button>
                                            </div>
                                            {(ruta.configuraciones || []).map((config, configIndex) => (
                                                <RutaConfiguracionForm
                                                    key={configIndex}
                                                    config={config}
                                                    onUpdate={(c) => handleUpdateConfigRuta(rutaIndex, configIndex, c)}
                                                    onRemove={() => handleRemoveConfigRuta(rutaIndex, configIndex)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Limitar por stock */}
                        <Form.FormField control={form.control} name="limitar_por_stock" render={({ field }) => (
                            <Form.FormItem>
                                <Form.FormLabel>Limitar por stock</Form.FormLabel>
                                <Select value={field.value === null || field.value === undefined ? "" : field.value ? "true" : "false"}
                                    onValueChange={(v) => field.onChange(v === "" ? null : v === "true")}>
                                    <Form.FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></Form.FormControl>
                                    <SelectContent>
                                        <SelectItem value="true">Limitar</SelectItem>
                                        <SelectItem value="false">No limitar</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        {form.watch("limitar_por_stock") === true && (
                            <Form.FormField control={form.control} name="tope_cantidad_tickets" render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Tope cantidad tickets</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input type="number" placeholder="Ej: 50" value={field.value ?? ""}
                                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )} />
                        )}

                        {/* Limitar por monto */}
                        <Form.FormField control={form.control} name="limitar_por_monto" render={({ field }) => (
                            <Form.FormItem>
                                <Form.FormLabel>Limitar por monto</Form.FormLabel>
                                <Select value={field.value === null || field.value === undefined ? "" : field.value ? "true" : "false"}
                                    onValueChange={(v) => field.onChange(v === "" ? null : v === "true")}>
                                    <Form.FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></Form.FormControl>
                                    <SelectContent>
                                        <SelectItem value="true">Limitar</SelectItem>
                                        <SelectItem value="false">No limitar</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Form.FormMessage />
                            </Form.FormItem>
                        )} />

                        {form.watch("limitar_por_monto") === true && (
                            <Form.FormField control={form.control} name="tope_monto_descuento" render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Tope monto ventas</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input type="number" placeholder="Ej: 1000000" value={field.value ?? ""}
                                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )} />
                        )}

                        {/* Beneficio */}
                        <Form.FormField control={form.control} name="beneficio" render={({ field }) => (
                            <Form.FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <Form.FormControl>
                                    <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
                                </Form.FormControl>
                                <div className="space-y-1 leading-none">
                                    <Form.FormLabel className="text-sm font-medium">¿Es un beneficio?</Form.FormLabel>
                                </div>
                            </Form.FormItem>
                        )} />

                        {/* Imágenes (condicional si es beneficio) */}
                        {beneficioValue && (
                            <div className="space-y-4 border rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Imágenes del beneficio</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddImagen}>
                                        <Icon.PlusIcon className="h-4 w-4 mr-2" />Agregar imagen
                                    </Button>
                                </div>
                                {imagenesInputs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No hay imágenes agregadas.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {imagenesInputs.map((imagen, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input placeholder={`Nombre imagen ${index + 1}`} value={imagen}
                                                    onChange={(e) => handleImagenChange(index, e.target.value)} className="flex-1" />
                                                <Button type="button" variant="ghost" size="icon"
                                                    onClick={() => handleRemoveImagen(index)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-100">
                                                    <Icon.Trash2Icon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-4">
                            <Form.FormField control={form.control} name="fecha_inicio" render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Fecha de inicio</Form.FormLabel>
                                    <Form.FormControl><Input type="date" {...field} value={field.value || ""} /></Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )} />
                            <Form.FormField control={form.control} name="fecha_termino" render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Fecha de término</Form.FormLabel>
                                    <Form.FormControl><Input type="date" {...field} value={field.value || ""} /></Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )} />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : <Icon.PencilIcon className="h-4 w-4 mr-2" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
