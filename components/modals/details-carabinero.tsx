import * as Dialog from "@/components/ui/dialog"
import { Carabinero } from "@/services/carabineros.service"
import { formatDateOnly } from "@/utils/helpers"
import { Button } from "@/components/ui/button"
import * as Icon from "lucide-react"

interface DetailsCarabineroModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    carabinero: Carabinero | null
    onToggleStatus?: (rut: string, currentStatus: "ACTIVO" | "INACTIVO") => Promise<void>
}

export default function DetailsCarabineroModal({
    open,
    onOpenChange,
    carabinero,
    onToggleStatus,
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

                <div className="grid gap-4 grid-cols-2 mb-6">
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

                <div className="flex justify-end gap-2 border-t pt-4 mt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                    {carabinero && onToggleStatus && (
                        <Button
                            variant={carabinero.status === "ACTIVO" ? "destructive" : "default"}
                            onClick={() => {
                                onToggleStatus(carabinero.rut, carabinero.status as any)
                            }}
                        >
                            {carabinero.status === "ACTIVO" ? (
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
