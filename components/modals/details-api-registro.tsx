"use client"

import * as Dialog from "@/components/ui/dialog"
import { BadgeStatus } from "@/components/ui/badge-status"
import { type ApiRegistro } from "@/services/api-registro.service"

interface DetailsApiRegistroModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    apiRegistro: ApiRegistro | null
}

export default function DetailsApiRegistroModal({ open, onOpenChange, apiRegistro }: DetailsApiRegistroModalProps) {
    if (!apiRegistro) return null

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Detalles API de Registro</Dialog.DialogTitle>
                    <Dialog.DialogDescription>Información de la API de Registro seleccionada.</Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-1">
                        <span className="font-medium text-muted-foreground">ID</span>
                        <span className="col-span-2">{apiRegistro.id}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <span className="font-medium text-muted-foreground">Nombre</span>
                        <span className="col-span-2">{apiRegistro.nombre}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <span className="font-medium text-muted-foreground">Endpoint</span>
                        <span className="col-span-2 font-mono break-all">{apiRegistro.endpoint}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <span className="font-medium text-muted-foreground">Empresa</span>
                        <span className="col-span-2">{apiRegistro.empresa?.nombre || "Sin empresa"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <span className="font-medium text-muted-foreground">Estado</span>
                        <span className="col-span-2">
                            <BadgeStatus status={apiRegistro.status === "ACTIVO" ? "active" : "inactive"}>
                                {apiRegistro.status === "ACTIVO" ? "Activo" : "Inactivo"}
                            </BadgeStatus>
                        </span>
                    </div>
                    {apiRegistro.createdAt && (
                        <div className="grid grid-cols-3 gap-1">
                            <span className="font-medium text-muted-foreground">Creado</span>
                            <span className="col-span-2">{new Date(apiRegistro.createdAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
