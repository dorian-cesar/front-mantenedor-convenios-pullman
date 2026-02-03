"use client"

import * as Dialog from "@/components/ui/dialog"
import { formatDateOnly } from "@/utils/helpers"
import { Usuario } from "@/services/usuario.service"

interface DetailsUsuarioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    usuario: Usuario | null
    onSuccess?: () => void
}


export default function DetailsUsuarioModal({
    open,
    onOpenChange,
    usuario,
}: DetailsUsuarioModalProps) {
    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Detalles</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Detalles del usuario {usuario?.correo}
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="grid gap-4 grid-cols-2">
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Nombre
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {usuario?.nombre || "Sin nombre"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Correo
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {usuario?.correo}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            RUT
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {usuario?.rut || "Sin RUT"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Telefono
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {usuario?.telefono || "Sin telefono"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Status
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {usuario?.status}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Rol
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {usuario?.rol || "USUARIO"}
                        </p>
                    </div>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}