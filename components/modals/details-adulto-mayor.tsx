"use client"

import * as Dialog from "@/components/ui/dialog"
import { AdultoMayor } from "@/services/adulto-mayor.service"
import { formatDateOnly } from "@/utils/helpers"
import { getFileSrc, isPDF } from "@/utils/helpers"
import { useState } from "react"
import FileViewerModal from "./file-viewer-modal"
import { Button } from "@/components/ui/button"
import { Maximize2Icon, FileTextIcon } from "lucide-react"

interface DetailsAdultoMayorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    adultoMayor: AdultoMayor | null
}

export default function DetailsAdultoMayorModal({
    open,
    onOpenChange,
    adultoMayor,
}: DetailsAdultoMayorModalProps) {
    const [openFileViewer, setOpenFileViewer] = useState(false)

    const handleFileClick = () => {
        if (adultoMayor?.imagen_cedula_identidad) {
            setOpenFileViewer(true)
        }
    }

    const renderFilePreview = () => {
        if (!adultoMayor?.imagen_cedula_identidad) {
            return (
                <div className="h-48 w-full flex items-center justify-center border rounded-lg text-muted-foreground">
                    Sin archivo
                </div>
            )
        }

        const fileIsPDF = isPDF(adultoMayor.imagen_cedula_identidad)

        return (
            <div className="relative group h-48 w-full max-w-md mx-auto">
                <div
                    className="h-full w-full flex items-center justify-center border rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-muted/10 overflow-hidden"
                    onClick={handleFileClick}
                >
                    {fileIsPDF ? (
                        <div className="flex flex-col items-center justify-center p-4">
                            <FileTextIcon className="h-16 w-16 text-primary mb-2" />
                            <span className="text-sm text-muted-foreground text-center">Documento PDF</span>
                            <span className="text-xs text-muted-foreground mt-1">Click para ver</span>
                        </div>
                    ) : (
                        <img
                            src={getFileSrc(adultoMayor.imagen_cedula_identidad) || ""}
                            alt="Documento adulto mayor"
                            className="h-full w-full object-contain"
                        />
                    )}
                </div>
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleFileClick}
                    title="Ver archivo completo"
                >
                    <Maximize2Icon className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <>
            <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
                <Dialog.DialogContent className="max-w-2xl">
                    <Dialog.DialogHeader>
                        <Dialog.DialogTitle>Detalles del Adulto Mayor</Dialog.DialogTitle>
                        <Dialog.DialogDescription>
                            Información de {adultoMayor?.nombre}
                        </Dialog.DialogDescription>
                    </Dialog.DialogHeader>

                    <div className="mb-6">
                        <p className="text-sm font-medium mb-2">Documento (Cédula de Identidad)</p>
                        {renderFilePreview()}
                    </div>

                    <div className="grid gap-4 grid-cols-2">
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Nombre</p>
                            <p className="text-sm">{adultoMayor?.nombre}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">RUT</p>
                            <p className="text-sm">{adultoMayor?.rut}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Teléfono</p>
                            <p className="text-sm">{adultoMayor?.telefono}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Correo</p>
                            <p className="text-sm">{adultoMayor?.correo}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Dirección</p>
                            <p className="text-sm">{adultoMayor?.direccion}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Estado</p>
                            <p className="text-sm">{adultoMayor?.status}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Fecha de creación</p>
                            <p className="text-sm">
                                {formatDateOnly(String(adultoMayor?.createdAt || 0))}
                            </p>
                        </div>
                        {(adultoMayor?.razon_rechazo && adultoMayor?.status === "RECHAZADO") && (
                            <div>
                                <p className="text-sm font-medium leading-none text-muted-foreground">Razón de rechazo</p>
                                <p className="text-sm">
                                    {adultoMayor?.razon_rechazo}
                                </p>
                            </div>
                        )}
                    </div>
                </Dialog.DialogContent>
            </Dialog.Dialog>

            <FileViewerModal
                open={openFileViewer}
                onOpenChange={setOpenFileViewer}
                fileSrc={adultoMayor?.imagen_cedula_identidad || null}
                title={`Documento de ${adultoMayor?.nombre}`}
            />
        </>
    )
}