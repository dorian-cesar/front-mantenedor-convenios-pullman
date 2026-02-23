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
import { toast } from "sonner"

interface RechazarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (motivo: string) => Promise<void>
}

const rechazarSchema = z
    .object({
        motivo: z.string().min(1, "El motivo es requerido"),
    })

type RechazarFormValues = z.infer<typeof rechazarSchema>

export default function RechazarModal({
    open,
    onOpenChange,
    onSubmit,
}: RechazarProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<RechazarFormValues>({
        resolver: zodResolver(rechazarSchema),
        defaultValues: {
            motivo: "",
        },
    })

    useEffect(() => {
        if (!open) {
            form.reset()
        }
    }, [open, form])

    const handleSubmit = async (data: RechazarFormValues) => {
        setIsLoading(true)
        try {
            await onSubmit(data.motivo)
            onOpenChange(false)
        } catch (error) {
            setIsLoading(false)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Rechazar Solicitud</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Complete el motivo del rechazo de la solicitud.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <Form.Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <Form.FormField
                            control={form.control}
                            name="motivo"
                            render={({ field }) => (
                                <Form.FormItem>
                                    <Form.FormLabel>Motivo del rechazo</Form.FormLabel>
                                    <Form.FormControl>
                                        <Input placeholder="Motivo del rechazo" {...field} />
                                    </Form.FormControl>
                                    <Form.FormMessage />
                                </Form.FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2">
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
                                    <Icon.XIcon className="h-4 w-4 mr-2" />
                                )}
                                Rechazar
                            </Button>
                        </div>
                    </form>
                </Form.Form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}