"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CategoriasService, type Categoria } from "@/services/categoria.service"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface UpdateCategoriaModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    categoria: Categoria | null
}

export default function UpdateCategoriaModal({
    open,
    onOpenChange,
    onSuccess,
    categoria
}: UpdateCategoriaModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: ""
    })

    useEffect(() => {
        if (categoria) {
            setFormData({
                nombre: categoria.nombre,
                descripcion: categoria.descripcion || ""
            })
        }
    }, [categoria])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!categoria) return
        if (!formData.nombre.trim()) {
            toast.error("El nombre es obligatorio")
            return
        }

        setIsLoading(true)
        try {
            await CategoriasService.updateCategoria(categoria.id, formData)
            toast.success("Categoría actualizada correctamente")
            onSuccess()
        } catch (error) {
            console.error("Error updating categoria:", error)
            toast.error("No se pudo actualizar la categoría")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="sm:max-w-[425px]">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Editar Categoría</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Modifique los datos de la categoría.
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
                            Guardar Cambios
                        </Button>
                    </Dialog.DialogFooter>
                </form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
