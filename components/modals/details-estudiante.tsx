"use client"

import * as Dialog from "@/components/ui/dialog"
import { Estudiante } from "@/services/estudiante.service"
import { formatDateOnly } from "@/utils/helpers"
import { getFileSrc, isPDF } from "@/utils/helpers"
import { useState } from "react"
import FileViewerModal from "./file-viewer-modal"
import { Button } from "@/components/ui/button"
import { Maximize2Icon, FileTextIcon } from "lucide-react"

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
    const [openFileViewer, setOpenFileViewer] = useState(false)
    const [selectedFile, setSelectedFile] = useState<{ src: string; title: string } | null>(null)

    const handleFileClick = (fileSrc: string, title: string) => {
        setSelectedFile({ src: fileSrc, title })
        setOpenFileViewer(true)
    }

    const renderFilePreview = (fileSrc: string | undefined, title: string, onClick: () => void) => {
        if (!fileSrc) {
            return (
                <div className="h-48 w-full flex items-center justify-center border rounded-lg text-muted-foreground">
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
                            src={getFileSrc(fileSrc) || ""}
                            alt={title}
                            className="h-full w-full object-contain"
                        />
                    )}
                </div>
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={onClick}
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
                <Dialog.DialogContent className="max-w-4xl">
                    <Dialog.DialogHeader>
                        <Dialog.DialogTitle>Detalles del Estudiante</Dialog.DialogTitle>
                        <Dialog.DialogDescription>
                            Información de {estudiante?.nombre}
                        </Dialog.DialogDescription>
                    </Dialog.DialogHeader>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <p className="text-sm font-medium mb-2">Cédula de Identidad</p>
                            {renderFilePreview(
                                estudiante?.imagen_cedula_identidad,
                                `Cédula de ${estudiante?.nombre}`,
                                () => estudiante?.imagen_cedula_identidad &&
                                    handleFileClick(estudiante.imagen_cedula_identidad, `Cédula de ${estudiante?.nombre}`)
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">Certificado Alumno Regular</p>
                            {renderFilePreview(
                                estudiante?.imagen_certificado_alumno_regular,
                                `Certificado de ${estudiante?.nombre}`,
                                () => estudiante?.imagen_certificado_alumno_regular &&
                                    handleFileClick(estudiante.imagen_certificado_alumno_regular, `Certificado de ${estudiante?.nombre}`)
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 grid-cols-2">
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Nombre</p>
                            <p className="text-sm">{estudiante?.nombre}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">RUT</p>
                            <p className="text-sm">{estudiante?.rut}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Teléfono</p>
                            <p className="text-sm">{estudiante?.telefono}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Correo</p>
                            <p className="text-sm">{estudiante?.correo}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Dirección</p>
                            <p className="text-sm">{estudiante?.direccion}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Estado</p>
                            <p className="text-sm">{estudiante?.status}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Fecha de creación</p>
                            <p className="text-sm">
                                {formatDateOnly(String(estudiante?.createdAt || 0))}
                            </p>
                        </div>
                        {(estudiante?.razon_rechazo && estudiante?.status === "RECHAZADO") && (
                            <div>
                                <p className="text-sm font-medium leading-none text-muted-foreground">Motivo de rechazo</p>
                                <p className="text-sm">{estudiante?.razon_rechazo}</p>
                            </div>
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