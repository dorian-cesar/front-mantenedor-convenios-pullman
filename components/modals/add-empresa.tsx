"use client"

import * as Dialog from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { useEffect } from "react"

interface AddEmpresaModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type FormValues = {
    nombre: string
    rut: string
    estado: "active" | "inactive"
    convenio: "activo" | "vencido"
}

export default function AddEmpresaModal({ open, onOpenChange }: AddEmpresaModalProps) {

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors }
    } = useForm<FormValues>({
        defaultValues: {
            nombre: "",
            rut: "",
            estado: "active",
            convenio: "activo"
        }
    })

    useEffect(() => {
        if (!open) reset()
    }, [open, reset])

    const handleClose = () => {
        onOpenChange(false)
    }

    const onSubmit = (data: FormValues) => {
        console.log("Empresa guardada:", data)
        onOpenChange(false)
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Nueva Empresa</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Agrega una nueva empresa al sistema
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4 space-y-4">

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Nombre</label>
                            <Input
                                placeholder="Empresa S.A."
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
                            <label className="text-sm font-medium">RUT</label>
                            <Input
                                placeholder="12.345.678-9"
                                {...register("rut", {
                                    required: "El RUT es obligatorio"
                                })}
                            />
                            {errors.rut && (
                                <p className="text-sm text-destructive">
                                    {errors.rut.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Estado</label>
                            <Select
                                defaultValue="active"
                                onValueChange={(value) =>
                                    setValue("estado", value as FormValues["estado"])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Convenio</label>
                            <Select
                                defaultValue="activo"
                                onValueChange={(value) =>
                                    setValue("convenio", value as FormValues["convenio"])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar convenio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="activo">Activo</SelectItem>
                                    <SelectItem value="vencido">Vencido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>

                    <Dialog.DialogFooter>
                        <Button type="submit">Guardar</Button>
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
