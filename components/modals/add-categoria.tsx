"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CategoriasService } from "@/services/categoria.service"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface AddCategoriaModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export default function AddCategoriaModal({
    open,
    onOpenChange,
    onSuccess
}: AddCategoriaModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nombre.trim()) {
            toast.error("El nombre es obligatorio")
            return
        }

        setIsLoading(true)
        try {
            await CategoriasService.createCategoria(formData)
            toast.success("Categoría creada correctamente")
            setFormData({ nombre: "", descripcion: "" })
            onSuccess()
        } catch (error) {
            console.error("Error creating categoria:", error)
            toast.error("No se pudo crear la categoría")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="sm:max-w-[425px]">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Nueva Categoría</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Cree una nueva categoría para organizar sus convenios.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <Field>
                        <FieldLabel>Nombre</FieldLabel>
                        <Input
                            placeholder="Nombre de la categoría"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </Field>

                    <Field>
                        <FieldLabel>Descripción</FieldLabel>
                        <Textarea
                            placeholder="Breve descripción (opcional)"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        />
                    </Field>

                    <Dialog.DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Categoría
                        </Button>
                    </Dialog.DialogFooter>
                </form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
