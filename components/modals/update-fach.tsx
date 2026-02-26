// "use client"

// import { useEffect, useState } from "react"
// import { Button } from "@/components/ui/button"
// import * as Dialog from "@/components/ui/dialog"
// import * as Form from "@/components/ui/form"
// import * as Icon from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { useForm } from "react-hook-form"
// import { z } from "zod"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { FachService, Fach } from "@/services/fach.service"
// import { Empresa } from "@/services/empresa.service"
// import { toast } from "sonner"
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select"

// interface UpdateFachModalProps {
//     open: boolean;
//     onOpenChange: (open: boolean) => void;
//     fach: Fach | null;
//     onSuccess?: () => void;
//     empresas: Empresa[];
// }

// const fachSchema = z.object({
//     nombre_completo: z
//         .string()
//         .min(3, "El nombre debe tener al menos 3 caracteres")
//         .max(100, "El nombre es demasiado largo"),
//     rut: z
//         .string()
//         .min(7, "RUT inválido")
//         .max(8, "RUT inválido")
//         .transform((val) => val.replace(/\./g, ""))
//         .refine((val) => /^[0-9]+$/.test(val), {
//             message: "El RUT no debe incluir dígito verificador ni guión",
//         }),
//     empresa_id: z.number({
//         required_error: "Debe seleccionar una empresa",
//     }),
//     convenio_id: z.number().optional().nullable(),
//     status: z.enum(["ACTIVO", "INACTIVO"]),
// })

// type FachFormValues = z.infer<typeof fachSchema>

// export default function UpdateFachModal({
//     open,
//     onOpenChange,
//     fach,
//     onSuccess,
//     empresas,
// }: UpdateFachModalProps) {
//     const [loading, setLoading] = useState(false)

//     const form = useForm<FachFormValues>({
//         resolver: zodResolver(fachSchema),
//         defaultValues: {
//             nombre_completo: "",
//             rut: "",
//             empresa_id: undefined,
//             convenio_id: null,
//             status: "ACTIVO",
//         },
//     })

//     useEffect(() => {
//         if (fach) {
//             form.reset({
//                 nombre_completo: fach.nombre_completo,
//                 rut: fach.rut,
//                 empresa_id: fach.empresa.id,
//                 convenio_id: fach.convenio_id,
//                 status: fach.status,
//             })
//         }
//     }, [fach, form])

//     const onSubmit = async (data: FachFormValues) => {
//         if (!fach) return

//         setLoading(true)
//         try {
//             await FachService.updateFach(fach.id, data)
//             toast.success("Fach actualizado correctamente")
//             onSuccess?.()
//             onOpenChange(false)
//         } catch (error) {
//             console.error("Error updating fach:", error)
//             toast.error("No se pudo actualizar el registro")
//         } finally {
//             setLoading(false)
//         }
//     }

//     return (
//         <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
//             <Dialog.DialogContent className="max-w-2xl">
//                 <Dialog.DialogHeader>
//                     <Dialog.DialogTitle>Editar Fach</Dialog.DialogTitle>
//                     <Dialog.DialogDescription>
//                         Modifique los datos del registro.
//                     </Dialog.DialogDescription>
//                 </Dialog.DialogHeader>

//                 <Form.Form {...form}>
//                     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                         <div className="grid grid-cols-1 gap-4">
//                             <Form.FormField
//                                 control={form.control}
//                                 name="nombre_completo"
//                                 render={({ field }) => (
//                                     <Form.FormItem>
//                                         <Form.FormLabel>Nombre</Form.FormLabel>
//                                         <Form.FormControl>
//                                             <Input placeholder="Nombre completo" {...field} />
//                                         </Form.FormControl>
//                                         <Form.FormMessage />
//                                     </Form.FormItem>
//                                 )}
//                             />

//                             <Form.FormField
//                                 control={form.control}
//                                 name="rut"
//                                 render={({ field }) => (
//                                     <Form.FormItem>
//                                         <Form.FormLabel>RUT</Form.FormLabel>
//                                         <Form.FormControl>
//                                             <Input placeholder="12345678" {...field} disabled />
//                                         </Form.FormControl>
//                                         <Form.FormDescription>
//                                             El RUT no puede ser modificado.
//                                         </Form.FormDescription>
//                                         <Form.FormMessage />
//                                     </Form.FormItem>
//                                 )}
//                             />

//                             <Form.FormField
//                                 control={form.control}
//                                 name="empresa_id"
//                                 render={({ field }) => (
//                                     <Form.FormItem>
//                                         <Form.FormLabel>Empresa</Form.FormLabel>
//                                         <Select
//                                             onValueChange={(value) => field.onChange(Number(value))}
//                                             value={field.value?.toString()}
//                                         >
//                                             <Form.FormControl>
//                                                 <SelectTrigger>
//                                                     <SelectValue placeholder="Seleccione una empresa" />
//                                                 </SelectTrigger>
//                                             </Form.FormControl>
//                                             <SelectContent>
//                                                 {empresas.map((empresa) => (
//                                                     <SelectItem key={empresa.id} value={empresa.id.toString()}>
//                                                         {empresa.nombre}
//                                                     </SelectItem>
//                                                 ))}
//                                             </SelectContent>
//                                         </Select>
//                                         <Form.FormMessage />
//                                     </Form.FormItem>
//                                 )}
//                             />

//                             <Form.FormField
//                                 control={form.control}
//                                 name="convenio_id"
//                                 render={({ field }) => (
//                                     <Form.FormItem>
//                                         <Form.FormLabel>Convenio ID (Opcional)</Form.FormLabel>
//                                         <Form.FormControl>
//                                             <Input
//                                                 type="number"
//                                                 placeholder="ID del convenio"
//                                                 {...field}
//                                                 value={field.value ?? ''}
//                                                 onChange={(e) => {
//                                                     const value = e.target.value;
//                                                     field.onChange(value ? Number(value) : null);
//                                                 }}
//                                             />
//                                         </Form.FormControl>
//                                         <Form.FormMessage />
//                                     </Form.FormItem>
//                                 )}
//                             />

//                             <Form.FormField
//                                 control={form.control}
//                                 name="status"
//                                 render={({ field }) => (
//                                     <Form.FormItem>
//                                         <Form.FormLabel>Estado</Form.FormLabel>
//                                         <Select
//                                             onValueChange={field.onChange}
//                                             value={field.value}
//                                         >
//                                             <Form.FormControl>
//                                                 <SelectTrigger>
//                                                     <SelectValue placeholder="Seleccione estado" />
//                                                 </SelectTrigger>
//                                             </Form.FormControl>

//                                             <SelectContent>
//                                                 <SelectItem value="ACTIVO">Activo</SelectItem>
//                                                 <SelectItem value="INACTIVO">Inactivo</SelectItem>
//                                             </SelectContent>
//                                         </Select>
//                                         <Form.FormMessage />
//                                     </Form.FormItem>
//                                 )}
//                             />
//                         </div>
//                         <div className="flex justify-end space-x-2 pt-4">
//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 onClick={() => onOpenChange(false)}
//                                 disabled={loading}
//                             >
//                                 Cancelar
//                             </Button>

//                             <Button type="submit" disabled={loading}>
//                                 {loading ? (
//                                     <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" />
//                                 ) : (
//                                     <Icon.PencilIcon className="h-4 w-4 mr-2" />
//                                 )}
//                                 Guardar Cambios
//                             </Button>
//                         </div>
//                     </form>
//                 </Form.Form>
//             </Dialog.DialogContent>
//         </Dialog.Dialog>
//     )
// }