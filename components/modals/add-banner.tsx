"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import * as Form from "@/components/ui/form"
import * as Icon from "lucide-react"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { BannersService } from "@/services/banner.service"
import { toast } from "sonner"
import * as Select from "@/components/ui/select"

interface AddBannerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const bannerSchema = z.object({
    image: z.any().refine((file) => file instanceof File, "Debe seleccionar una imagen"),
    list_type: z.enum(["A", "B"], { required_error: "Seleccione una lista" }),
    order: z.string().optional()
})

type BannerFormValues = z.infer<typeof bannerSchema>

export default function AddBannerModal({
    open,
    onOpenChange,
    onSuccess,
}: AddBannerModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [filePreview, setFilePreview] = useState<string | null>(null)

    const form = useForm<BannerFormValues>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            list_type: "A",
            order: "",
        },
    })

    const watchListType = form.watch("list_type")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            form.setValue("image", file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setFilePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const onSubmit = async (data: BannerFormValues) => {
        setIsLoading(true)

        try {
            await BannersService.createBanner({
                image: data.image,
                list_type: data.list_type,
                order: data.order ? parseInt(data.order) : undefined
            })

            toast.success("Banner subido correctamente")

            form.reset()
            setFilePreview(null)
            onSuccess?.()
        } catch (error) {
            console.error("Error creating banner:", error)
            toast.error("No se pudo subir el banner")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Agregar Nuevo Banner</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Sube una imagen y asígnala a una lista para el Hero.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        
                        <div className="space-y-2">
                            <Form.FormLabel>Imagen del Banner</Form.FormLabel>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                            {form.formState.errors.image && (
                                <p className="text-sm font-medium text-destructive">
                                    {String(form.formState.errors.image.message)}
                                </p>
                            )}
                            {filePreview && (
                                <div className="mt-2 w-full h-32 relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                    <img src={filePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                                </div>
                            )}
                        </div>

                        <Form.FormField
                            control={form.control}
                            name="list_type"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Lista (A o B)</Form.FormLabel>
                                    <Select.Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <Form.FormControl>
                                            <Select.SelectTrigger>
                                                <Select.SelectValue placeholder="Seleccione una lista" />
                                            </Select.SelectTrigger>
                                        </Form.FormControl>
                                        <Select.SelectContent>
                                            <Select.SelectItem value="A">Lista A (Fijos)</Select.SelectItem>
                                            <Select.SelectItem value="B">Lista B (Aleatorios)</Select.SelectItem>
                                        </Select.SelectContent>
                                    </Select.Select>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        {watchListType === "A" && (
                            <Form.FormField
                                control={form.control}
                                name="order"
                                render={({ field }) => (
                                    <Form.FormItem>
                                        <Form.FormLabel>Orden (Ej: 1, 2, 3)</Form.FormLabel>
                                        <Form.FormControl>
                                            <Input type="number" placeholder="Ingrese el orden" {...field} />
                                        </Form.FormControl>
                                        <Form.FormMessage />
                                    </Form.FormItem>
                                )}
                            />
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false)
                                    form.reset()
                                    setFilePreview(null)
                                }}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Icon.PlusIcon className="h-4 w-4 mr-2" />
                                )}
                                Subir Banner
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
