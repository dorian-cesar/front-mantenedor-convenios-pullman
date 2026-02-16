"use client"

import * as Dialog from "@/components/ui/dialog"
import { AdultoMayor } from "@/services/adulto-mayor.service"
import { formatDateOnly } from "@/utils/helpers"
import { getImageSrc } from "@/utils/helpers"
import { useState } from "react"
import ImageViewerModal from "./image-viewer-modal"
import { Button } from "@/components/ui/button"
import { Maximize2Icon } from "lucide-react"

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
    const [openImageViewer, setOpenImageViewer] = useState(false)

    const handleImageClick = () => {
        if (adultoMayor?.imagen_base64) {
            setOpenImageViewer(true)
        }
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

                    <div className="relative flex justify-center mb-4 group">
                        {adultoMayor?.imagen_base64 ? (
                            <div className="relative">
                                <img
                                    src={getImageSrc(adultoMayor.imagen_base64) || ""}
                                    alt="Imagen adulto mayor"
                                    className="max-h-48 rounded-lg object-contain border cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={handleImageClick}
                                />
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={handleImageClick}
                                    title="Ver imagen completa"
                                >
                                    <Maximize2Icon className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="h-40 w-40 flex items-center justify-center border rounded-lg text-muted-foreground">
                                Sin imagen
                            </div>
                        )}
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
                            <p className="text-sm font-medium leading-none text-muted-foreground">Certificado</p>
                            <p className="text-sm">{adultoMayor?.certificado}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Fecha Emisión</p>
                            <p className="text-sm">{adultoMayor?.fecha_emision}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none text-muted-foreground">Estado</p>
                            <p className="text-sm">{adultoMayor?.status}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm font-medium leading-none text-muted-foreground">Fecha de creación</p>
                            <p className="text-sm">
                                {formatDateOnly(String(adultoMayor?.createdAt || 0))}
                            </p>
                        </div>
                    </div>
                </Dialog.DialogContent>
            </Dialog.Dialog>

            <ImageViewerModal
                open={openImageViewer}
                onOpenChange={setOpenImageViewer}
                imageSrc={adultoMayor?.imagen_base64 || null}
                title={`Documento de ${adultoMayor?.nombre}`}
            />
        </>
    )
}
