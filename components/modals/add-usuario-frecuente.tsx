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
import { UsuariosFrecuentesService } from "@/services/usuario-frecuente.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { toast } from "sonner"
import { fileToBase64, formatRut } from "@/utils/helpers"
import { FileTextIcon, UploadIcon, XIcon, PlusIcon, Loader2Icon } from "lucide-react"

interface AddUsuarioFrecuenteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const createSchema = () => z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    rut: z.string().min(1, "El RUT es requerido"),
    telefono: z.string().min(1, "El teléfono es requerido"),
    correo: z.string().email("Correo electrónico inválido"),
    direccion: z.string().min(1, "La dirección es requerida"),
    convenio_id: z.number().int().positive("Debe seleccionar un convenio"),
    imagenes: z.any().optional(),
})

type UsuarioFrecuenteFormValues = z.infer<ReturnType<typeof createSchema>>

export default function AddUsuarioFrecuenteModal({
    open,
    onOpenChange,
    onSuccess,
}: AddUsuarioFrecuenteModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [previews, setPreviews] = useState<Record<string, { src: string; isPDF: boolean }>>({})
    const [loadingConvenios, setLoadingConvenios] = useState(false)

    const form = useForm<UsuarioFrecuenteFormValues>({
        resolver: zodResolver(createSchema()),
        defaultValues: {
            nombre: "",
            rut: "",
            telefono: "",
            correo: "",
            direccion: "",
            convenio_id: undefined,
            imagenes: {},
        },
    })

    const selectedConvenioId = form.watch("convenio_id")
    const selectedConvenio = convenios.find(c => c.id === selectedConvenioId)

    const fetchConvenios = async () => {
        setLoadingConvenios(true)
        try {
            const res = await ConveniosService.getConvenios({ empresa_id: 80, status: 'ACTIVO' })
            setConvenios(res.rows || [])
        } catch (error) {
            console.error("Error fetching convenios:", error)
            toast.error("No se pudieron cargar los convenios")
        } finally {
            setLoadingConvenios(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchConvenios()
        }
    }, [open])

    useEffect(() => {
        if (selectedConvenioId) {
            form.setValue("imagenes", {})
            setPreviews({})
        }
    }, [selectedConvenioId, form])

    const handleOpenChange = (on: boolean) => {
        if (!on) {
            form.reset()
            setPreviews({})
        }
        onOpenChange(on)
    }

    const handleFileChange = async (file: File, label: string) => {
        if (!file) return
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

    const onSubmit = async (data: UsuarioFrecuenteFormValues) => {
        if (selectedConvenio?.imagenes?.length) {
            const missing = selectedConvenio.imagenes.filter(l => !data.imagenes?.[l])
            if (missing.length) {
                toast.error(`Faltan los siguientes archivos: ${missing.join(", ")}`)
                return
            }
        }

        setIsLoading(true)
        try {
            await UsuariosFrecuentesService.createUsuarioFrecuente(data as any)
            toast.success("Pasajero Frecuente creado correctamente")
            form.reset()
            setPreviews({})
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error creating usuario frecuente:", error)
            toast.error("Error al crear el pasajero frecuente")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Pasajero Frecuente</DialogTitle>
                    <DialogDescription>
                        Ingrese los datos del pasajero frecuente y cargue los documentos según el convenio seleccionado.
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
                                            <Input placeholder="usuario@ejemplo.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="direccion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Dirección completa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="convenio_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Convenio</FormLabel>
                                        <Select 
                                            onValueChange={(v) => field.onChange(Number(v))} 
                                            value={field.value?.toString() || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingConvenios ? "Cargando..." : "Seleccionar convenio"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {convenios.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {selectedConvenio?.imagenes && selectedConvenio.imagenes.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="col-span-2">
                                    <label className="text-sm font-semibold">Archivos requeridos por el convenio</label>
                                </div>
                                {selectedConvenio.imagenes.map((label, index) => (
                                    <FormField
                                        key={index}
                                        control={form.control}
                                        name={`imagenes.${label}` as any}
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>{label}</FormLabel>
                                                <FormControl>
                                                    <div
                                                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition flex items-center justify-center min-h-[120px]"
                                                        onClick={() => document.getElementById(`file-${label}`)?.click()}
                                                    >
                                                        <input
                                                            id={`file-${label}`}
                                                            type="file"
                                                            accept="image/*,application/pdf"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) handleFileChange(file, label)
                                                            }}
                                                        />

                                                        {previews[label] ? (
                                                            <div className="relative w-full">
                                                                {previews[label].isPDF ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <FileTextIcon className="h-10 w-10 text-primary" />
                                                                        <span className="text-xs mt-1 truncate max-w-full italic text-muted-foreground">Documento PDF</span>
                                                                    </div>
                                                                ) : (
                                                                    <img
                                                                        src={previews[label].src}
                                                                        alt={label}
                                                                        className="mx-auto max-h-24 rounded object-contain"
                                                                    />
                                                                )}
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleRemove(label)
                                                                    }}
                                                                >
                                                                    <XIcon className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center text-muted-foreground">
                                                                <UploadIcon className="h-6 w-6 mb-1" />
                                                                <p className="text-xs">Subir {label}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit" disabled={isLoading || !selectedConvenioId}>
                                {isLoading ? (
                                    <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                )}
                                Crear Pasajero Frecuente
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}