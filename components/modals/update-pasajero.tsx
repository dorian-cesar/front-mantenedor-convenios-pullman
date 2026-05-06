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
import { PasajerosService, type Pasajero } from "@/services/pasajero.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { toast } from "sonner"
import { fileToBase64, formatRut, cleanRut, getFileSrc, isPDF } from "@/utils/helpers"
import { FileTextIcon, UploadIcon, XIcon, Loader2Icon, SaveIcon } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface UpdatePasajeroModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pasajero: Pasajero | null
    onSuccess?: () => void
}

const updateSchema = () => z.object({
    nombres: z.string().min(1, "El nombre es requerido"),
    apellidos: z.string().min(1, "El apellido es requerido"),
    rut: z.string().min(1, "El RUT es requerido"),
    telefono: z.string().min(1, "El teléfono es requerido"),
    correo: z.string().email("Correo electrónico inválido").or(z.literal("")),
    direccion: z.string().optional(),
    empresa_id: z.number().int().positive("Debe seleccionar una empresa"),
    convenio_id: z.number().int().positive("Debe seleccionar un convenio"),
    imagenes: z.any().optional(),
    status: z.enum(["ACTIVO", "INACTIVO"]),
})

type PasajeroFormValues = z.infer<ReturnType<typeof updateSchema>>

export default function UpdatePasajeroModal({
    open,
    onOpenChange,
    pasajero,
    onSuccess,
}: UpdatePasajeroModalProps) {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [previews, setPreviews] = useState<Record<string, { src: string; isPDF: boolean }>>({})
    const [loadingData, setLoadingData] = useState(false)

    const form = useForm<PasajeroFormValues>({
        resolver: zodResolver(updateSchema()),
    })

    const selectedEmpresaId = form.watch("empresa_id")
    const selectedConvenioId = form.watch("convenio_id")
    const selectedConvenio = convenios.find(c => c.id === selectedConvenioId)

    useEffect(() => {
        if (pasajero && open) {
            form.reset({
                nombres: pasajero.nombres || "",
                apellidos: pasajero.apellidos || "",
                rut: formatRut(pasajero.rut),
                telefono: pasajero.telefono || "",
                correo: pasajero.correo || "",
                direccion: pasajero.direccion || "",
                empresa_id: pasajero.empresa_id || undefined,
                convenio_id: pasajero.convenio_id || undefined,
                imagenes: pasajero.imagenes || {},
                status: pasajero.status,
            })

            // Load existing previews
            if (pasajero.imagenes) {
                const existingPreviews: Record<string, { src: string; isPDF: boolean }> = {}
                Object.entries(pasajero.imagenes).forEach(([key, src]) => {
                    existingPreviews[key] = {
                        src: getFileSrc(src) || "",
                        isPDF: isPDF(src)
                    }
                })
                setPreviews(existingPreviews)
            }
        }
    }, [pasajero, open, form])

    const fetchData = async () => {
        setLoadingData(true)
        try {
            const isSuperUser = user?.rol?.toUpperCase() === "SUPER_USUARIO"
            
            if (isSuperUser) {
                const resEmp = await EmpresasService.getEmpresas({ status: 'ACTIVO', limit: 1000 })
                setEmpresas(resEmp.rows || [])
            }

            if (selectedEmpresaId) {
                const resConv = await ConveniosService.getConvenios({ 
                    status: 'ACTIVO', 
                    empresa_id: selectedEmpresaId 
                })
                setConvenios(resConv.rows || [])
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoadingData(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open, selectedEmpresaId])

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
            
            const isPDFFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            setPreviews(p => ({ ...p, [label]: { src: base64, isPDF: isPDFFile } }))
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

    const onSubmit = async (data: PasajeroFormValues) => {
        if (!pasajero) return
        setIsLoading(true)
        try {
            await PasajerosService.updatePasajero(pasajero.id, {
                ...data,
                rut: cleanRut(data.rut)
            } as any)
            toast.success("Pasajero actualizado correctamente")
            handleOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            console.error("Error updating pasajero:", error)
            const msg = error.response?.data?.message || "No se pudo actualizar el pasajero"
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    const isSuperUser = user?.rol?.toUpperCase() === "SUPER_USUARIO"

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Beneficiario</DialogTitle>
                    <DialogDescription>
                        Modifique los datos del beneficiario y sus documentos.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nombres"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombres</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombres" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="apellidos"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Apellidos</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Apellidos" {...field} />
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
                                            <Input placeholder="ejemplo@correo.com" {...field} />
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
                                name="empresa_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empresa</FormLabel>
                                        <Select 
                                            onValueChange={(v) => field.onChange(Number(v))} 
                                            value={field.value?.toString() || ""}
                                            disabled={!isSuperUser}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Empresa" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {isSuperUser ? empresas.map((e) => (
                                                    <SelectItem key={e.id} value={e.id.toString()}>
                                                        {e.nombre}
                                                    </SelectItem>
                                                )) : (
                                                    <SelectItem value={pasajero?.empresa_id?.toString() || ""}>
                                                        Cargando...
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
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
                                                    <SelectValue placeholder={loadingData ? "Cargando..." : "Seleccionar convenio"} />
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

                        {selectedConvenio && (
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="col-span-2">
                                    <label className="text-sm font-semibold">Documentos Requeridos</label>
                                </div>
                                {(() => {
                                    const labels = [...(selectedConvenio.imagenes || [])];
                                    if (labels.length === 0) {
                                        labels.push("Cédula de Identidad Frontal");
                                    }
                                    
                                    return labels.map((label, index) => (
                                        <FormItem key={index}>
                                            <FormLabel>{label}</FormLabel>
                                            <FormControl>
                                                <div
                                                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition flex items-center justify-center min-h-[120px]"
                                                    onClick={() => document.getElementById(`file-update-${label}`)?.click()}
                                                >
                                                    <input
                                                        id={`file-update-${label}`}
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
                                                                    <span className="text-xs mt-1 truncate max-w-full italic text-muted-foreground">PDF</span>
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
                                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
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
                                        </FormItem>
                                    ));
                                })()}
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

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <SaveIcon className="h-4 w-4 mr-2" />
                                )}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
