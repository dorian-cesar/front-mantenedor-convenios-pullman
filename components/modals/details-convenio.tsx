"use client"

import * as Dialog from "@/components/ui/dialog"
import { Convenio } from "@/services/convenio.service"
import { formatDateOnly } from "@/utils/helpers"

interface DetailsConvenioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    convenio: Convenio | null
}

export default function DetailsConvenioModal({
    open,
    onOpenChange,
    convenio,
}: DetailsConvenioModalProps) {
    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Detalles del Convenio</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Información detallada del convenio {convenio?.nombre}
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="grid gap-4 grid-cols-2">
                    <div>
                        <p className="text-sm font-medium leading-none">
                            ID
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {convenio?.id}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Nombre
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {convenio?.nombre}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Empresa
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {convenio?.empresa?.nombre || "Sin empresa asignada"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            RUT Empresa
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {convenio?.empresa?.rut || "N/A"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Estado
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {convenio?.status}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Fecha de creación
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {convenio?.createdAt ? formatDateOnly(convenio.createdAt) : "N/A"}
                        </p>
                    </div>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}