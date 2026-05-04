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
import { EstudiantesService } from "@/services/estudiante.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { toast } from "sonner"
import { fileToBase64, cleanRut } from "@/utils/helpers"
import { FileTextIcon, UploadIcon, XIcon, PlusIcon, Loader2Icon } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface AddEstudianteModalProps {
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

type EstudianteFormValues = z.infer<ReturnType<typeof createSchema>>

export default function AddEstudianteModal({
    open,
    onOpenChange,
    onSuccess,
}: AddEstudianteModalProps) {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [previews, setPreviews] = useState<Record<string, { src: string; isPDF: boolean }>>({})
    const [loadingConvenios, setLoadingConvenios] = useState(false)

    const form = useForm<EstudianteFormValues>({
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
            const params: any = { status: 'ACTIVO' }
            
            if (user?.rol?.toUpperCase() === "USUARIO" && user?.empresa_id) {
                params.empresa_id = user.empresa_id
            }

            const res = await ConveniosService.getConvenios(params)
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
            
            const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf')
            setPreviews(p => ({ ...p, [label]: { src: base64, isPDF } }))
            toast.info(`Cargado: ${label}`)
        } catch {
            toast.error("Error al cargar.")
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

    const onSubmit = async (data: EstudianteFormValues) => {
        if (selectedConvenio?.imagenes?.length) {
            const missing = selectedConvenio.imagenes.filter(l => !data.imagenes?.[l])
            if (missing.length) {
                toast.error(`Faltan: ${missing.join(", ")}`)
                return
            }
        }

        setIsLoading(true)
        try {
            await EstudiantesService.createEstudiante({
                ...data,
                rut: cleanRut(data.rut)
            } as any)
            toast.success("Creado")
            form.reset()
            setPreviews({})
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error creating estudiante:", error)
            const errorMsg = error.response?.data?.message || "Error al crear el estudiante"
            toast.error(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Agregar Estudiante</DialogTitle>
                    <DialogDescription>Ingrese los datos y cargue documentos.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="nombre" render={({ field }) => (
                                <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="rut" render={({ field }) => (
                                <FormItem><FormLabel>RUT</FormLabel><FormControl><Input placeholder="12345678-9" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="telefono" render={({ field }) => (
                                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="correo" render={({ field }) => (
                                <FormItem><FormLabel>Correo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="direccion" render={({ field }) => (
                                <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="convenio_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Convenio</FormLabel>
                                    <Select 
                                        onValueChange={v => field.onChange(Number(v))} 
                                        value={field.value?.toString() || ""}
                                    >
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {convenios.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {selectedConvenio && (
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                {(() => {
                                    const labels = [...(selectedConvenio.imagenes || [])];
                                    if (labels.length === 0) {
                                        labels.push("Foto frontal de Carnet de Identidad", "Certificado Alumno Regular");
                                    } else {
                                        if (!labels.some(l => l.toLowerCase().includes("carnet"))) labels.push("Foto frontal de Carnet de Identidad");
                                        if (!labels.some(l => l.toLowerCase().includes("certificado"))) labels.push("Certificado Alumno Regular");
                                    }

                                    return labels.map((l, i) => (
                                        <FormField key={i} control={form.control} name={`imagenes.${l}` as any} render={() => (
                                            <FormItem>
                                                <FormLabel>{l}</FormLabel>
                                                <FormControl>
                                                    <div className="border border-dashed p-4 rounded text-center cursor-pointer min-h-[100px] flex items-center justify-center transition hover:bg-muted/50" onClick={() => document.getElementById(`f-${l}`)?.click()}>
                                                        <input id={`f-${l}`} type="file" className="hidden" onChange={e => handleFileChange(e.target.files?.[0] as any, l)} />
                                                        {previews[l] ? (
                                                            <div className="relative w-full">
                                                                {previews[l].isPDF ? <FileTextIcon className="mx-auto h-8 w-8 text-primary" /> : <img src={previews[l].src} className="max-h-20 mx-auto rounded object-contain" />}
                                                                <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={(e) => { e.stopPropagation(); handleRemove(l); }}>
                                                                    <XIcon className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center text-muted-foreground">
                                                                <UploadIcon className="h-5 w-5 mb-1" />
                                                                <span className="text-[10px]">Subir {l}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    ));
                                })()}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2Icon className="animate-spin" /> : <PlusIcon />} Crear</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}