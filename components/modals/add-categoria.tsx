"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CategoriasService } from "@/services/categoria.service"
import { toast } from "sonner"
import { Loader2, ChevronsUpDown, Check } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface AddCategoriaModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    empresas?: any[]
}

export default function AddCategoriaModal({
    open,
    onOpenChange,
    onSuccess,
    empresas = []
}: AddCategoriaModalProps) {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [openEmpresaPopover, setOpenEmpresaPopover] = useState(false)
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        empresa_id: "" as string | number
    })

    const isAdmin = user?.rol?.toUpperCase() === "ADMINISTRADOR" || user?.rol?.toUpperCase() === "SOPORTE";

    // Set default empresa_id from user if not admin
    useEffect(() => {
        if (open && !isAdmin) {
            const empresaId = user?.empresa_id || user?.id_empresa;
            if (empresaId) {
                setFormData(prev => ({ ...prev, empresa_id: empresaId }))
            }
        }
    }, [open, isAdmin, user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nombre.trim()) {
            toast.error("El nombre es obligatorio")
            return
        }

        if (!formData.empresa_id) {
            toast.error("La empresa es obligatoria")
            return
        }

        setIsLoading(true)
        try {
            await CategoriasService.createCategoria({
                ...formData,
                empresa_id: Number(formData.empresa_id)
            })
            toast.success("Categoría creada correctamente")
            setFormData({ nombre: "", descripcion: "", empresa_id: isAdmin ? "" : (user?.empresa_id || "") })
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
                    {isAdmin && (
                        <Field>
                            <FieldLabel>Empresa</FieldLabel>
                            <Popover open={openEmpresaPopover} onOpenChange={setOpenEmpresaPopover}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn("w-full justify-between", !formData.empresa_id && "text-muted-foreground")}
                                    >
                                        {formData.empresa_id
                                            ? empresas.find((e) => e.id === Number(formData.empresa_id))?.nombre || "Seleccionar empresa"
                                            : "Seleccionar empresa"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[425px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar empresa..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontró la empresa.</CommandEmpty>
                                            <CommandGroup>
                                                {empresas.map((empresa) => (
                                                    <CommandItem
                                                        key={empresa.id}
                                                        value={empresa.nombre}
                                                        onSelect={() => {
                                                            setFormData({ ...formData, empresa_id: empresa.id })
                                                            setOpenEmpresaPopover(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.empresa_id === empresa.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {empresa.nombre}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </Field>
                    )}

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
