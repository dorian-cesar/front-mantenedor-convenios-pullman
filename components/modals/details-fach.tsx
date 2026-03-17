"use client"

import * as Dialog from "@/components/ui/dialog"
import { Fach } from "@/services/fach.service"
import { formatDateOnly } from "@/utils/helpers"

interface DetailsFachModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fach: Fach | null
}

export default function DetailsFachModal({
    open,
    onOpenChange,
    fach,
}: DetailsFachModalProps) {
    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Detalles del Registro Fach</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Información de {fach?.nombre_completo}
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="grid gap-4 grid-cols-2">
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">ID</p>
                        <p className="text-sm">{fach?.id}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Nombre Completo</p>
                        <p className="text-sm">{fach?.nombre_completo}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Empresa</p>
                        <p className="text-sm">{fach?.empresa.nombre}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Convenio</p>
                        <p className="text-sm">{fach?.convenio?.nombre || "-"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Estado</p>
                        <p className="text-sm">{fach?.status}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Fecha de creación</p>
                        <p className="text-sm">
                            {formatDateOnly(String(fach?.createdAt || 0))}
                        </p>
                    </div>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
