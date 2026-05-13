"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import { ReembolsoService, type Reembolso } from "@/services/reembolso.service"
import { toast } from "sonner"
import { formatRut, cleanRut, formatNumber, validateRut, formatRutForBackend } from "@/utils/helpers"
import { Loader2Icon, CheckCircle2Icon, LandmarkIcon, UserIcon, TicketIcon, BanknoteIcon } from "lucide-react"

const formSchema = z.object({
    correo: z.string().min(1, "El correo electrónico es requerido").email("Correo electrónico inválido"),
    rut: z.string()
        .min(1, "El RUT es requerido")
        .refine((val) => validateRut(val), {
            message: "RUT inválido (ej: 12345678-9)",
        }),
    numero_cuenta: z.string().min(5, "El número de cuenta debe tener al menos 5 dígitos"),
    banco: z.string().min(3, "Ingresa el nombre completo de tu banco"),
    tipo_cuenta: z.string().min(1, "Selecciona un tipo de cuenta"),
    nombre_beneficiario: z.string().min(3, "El nombre completo es requerido"),
})

type FormValues = z.infer<typeof formSchema>

export default function CompletarReembolsoPage() {
    const params = useParams()
    const token = params.token as string
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [reembolso, setReembolso] = useState<Reembolso | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            correo: "",
            rut: "",
            numero_cuenta: "",
            banco: "",
            tipo_cuenta: "CUENTA VISTA",
            nombre_beneficiario: "",
        },
    })

    useEffect(() => {
        const fetchReembolso = async () => {
            try {
                const data = await ReembolsoService.getReembolsoByToken(token)
                setReembolso(data)
                if (data.rut) form.setValue("rut", formatRut(data.rut))
                if (data.correo) form.setValue("correo", data.correo)
                if (data.banco) form.setValue("banco", data.banco)
                if (data.numero_cuenta) form.setValue("numero_cuenta", data.numero_cuenta)
                if (data.tipo_cuenta) form.setValue("tipo_cuenta", data.tipo_cuenta)
            } catch (error: any) {
                console.error("Error fetching reembolso:", error)
                if (error.response?.status === 403 || error.response?.data?.completed) {
                    setIsSuccess(true) // Reutilizamos el estado de éxito para mostrar que ya está listo
                    toast.info("Esta solicitud ya fue completada anteriormente")
                } else {
                    toast.error("La solicitud no existe o el enlace ha expirado")
                }
            } finally {
                setIsLoading(false)
            }
        }

        if (token) fetchReembolso()
    }, [token, form])

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true)
        try {
            await ReembolsoService.updateReembolsoByToken(token, {
                ...data,
                rut: formatRutForBackend(data.rut)
            })
            setIsSuccess(true)
            toast.success("Información enviada correctamente")
        } catch (error: any) {
            console.error("Error updating reembolso:", error)
            toast.error("No se pudo enviar la información. Intente más tarde.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2Icon className="h-10 w-10 animate-spin mx-auto text-primary" />
                    <p className="text-slate-500 font-medium">Cargando solicitud...</p>
                </div>
            </div>
        )
    }

    if (!reembolso && !isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center space-y-6">
                    <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <TicketIcon className="h-10 w-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Enlace no válido</h1>
                    <p className="text-slate-600">
                        Lo sentimos, el enlace de solicitud de reembolso no es válido o ya no está disponible.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
                        Ir al inicio
                    </Button>
                </div>
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center space-y-6">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2Icon className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">¡Información Recibida!</h1>
                        <p className="text-slate-600">
                            Tus datos bancarios han sido registrados exitosamente. Procesaremos tu solicitud de {reembolso?.categoria?.toLowerCase()} lo antes posible.
                        </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-left border border-slate-100">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">PNR:</span>
                            <span className="font-mono font-bold text-slate-700">{reembolso?.pnr}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-slate-500">Monto:</span>
                            <span className="font-bold text-slate-700">${formatNumber(reembolso?.monto || 0)}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">
                        Puedes cerrar esta ventana ahora.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
            <div className="max-w-lg w-full space-y-8">
                {/* Header / Logo Section */}
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
                        <BanknoteIcon className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Solicitud de {reembolso?.categoria === 'ANULACION' ? 'Anulación' : 'Reembolso'}
                    </h1>
                    <p className="text-slate-500">
                        Por favor, completa tus datos para procesar la devolución.
                    </p>
                </div>

                {/* Ticket Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <TicketIcon className="h-5 w-5 opacity-70" />
                            <span className="text-sm font-medium">Información del Viaje</span>
                        </div>
                        <span className="font-mono text-lg font-bold">{reembolso?.pnr}</span>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Operador</span>
                            <p className="font-semibold text-slate-700">{reembolso?.operador}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Asiento</span>
                            <p className="font-semibold text-slate-700">{reembolso?.numero_asiento}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fecha Cancelación</span>
                            <p className="font-semibold text-slate-700">{reembolso?.fecha_cancelacion}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monto a Devolver</span>
                            <p className="text-xl font-black text-primary">${formatNumber(reembolso?.monto || 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4 mb-6">
                        <LandmarkIcon className="h-6 w-6 text-slate-400" />
                        <h2 className="text-xl font-bold text-slate-800">Datos de Transferencia</h2>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="nombre_beneficiario"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-600">Nombre completo del Beneficiario <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                                <Input 
                                                    placeholder="Nombre y Apellidos" 
                                                    className="h-11 pl-10 focus-visible:ring-primary"
                                                    {...field} 
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField
                                    control={form.control}
                                    name="rut"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600">RUT del Beneficiario <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="12345678-9" 
                                                    className="h-11 focus-visible:ring-primary"
                                                    {...field} 
                                                    onChange={(e) => field.onChange(formatRutForBackend(e.target.value))}
                                                />
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
                                            <FormLabel className="text-slate-600">Correo Electrónico <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="email"
                                                    placeholder="ejemplo@correo.com" 
                                                    className="h-11 focus-visible:ring-primary"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-5 pt-2">
                                <FormField
                                    control={form.control}
                                    name="banco"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600">Nombre del Banco <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Ej: Banco Estado, BCI, etc." 
                                                    className="h-11 focus-visible:ring-primary"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField
                                        control={form.control}
                                        name="tipo_cuenta"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-600">Tipo de Cuenta <span className="text-red-500">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Seleccionar" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="CUENTA VISTA">Cuenta Vista / Rut</SelectItem>
                                                        <SelectItem value="CUENTA CORRIENTE">Cuenta Corriente</SelectItem>
                                                        <SelectItem value="CUENTA AHORRO">Cuenta Ahorro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="numero_cuenta"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-600">Número de Cuenta <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="0000000000" 
                                                        className="h-11 focus-visible:ring-primary"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button 
                                    type="submit" 
                                    className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <CheckCircle2Icon className="h-5 w-5 mr-2" />
                                    )}
                                    Confirmar y Enviar Datos
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>

                <footer className="text-center text-slate-400 text-xs py-4">
                    Pullman Bus &copy; {new Date().getFullYear()} - Gestión de Reembolsos Corporativos
                </footer>
            </div>
        </div>
    )
}
