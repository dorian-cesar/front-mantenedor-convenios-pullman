"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import { ReembolsoService } from "@/services/reembolso.service"
import { toast } from "sonner"
import { formatRut, cleanRut, formatRutForBackend } from "@/utils/helpers"
import { PlusIcon, Loader2Icon, SearchIcon } from "lucide-react"
import { EventosService } from "@/services/evento.service"

interface AddReembolsoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const formSchema = z.object({
    pnr: z.string().min(1, "El PNR es requerido"),
    categoria: z.enum(["ANULACION", "REEMBOLSO"]),
    numero_asiento: z.string().min(1, "El número de asiento es requerido"),
    operador: z.string().min(1, "El operador es requerido"),
    fecha_cancelacion: z.string().min(1, "La fecha es requerida"),
    monto: z.coerce.number().min(1, "El monto debe ser mayor a 0"),
    // Campos opcionales para la creación inicial
    correo: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
    rut: z.string().optional(),
    numero_cuenta: z.string().optional(),
    banco: z.string().optional(),
    tipo_cuenta: z.string().optional(),
    nombre_beneficiario: z.string().optional(),
    estado: z.string().default("Pending"),
    // Metadatos para Monday
    nombre_pasajero: z.string().optional(),
    origen: z.string().optional(),
    destino: z.string().optional(),
    fecha_salida: z.string().optional(),
    canal_venta: z.string().optional(),
})

type ReembolsoFormValues = z.infer<typeof formSchema>

export default function AddReembolsoModal({
    open,
    onOpenChange,
    onSuccess,
}: AddReembolsoModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSearchingPNR, setIsSearchingPNR] = useState(false)
    const [montoOriginal, setMontoOriginal] = useState(0)

    const form = useForm<ReembolsoFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            pnr: "",
            categoria: "REEMBOLSO",
            numero_asiento: "",
            operador: "Pullman Bus",
            fecha_cancelacion: new Date().toLocaleDateString('es-CL'),
            monto: 0,
            correo: "",
            rut: "",
            numero_cuenta: "",
            banco: "",
            tipo_cuenta: "CUENTA VISTA",
            nombre_beneficiario: "",
            estado: "Pending",
            nombre_pasajero: "",
            origen: "",
            destino: "",
            fecha_salida: "",
            canal_venta: "Convenios",
        },
    })

    // Efecto para recalcular monto según categoría
    const categoria = form.watch("categoria")
    useEffect(() => {
        if (montoOriginal > 0) {
            const factor = categoria === "ANULACION" ? 0.95 : 1.0;
            const nuevoMonto = Math.round(montoOriginal * factor);
            form.setValue("monto", nuevoMonto);
        }
    }, [categoria, montoOriginal, form]);

    const handleSearchPNR = async () => {
        const pnr = form.getValues("pnr")
        if (!pnr || pnr.length < 3) {
            toast.error("Ingrese un PNR válido para buscar")
            return
        }

        setIsSearchingPNR(true)
        try {
            const response = await EventosService.getEventos({ pnr, limit: 1 })
            if (response.rows && response.rows.length > 0) {
                const evento = response.rows[0];
                const montoBase = evento.monto_pagado || 0;
                setMontoOriginal(montoBase);
                
                form.setValue("numero_asiento", evento.numero_asiento || "");
                
                // El useEffect se encargará de setear el monto final basado en la categoría actual
                const factor = form.getValues("categoria") === "ANULACION" ? 0.95 : 1.0;
                form.setValue("monto", Math.round(montoBase * factor));
                
                // Campos extra para Monday
                form.setValue("origen", evento.ciudad_origen || "");
                form.setValue("destino", evento.ciudad_destino || "");
                form.setValue("fecha_salida", evento.fecha_viaje || "");
                
                toast.success("Datos del boleto cargados");
            } else {
                toast.info("No se encontró información para este PNR en el sistema")
            }
        } catch (error) {
            console.error("Error searching PNR:", error)
            toast.error("Error al buscar información del PNR")
        } finally {
            setIsSearchingPNR(false)
        }
    }

    const onSubmit = async (data: ReembolsoFormValues) => {
        setIsLoading(true)
        console.log("[REEMBOLSO] Enviando datos al backend:", data);
        try {
            await ReembolsoService.crearReembolso({
                ...data,
                rut: data.rut ? formatRutForBackend(data.rut) : ""
            })
            toast.success("Solicitud creada correctamente")
            onOpenChange(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            console.error("Error creating reembolso:", error)
            const msg = error.response?.data?.message || "No se pudo crear la solicitud"
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(on) => {
            if (!on) form.reset()
            onOpenChange(on)
        }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nueva Solicitud Interna</DialogTitle>
                    <DialogDescription>
                        Ingrese los datos básicos del ticket para iniciar el proceso.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Campos ocultos para metadatos */}
                        <input type="hidden" {...form.register("nombre_pasajero")} />
                        <input type="hidden" {...form.register("origen")} />
                        <input type="hidden" {...form.register("destino")} />
                        <input type="hidden" {...form.register("fecha_salida")} />
                        <input type="hidden" {...form.register("canal_venta")} />

                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-4 gap-2 items-end">
                                <div className="col-span-3">
                                    <FormField
                                        control={form.control}
                                        name="pnr"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número PNR</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="PM177163..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="h-9 gap-2"
                                    onClick={handleSearchPNR}
                                    disabled={isSearchingPNR}
                                >
                                    {isSearchingPNR ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                                    Buscar
                                </Button>
                            </div>

                            {form.getValues("pnr") && form.getValues("monto") > 0 && (
                                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-blue-600 font-bold border-b border-blue-100 pb-1 mb-1">
                                        <span>Información del Ticket</span>
                                        <SearchIcon className="h-3 w-3" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-slate-500 font-medium uppercase">Origen</span>
                                            <span className="text-xs font-bold text-slate-700 uppercase truncate">{form.getValues("origen") || 'No especificado'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-slate-500 font-medium uppercase">Destino</span>
                                            <span className="text-xs font-bold text-slate-700 uppercase truncate">{form.getValues("destino") || 'No especificado'}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-[9px] text-slate-500 font-medium uppercase">Monto Total</span>
                                        <span className="text-sm font-black text-blue-700">
                                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(form.getValues("monto"))}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="categoria"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Categoría</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ANULACION">Anulación</SelectItem>
                                                    <SelectItem value="REEMBOLSO">Reembolso</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="operador"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Operador</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Pullman Bus">Pullman Bus</SelectItem>
                                                    <SelectItem value="Pullman Costa">Pullman Costa</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="numero_asiento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número de asiento</FormLabel>
                                            <FormControl>
                                                <Input placeholder="12" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="fecha_cancelacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha cancelación</FormLabel>
                                            <FormControl>
                                                <Input placeholder="DD-MM-YYYY" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="monto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto a Devolver</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="correo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo Electrónico (Para envío de link)</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="ejemplo@correo.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                    <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                )}
                                Crear Solicitud
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
