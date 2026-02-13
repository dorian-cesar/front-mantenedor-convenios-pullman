"use client"

import * as Dialog from "@/components/ui/dialog"
import { Estudiante } from "@/services/estudiante.service"
import { formatDateOnly } from "@/utils/helpers"

interface DetailsEstudianteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    estudiante: Estudiante | null
}

export default function DetailsEstudianteModal({
    open,
    onOpenChange,
    estudiante,
}: DetailsEstudianteModalProps) {
    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Detalles</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Detalles del estudiante {estudiante?.nombre}
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="grid gap-4 grid-cols-2">
                    <div>
                        <p className="text-sm font-medium leading-none">Nombre</p>
                        <p className="text-sm text-muted-foreground">{estudiante?.nombre}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">RUT</p>
                        <p className="text-sm text-muted-foreground">{estudiante?.rut}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">Teléfono</p>
                        <p className="text-sm text-muted-foreground">{estudiante?.telefono}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">Correo</p>
                        <p className="text-sm text-muted-foreground">{estudiante?.correo}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">Dirección</p>
                        <p className="text-sm text-muted-foreground">{estudiante?.direccion}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">Carnet Estudiante</p>
                        <p className="text-sm text-muted-foreground">{estudiante?.carnet_estudiante}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">Fecha Vencimiento</p>
                        <p className="text-sm text-muted-foreground">{estudiante?.fecha_vencimiento}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">Estado</p>
                        <p className="text-sm text-muted-foreground">{estudiante?.status}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">Fecha de creación</p>
                        <p className="text-sm text-muted-foreground">
                            {formatDateOnly(String(estudiante?.createdAt || 0))}
                        </p>
                    </div>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
