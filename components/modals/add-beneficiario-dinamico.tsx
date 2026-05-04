"use client"

import { useState } from "react"
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
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api"
import { type Convenio } from "@/services/convenio.service"
import { toast } from "sonner"
import { fileToBase64, formatRut, cleanRut } from "@/utils/helpers"
import { FileTextIcon, UploadIcon, XIcon, Loader2Icon } from "lucide-react"

interface AddBeneficiarioDinamicoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    convenio: Convenio
}

const createSchema = () => z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    rut: z.string().min(1, "El RUT es requerido"),
    telefono: z.string().optional().or(z.literal("")),
    correo: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
    direccion: z.string().optional().or(z.literal("")),
    imagenes: z.any().optional(),
})

type FormValues = z.infer<ReturnType<typeof createSchema>>

export default function AddBeneficiarioDinamicoModal({
    open,
    onOpenChange,
    onSuccess,
    convenio,
}: AddBeneficiarioDinamicoModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [previews, setPreviews] = useState<Record<string, { src: string; isPDF: boolean }>>({})

    const form = useForm<FormValues>({
        resolver: zodResolver(createSchema()),
        defaultValues: {
            nombre: "",
            rut: "",
            telefono: "",
            correo: "",
            direccion: "",
            imagenes: {},
        },
    })

    const handleOpenChange = (on: boolean) => {
        if (!on) {
            form.reset()
            setPreviews({})
        }
        onOpenChange(on)
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
            
            const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            setPreviews(p => ({ ...p, [label]: { src: base64, isPDF } }))
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

    const onSubmit = async (data: FormValues) => {
        if (convenio.imagenes?.length) {
            const missing = convenio.imagenes.filter((l: string) => !data.imagenes?.[l])
            if (missing.length) {
                toast.error(`Faltan los siguientes archivos requeridos: ${missing.join(", ")}`)
                return
            }
        }

        setIsLoading(true)
        try {
            const payload = {
                ...data,
                rut: cleanRut(data.rut),
                convenio_id: convenio.id,
            }
            // Use the same endpoint used by logic in adultomayor.service.ts
            await api.post('/beneficiarios', payload)
            
            toast.success("Beneficiario creado correctamente")
            form.reset()
            setPreviews({})
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error creating beneficiario:", error)
            const errorMsg = error.response?.data?.message || "Error al crear el beneficiario"
            toast.error(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Agregar Beneficiario</DialogTitle>
                    <DialogDescription>
                        Crea un nuevo beneficiario para el convenio <strong>{convenio.nombre}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre completo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RUT</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="12.345.678-9" 
                                                {...field} 
                                                onChange={(e) => field.onChange(formatRut(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+569..." {...field} />
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
                                        <FormLabel>Correo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="correo@ejemplo.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="direccion"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Avenida Siempre Viva 123" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Documentos Dinámicos */}
                        {convenio.imagenes && convenio.imagenes.length > 0 && (
                            <div className="pt-4 border-t space-y-4">
                                <h4 className="font-medium text-sm">Archivos Requeridos</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {convenio.imagenes.map((label: string) => {
                                        const p = previews[label]
                                        return (
                                            <div key={label} className="border p-4 rounded-md flex flex-col gap-2 relative bg-slate-50/50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{label}</span>
                                                    <div>
                                                        <input
                                                            type="file"
                                                            accept="image/*,application/pdf"
                                                            className="hidden"
                                                            id={`file-${label}`}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) handleFileChange(file, label)
                                                            }}
                                                        />
                                                        <label htmlFor={`file-${label}`}>
                                                            <div className="h-9 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center rounded-md cursor-pointer shadow-sm transition-colors">
                                                                <UploadIcon className="h-4 w-4 mr-2" />
                                                                {p ? "Cambiar Archivo" : "Subir Archivo"}
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>

                                                {p && (
                                                    <div className="mt-2 relative rounded-md border bg-white p-2 flex items-center justify-center h-24">
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                            onClick={(e) => { e.preventDefault(); handleRemove(label); }}
                                                        >
                                                            <XIcon className="h-3 w-3" />
                                                        </Button>
                                                        {p.isPDF ? (
                                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                                <FileTextIcon className="h-6 w-6" />
                                                                <span className="text-xs font-medium uppercase tracking-wider">PDF Subido</span>
                                                            </div>
                                                        ) : (
                                                            <img src={p.src} alt={label} className="max-h-full object-contain rounded" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Crear Beneficiario
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
