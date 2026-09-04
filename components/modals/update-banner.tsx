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
import { BannersService, type Banner } from "@/services/banner.service"
import { toast } from "sonner"
import * as Select from "@/components/ui/select"

interface UpdateBannerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    banner: Banner | null
    onSuccess?: () => void
}

const bannerUpdateSchema = z.object({
    list_type: z.enum(["A", "B"], { required_error: "Seleccione una lista" }),
    order: z.string().optional()
})

type BannerUpdateFormValues = z.infer<typeof bannerUpdateSchema>

export default function UpdateBannerModal({
    open,
    onOpenChange,
    banner,
    onSuccess,
}: UpdateBannerModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<BannerUpdateFormValues>({
        resolver: zodResolver(bannerUpdateSchema),
        defaultValues: {
            list_type: "A",
            order: "",
        },
    })

    useEffect(() => {
        if (banner) {
            form.reset({
                list_type: banner.list_type,
                order: banner.order ? String(banner.order) : "",
            })
        }
    }, [banner, form])

    const watchListType = form.watch("list_type")

    const onSubmit = async (data: BannerUpdateFormValues) => {
        if (!banner) return;
        setIsLoading(true)

        try {
            await BannersService.updateBanner(banner.id, {
                list_type: data.list_type,
                order: data.list_type === "A" && data.order ? parseInt(data.order) : null
            })

            toast.success("Banner actualizado correctamente")
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error("Error updating banner:", error)
            toast.error("No se pudo actualizar el banner")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Actualizar Banner</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique la configuración de este banner.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        
                        <div className="flex justify-center mb-4">
                            <div className="w-full h-32 relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                {banner && (
                                    <img src={process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') + banner.image_url : banner.image_url} alt="Banner" className="max-h-full max-w-full object-contain" />
                                )}
                            </div>
                        </div>

                        <Form.FormField
                            control={form.control}
                            name="list_type"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Lista (A o B)</Form.FormLabel>
                                    <Select.Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <Icon.Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Icon.SaveIcon className="h-4 w-4 mr-2" />
                                )}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
