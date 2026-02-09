"use client"

import * as Dialog from "@/components/ui/dialog"
import { Api } from "@/services/api.service"

interface DetailsApiModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    api: Api | null
}

export default function DetailsApiModal({
    open,
    onOpenChange,
    api,
}: DetailsApiModalProps) {
    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent>
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Detalles de la API</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Información detallada de la API
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="grid gap-4 grid-cols-2">
                    <div>
                        <p className="text-sm font-medium leading-none">
                            ID
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {api?.id}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            Nombre
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {api?.nombre}
                        </p>
                    </div>

                    <div className="col-span-2">
                        <p className="text-sm font-medium leading-none">
                            Endpoint
                        </p>
                        <p className="text-sm text-muted-foreground font-mono break-all">
                            {api?.endpoint}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">
                            Status
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {api?.status}
                        </p>
                    </div>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}