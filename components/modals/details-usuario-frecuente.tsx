"use client"

import * as Dialog from "@/components/ui/dialog"
import { UsuarioFrecuente } from "@/services/usuario-frecuente.service"
import { formatDateOnly } from "@/utils/helpers"
import { useState } from "react"

interface DetailsUsuarioFrecuenteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    usuarioFrecuente: UsuarioFrecuente | null
}

export default function DetailsUsuarioFrecuenteModal({
    open,
    onOpenChange,
    usuarioFrecuente,
}: DetailsUsuarioFrecuenteModalProps) {

    return (
        <>
            <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
                <Dialog.DialogContent className="max-w-2xl">
                    <Dialog.DialogHeader>
                        <Dialog.DialogTitle>Detalles del Usuario Frecuente</Dialog.DialogTitle>
                        <Dialog.DialogDescription>
                            Información de {usuarioFrecuente?.nombre}
                        </Dialog.DialogDescription>
                    </Dialog.DialogHeader>

                    <div className="grid gap-4 grid-cols-2">
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Nombre</p>
                            <p className="text-sm">{usuarioFrecuente?.nombre}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">RUT</p>
                            <p className="text-sm">{usuarioFrecuente?.rut}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Teléfono</p>
                            <p className="text-sm">{usuarioFrecuente?.telefono}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Correo</p>
                            <p className="text-sm">{usuarioFrecuente?.correo}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Dirección</p>
                            <p className="text-sm">{usuarioFrecuente?.direccion}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Estado</p>
                            <p className="text-sm">{usuarioFrecuente?.status}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm font-medium leading-none text-muted-foreground">Fecha de creación</p>
                            <p className="text-sm">
                                {formatDateOnly(String(usuarioFrecuente?.createdAt || 0))}
                            </p>
                        </div>
                    </div>
                </Dialog.DialogContent>
            </Dialog.Dialog>
        </>
    )
}
