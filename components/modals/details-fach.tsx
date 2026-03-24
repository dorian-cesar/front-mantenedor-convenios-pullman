import * as Dialog from "@/components/ui/dialog"
import { Fach } from "@/services/fach.service"
import { formatDateOnly } from "@/utils/helpers"
import { Button } from "@/components/ui/button"
import * as Icon from "lucide-react"

interface DetailsFachModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fach: Fach | null
    onToggleStatus?: (id: number, currentStatus: "ACTIVO" | "INACTIVO") => Promise<void>
}

export default function DetailsFachModal({
    open,
    onOpenChange,
    fach,
    onToggleStatus,
}: DetailsFachModalProps) {
    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Detalles del Registro Armada de Chile</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Información de {fach?.nombre_completo}
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="grid gap-4 grid-cols-2 mb-6">
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

                <div className="flex justify-end gap-2 border-t pt-4 mt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                    {fach && onToggleStatus && (
                        <Button
                            variant={fach.status === "ACTIVO" ? "destructive" : "default"}
                            onClick={() => {
                                onToggleStatus(fach.id, fach.status as any)
                                // We don't close the modal immediately so the user sees the change if the parent refreshes the 'fach' prop
                            }}
                        >
                            {fach.status === "ACTIVO" ? (
                                <><Icon.Ban className="mr-2 h-4 w-4" /> Desactivar</>
                            ) : (
                                <><Icon.CheckCircle2 className="mr-2 h-4 w-4" /> Activar</>
                            )}
                        </Button>
                    )}
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
