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
import { BeneficiariosService, type Beneficiario } from "@/services/beneficiarios.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { toast } from "sonner"
import { fileToBase64, formatRut, getFileSrc, isPDF, rotateImage, cleanRut, formatRutForBackend } from "@/utils/helpers"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface UpdateBeneficiarioDinamicoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    beneficiario: Beneficiario | null
    onSuccess?: () => void
}

const updateSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    rut: z.string().min(1, "El RUT es requerido"),
    telefono: z.string().optional().or(z.literal("")),
    correo: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
    direccion: z.string().optional().or(z.literal("")),
    status: z.enum(["ACTIVO", "INACTIVO", "RECHAZADO"]),
    imagenes: z.any().optional(),
})

type FormValues = z.infer<typeof updateSchema>

export default function UpdateBeneficiarioDinamicoModal({
    open,
    onOpenChange,
    beneficiario,
    onSuccess,
}: UpdateBeneficiarioDinamicoModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [convenio, setConvenio] = useState<Convenio | null>(null)
    const [previews, setPreviews] = useState<Record<string, { src: string; isPDF: boolean }>>({})
    const [fullBeneficiario, setFullBeneficiario] = useState<Beneficiario | null>(null)
    const [isFetching, setIsFetching] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(updateSchema),
    })

    useEffect(() => {
        if (open && beneficiario?.id) {
            fetchFullData(beneficiario.id)
        } else if (!open) {
            setFullBeneficiario(null)
            form.reset()
            setPreviews({})
        }
    }, [open, beneficiario?.id])

    const fetchFullData = async (id: number) => {
        setIsFetching(true)
        try {
            const data = await BeneficiariosService.getBeneficiarioById(id)
            setFullBeneficiario(data)
            
            // Reset form with full data
            form.reset({
                nombre: data.nombre || "",
                rut: formatRut(data.rut),
                telefono: data.telefono || "",
                correo: data.correo || "",
                direccion: data.direccion || "",
                status: data.status,
                imagenes: data.imagenes || {},
            })

            // Set previews
            const initialPreviews: Record<string, { src: string; isPDF: boolean }> = {}
            
            // Legacy fields support
            const legacyFields: Record<string, string | undefined> = {
                "Foto frontal de Carnet de Identidad": (data as any).imagen_cedula_identidad,
                "Certificado de Residencia": (data as any).imagen_certificado_residencia,
                "Certificado Alumno Regular": (data as any).imagen_certificado_alumno_regular,
            }

            Object.entries(legacyFields).forEach(([label, value]) => {
                if (value) {
                    initialPreviews[label] = {
                        src: getFileSrc(value) || value,
                        isPDF: isPDF(value)
                    }
                }
            })

            // Dynamic images
            if (data.imagenes) {
                Object.entries(data.imagenes).forEach(([key, value]) => {
                    if (value) {
                        initialPreviews[key] = {
                            src: getFileSrc(value) || value,
                            isPDF: isPDF(value)
                        }
                    }
                })
            }
            setPreviews(initialPreviews)

            if (data.convenio_id) {
                ConveniosService.getConvenioById(data.convenio_id)
                    .then(setConvenio)
                    .catch(() => toast.error("No se pudo cargar la configuración del convenio"))
            }
        } catch (error) {
            console.error("Error fetching full beneficiary data:", error)
            toast.error("No se pudo cargar la información del beneficiario")
            onOpenChange(false)
        } finally {
            setIsFetching(false)
        }
    }

    const handleFileChange = async (file: File, label: string) => {
        if (!file) return

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
            toast.error("Formato no permitido. Use JPG, PNG o PDF.")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(`El archivo "${label}" supera los 5MB.`)
            return
        }

        try {
            const base64 = await fileToBase64(file)
            const current = form.getValues("imagenes") || {}
            form.setValue("imagenes", { ...current, [label]: base64 })
            
            const isPDFFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            setPreviews(p => ({ ...p, [label]: { src: base64, isPDF: isPDFFile } }))
            toast.info(`Cargado: ${label}`)
        } catch {
            toast.error("Error al cargar el archivo.")
        }
    }

    const handleRemove = (label: string) => {
        const cur = { ...form.getValues("imagenes") || {} }
        delete cur[label]
        form.setValue("imagenes", cur)
        const p = { ...previews }
        delete p[label]
        setPreviews(p)
    }

    const handleRotate = async (label: string) => {
        const preview = previews[label]
        if (!preview || preview.isPDF) return;

        try {
            const rotatedBase64 = await rotateImage(preview.src, 90);
            const current = form.getValues("imagenes") || {}
            form.setValue("imagenes", { ...current, [label]: rotatedBase64 })
            setPreviews(p => ({ ...p, [label]: { ...preview, src: rotatedBase64 } }));
            toast.success("Imagen rotada");
        } catch {
            toast.error("Error al rotar la imagen");
        }
    }

    const onSubmit = async (data: FormValues) => {
        if (!beneficiario) return
        setIsLoading(true)

        try {
            await BeneficiariosService.updateBeneficiario(beneficiario.id, {
                ...data,
                rut: formatRutForBackend(data.rut)
            })
            toast.success("Beneficiario actualizado correctamente")
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error updating beneficiario:", error)
            const errorMsg = error.response?.data?.message || "Error al actualizar el beneficiario"
            toast.error(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Beneficiario</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos del beneficiario para el convenio <strong>{convenio?.nombre}</strong>.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                {isFetching ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Icon.Loader2Icon className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground animate-pulse">Cargando datos del beneficiario...</p>
                    </div>
                ) : (
                    <Form.Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Form.FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Nombre</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="Nombre completo" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                            <Form.FormField
                                control={form.control}
                                name="rut"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>RUT</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input 
                                                placeholder="12.345.678-9" 
                                                {...field} 
                                                onChange={(e) => field.onChange(formatRut(e.target.value))}
                                            />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                            <Form.FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Teléfono</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="+569..." {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                            <Form.FormField
                                control={form.control}
                                name="correo"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Correo</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="correo@ejemplo.com" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                            <Form.FormField
                                control={form.control}
                                name="direccion"
                                render={({ field }) => (
                                    <Form.FormItem className="col-span-2">
                                        <Form.FormLabel>Dirección</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input placeholder="Avenida Siempre Viva 123" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                            <Form.FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <Form.FormItem className="col-span-2">
                                        <Form.FormLabel>Estado</Form.FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <Form.FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione un estado" />
                                                </SelectTrigger>
                                            </Form.FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVO">Activo</SelectItem>
                                                <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                                <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        </div>

                        {/* Documentos Dinámicos */}
                        <div className="pt-4 border-t space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Archivos Adjuntos</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {(() => {
                                    const labels = [...(convenio?.imagenes || [])];
                                    const specificLabels = [
                                        "Foto frontal de Carnet de Identidad",
                                        "Certificado de Residencia",
                                        "Certificado Alumno Regular"
                                    ];
                                    
                                    specificLabels.forEach(sl => {
                                        if (previews[sl] && !labels.includes(sl)) {
                                            labels.push(sl);
                                        }
                                    });

                                    if (labels.length === 0) {
                                        labels.push("Foto frontal de Carnet de Identidad");
                                    }

                                    return labels.map((label: string) => {
                                        const p = previews[label]
                                        return (
                                            <div key={label} className="space-y-2">
                                                <Form.FormLabel className="text-xs font-semibold">{label}</Form.FormLabel>
                                                <div
                                                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition min-h-[140px] flex items-center justify-center relative bg-slate-50/30"
                                                    onClick={() => document.getElementById(`update-file-${label}`)?.click()}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        className="hidden"
                                                        id={`update-file-${label}`}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) handleFileChange(file, label)
                                                        }}
                                                    />

                                                    {p ? (
                                                        <div className="w-full flex flex-col items-center gap-2">
                                                            <div className="relative border rounded-lg bg-background p-2 w-full flex justify-center h-32 overflow-hidden shadow-sm">
                                                                {p.isPDF ? (
                                                                    <div className="flex flex-col items-center justify-center p-2">
                                                                        <Icon.FileTextIcon className="h-10 w-10 text-primary" />
                                                                        <span className="text-[10px] text-muted-foreground mt-1 font-medium">PDF</span>
                                                                    </div>
                                                                ) : (
                                                                    <img
                                                                        src={getFileSrc(p.src) || ""}
                                                                        alt={label}
                                                                        className="h-full w-full object-contain rounded"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2 w-full justify-center">
                                                                {!p.isPDF && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 px-2"
                                                                        onClick={(e) => { e.stopPropagation(); handleRotate(label); }}
                                                                    >
                                                                        <Icon.RotateCw className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="h-7 px-2"
                                                                    onClick={(e) => { e.stopPropagation(); handleRemove(label); }}
                                                                >
                                                                    <Icon.XIcon className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center text-muted-foreground opacity-60">
                                                            <Icon.UploadIcon className="h-6 w-6 mb-1" />
                                                            <p className="text-[10px] font-medium">Subir {label}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                })()}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <Icon.Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Icon.SaveIcon className="h-4 w-4 mr-2" />
                                )}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Form.Form>
                )}
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
