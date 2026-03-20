"use client"

import * as Dialog from "@/components/ui/dialog"
import { Carabinero } from "@/services/carabineros.service"
import { formatDateOnly } from "@/utils/helpers"

interface DetailsCarabineroModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    carabinero: Carabinero | null
}

export default function DetailsCarabineroModal({
    open,
    onOpenChange,
    carabinero,
}: DetailsCarabineroModalProps) {
    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Detalles del Carabinero</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Información de {carabinero?.nombre_completo}
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="grid gap-4 grid-cols-2">
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">ID</p>
                        <p className="text-sm">{carabinero?.id}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Nombre Completo</p>
                        <p className="text-sm">{carabinero?.nombre_completo}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">RUT</p>
                        <p className="text-sm">{carabinero?.rut}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Convenio</p>
                        <p className="text-sm">{carabinero?.convenio?.nombre || "-"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Estado</p>
                        <p className="text-sm">{carabinero?.status}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none text-muted-foreground">Fecha de creación</p>
                        <p className="text-sm">
                            {formatDateOnly(String(carabinero?.createdAt || 0))}
                        </p>
                    </div>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
