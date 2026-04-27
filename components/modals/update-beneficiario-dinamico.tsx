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
import { fileToBase64, formatRut, getFileSrc, isPDF, rotateImage } from "@/utils/helpers"
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

    const form = useForm<FormValues>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            nombre: "",
            rut: "",
            telefono: "",
            correo: "",
            direccion: "",
            status: "ACTIVO",
            imagenes: {},
        },
    })

    useEffect(() => {
        if (beneficiario && open) {
            form.reset({
                nombre: beneficiario.nombre || "",
                rut: beneficiario.rut || "",
                telefono: beneficiario.telefono || "",
                correo: beneficiario.correo || "",
                direccion: beneficiario.direccion || "",
                status: beneficiario.status,
                imagenes: beneficiario.imagenes || {},
            })

            // Set initial previews
            const initialPreviews: Record<string, { src: string; isPDF: boolean }> = {}
            if (beneficiario.imagenes) {
                Object.entries(beneficiario.imagenes).forEach(([key, value]) => {
                    if (value) {
                        initialPreviews[key] = {
                            src: value,
                            isPDF: isPDF(value)
                        }
                    }
                })
            }
            setPreviews(initialPreviews)

            if (beneficiario.convenio_id) {
                ConveniosService.getConvenioById(beneficiario.convenio_id)
                    .then(setConvenio)
                    .catch(() => toast.error("No se pudo cargar la configuración del convenio"))
            }
        }
    }, [beneficiario, open, form])

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
            await BeneficiariosService.updateBeneficiario(beneficiario.id, data)
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
                        {convenio?.imagenes && convenio.imagenes.length > 0 && (
                            <div className="pt-4 border-t space-y-4">
                                <h4 className="font-medium text-sm">Archivos Adjuntos</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {convenio.imagenes.map((label: string) => {
                                        const p = previews[label]
                                        return (
                                            <div key={label} className="border p-4 rounded-md flex flex-col gap-2 relative bg-slate-50/50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{label}</span>
                                                    <div className="flex gap-2">
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
                                                        <label htmlFor={`update-file-${label}`}>
                                                            <div className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center rounded-md cursor-pointer shadow-sm transition-colors">
                                                                <Icon.UploadIcon className="h-3 w-3 mr-2" />
                                                                {p ? "Cambiar" : "Subir"}
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>

                                                {p && (
                                                    <div className="mt-2 relative rounded-md border bg-white p-2 flex items-center justify-center h-48 group">
                                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            {!p.isPDF && (
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-full shadow-md"
                                                                    onClick={(e) => { e.preventDefault(); handleRotate(label); }}
                                                                >
                                                                    <Icon.RotateCw className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-7 w-7 rounded-full shadow-md"
                                                                onClick={(e) => { e.preventDefault(); handleRemove(label); }}
                                                            >
                                                                <Icon.XIcon className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        {p.isPDF ? (
                                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                                <Icon.FileTextIcon className="h-10 w-10" />
                                                                <span className="text-xs font-medium uppercase">PDF Subido</span>
                                                            </div>
                                                        ) : (
                                                            <img src={getFileSrc(p.src) || ""} alt={label} className="max-h-full object-contain rounded" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Icon.Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> : <Icon.SaveIcon className="h-4 w-4 mr-2" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
