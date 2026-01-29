"use client"

import * as Dialog from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxList,
    ComboboxItem,
} from "@/components/ui/combobox"
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react"

interface Empresa {
    id: number
    nombre: string
}

interface AddConvenioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type FormValues = {
    nombre: string
    empresa_id: number | null
}

export default function AddConvenioModal({ open, onOpenChange }: AddConvenioModalProps) {
    const [loading, setLoading] = useState(false)
    const [empresas, setEmpresas] = useState<Empresa[]>([])

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors }
    } = useForm<FormValues>({
        defaultValues: {
            nombre: "",
            empresa_id: null
        }
    })

    const empresaSeleccionada = watch("empresa_id")

    useEffect(() => {
        if (!open) reset()
    }, [open, reset])

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const res = await fetch("/api/empresas")
                const data = await res.json()
                setEmpresas(data)
            } catch (error) {
                console.error("Error cargando empresas:", error)
            }
        }

        if (open) fetchEmpresas()
    }, [open])

    const handleClose = () => {
        onOpenChange(false)
    }

    const onSubmit = async (data: FormValues) => {
        if (!data.empresa_id) return

        try {
            setLoading(true)

            const response = await fetch("/api/convenios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error("Error al crear convenio")
            }

            console.log("Convenio creado:", data)
            onOpenChange(false)
        } catch (error) {
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Nuevo Convenio</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Crea un nuevo convenio asociado a una empresa
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <div className="space-y-4">

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Nombre</label>
                            <Input
                                placeholder="Convenio Verano"
                                {...register("nombre", {
                                    required: "El nombre es obligatorio"
                                })}
                            />
                            {errors.nombre && (
                                <p className="text-sm text-destructive">
                                    {errors.nombre.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Empresa</label>

                            <Combobox
                                items={empresas}
                                onValueChange={(empresa: Empresa | null) => {
                                    if (empresa) {
                                        setValue("empresa_id", empresa.id, {
                                            shouldValidate: true
                                        })
                                    } else {
                                        setValue("empresa_id", null, {
                                            shouldValidate: true
                                        })
                                    }
                                }}
                            >
                                <ComboboxInput placeholder="Seleccionar empresa..." />
                                <ComboboxContent>
                                    <ComboboxEmpty>No se encontraron empresas.</ComboboxEmpty>
                                    <ComboboxList>
                                        {(empresa: Empresa) => (
                                            <ComboboxItem
                                                key={empresa.id}
                                                value={empresa}
                                            >
                                                {empresa.nombre}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>

                            {!empresaSeleccionada && (
                                <p className="text-sm text-destructive">
                                    Debes seleccionar una empresa
                                </p>
                            )}
                        </div>

                    </div>

                    <Dialog.DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                    </Dialog.DialogFooter>
                </form>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
