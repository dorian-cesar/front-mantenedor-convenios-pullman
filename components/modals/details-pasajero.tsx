import * as Dialog from "@/components/ui/dialog"
import { Pasajero } from "@/services/pasajero.service"
import { formatDateOnly, getFileSrc, isPDF } from "@/utils/helpers"
import { useState } from "react"
import FileViewerModal from "./file-viewer-modal"
import { Button } from "@/components/ui/button"
import { Maximize2Icon, FileTextIcon, Ban, CheckCircle2 } from "lucide-react"

interface DetailsPasajeroModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pasajero: Pasajero | null
    onToggleStatus?: (id: number, currentStatus: "ACTIVO" | "INACTIVO") => Promise<void>
}

export default function DetailsPasajeroModal({
    open,
    onOpenChange,
    pasajero,
    onToggleStatus,
}: DetailsPasajeroModalProps) {
    const [openFileViewer, setOpenFileViewer] = useState(false)
    const [selectedFile, setSelectedFile] = useState<{ src: string; title: string } | null>(null)

    const handleFileClick = (fileSrc: string, title: string) => {
        setSelectedFile({ src: fileSrc, title })
        setOpenFileViewer(true)
    }

    const renderFilePreview = (fileSrc: string | undefined, title: string, onClick: () => void) => {
        if (!fileSrc) {
            return (
                <div className="h-48 w-full flex items-center justify-center border rounded-lg text-muted-foreground bg-muted/5">
                    Sin archivo
                </div>
            )
        }

        const fileIsPDF = isPDF(fileSrc)

        return (
            <div className="relative group h-48 w-full">
                <div
                    className="h-full w-full flex items-center justify-center border rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-muted/10 overflow-hidden"
                    onClick={onClick}
                >
                    {fileIsPDF ? (
                        <div className="flex flex-col items-center justify-center p-4">
                            <FileTextIcon className="h-16 w-16 text-primary mb-2" />
                            <span className="text-sm text-muted-foreground text-center">Documento PDF</span>
                            <span className="text-xs text-muted-foreground mt-1">Click para ver</span>
                        </div>
                    ) : (
                        <img
                            src={getFileSrc(fileSrc || "") || ""}
                            alt={title}
                            className="h-full w-full object-contain"
                        />
                    )}
                </div>
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={onClick}
                >
                    <Maximize2Icon className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <>
            <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
                <Dialog.DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <Dialog.DialogHeader>
                        <Dialog.DialogTitle>Detalles del Pasajero</Dialog.DialogTitle>
                        <Dialog.DialogDescription>
                            Información detallada de {pasajero?.nombres} {pasajero?.apellidos}
                        </Dialog.DialogDescription>
                    </Dialog.DialogHeader>

                    <div className="grid gap-6 grid-cols-2 mb-8 bg-muted/5 p-4 rounded-xl border border-muted">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Nombre Completo</p>
                            <p className="text-sm font-medium">{pasajero?.nombres} {pasajero?.apellidos}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">RUT</p>
                            <p className="text-sm font-medium">{pasajero?.rut}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Teléfono</p>
                            <p className="text-sm font-medium">{pasajero?.telefono || "-"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Correo</p>
                            <p className="text-sm font-medium">{pasajero?.correo || "-"}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Dirección</p>
                            <p className="text-sm font-medium">{pasajero?.direccion || "-"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Estado</p>
                            <p className="text-sm font-medium">{pasajero?.status}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Fecha de Registro</p>
                            <p className="text-sm font-medium">
                                {pasajero?.createdAt ? formatDateOnly(pasajero.createdAt) : "-"}
                            </p>
                        </div>
                    </div>

                    {pasajero?.imagenes && Object.keys(pasajero.imagenes).length > 0 && (
                        <div className="space-y-4 mb-6">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-primary/80 border-b pb-2">Documentos y Adjuntos</h4>
                            <div className="grid grid-cols-2 gap-6">
                                {Object.entries(pasajero.imagenes).map(([key, src]) => {
                                    if (!src) return null;
                                    return (
                                        <div key={key} className="space-y-2">
                                            <p className="text-[11px] font-semibold text-muted-foreground">{key}</p>
                                            {renderFilePreview(
                                                src,
                                                `${key} de ${pasajero?.nombres}`,
                                                () => handleFileClick(src, `${key} de ${pasajero?.nombres}`)
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t pt-4 mt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                        {pasajero && onToggleStatus && (
                            <Button
                                variant={pasajero.status === "ACTIVO" ? "destructive" : "default"}
                                onClick={() => {
                                    onToggleStatus(pasajero.id, pasajero.status)
                                }}
                            >
                                {pasajero.status === "ACTIVO" ? (
                                    <><Ban className="mr-2 h-4 w-4" /> Desactivar</>
                                ) : (
                                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Activar</>
                                )}
                            </Button>
                        )}
                    </div>
                </Dialog.DialogContent>
            </Dialog.Dialog>

            <FileViewerModal
                open={openFileViewer}
                onOpenChange={setOpenFileViewer}
                fileSrc={selectedFile?.src || null}
                title={selectedFile?.title || "Documento"}
            />
        </>
    )
}
