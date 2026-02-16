"use client"

import * as Dialog from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ZoomInIcon, ZoomOutIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { getImageSrc } from "@/utils/helpers"

interface ImageViewerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    imageSrc: string | null
    title?: string
}

export default function ImageViewerModal({
    open,
    onOpenChange,
    imageSrc,
    title = "Imagen del documento"
}: ImageViewerModalProps) {
    const [zoom, setZoom] = useState(100)

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 300))
    }

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 50))
    }

    const handleReset = () => {
        setZoom(100)
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="!max-w-none w-[95vw] h-[95vh] p-8 flex flex-col">
                <Dialog.DialogHeader className="flex flex-row items-center justify-between">
                    <div>
                        <Dialog.DialogTitle>{title}</Dialog.DialogTitle>
                        <Dialog.DialogDescription>
                            {zoom}% - Haz clic en la imagen para hacer zoom
                        </Dialog.DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomOut}
                            disabled={zoom <= 50}
                            title="Alejar"
                        >
                            <ZoomOutIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomIn}
                            disabled={zoom >= 300}
                            title="Acercar"
                        >
                            <ZoomInIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    </div>
                </Dialog.DialogHeader>

                <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 rounded-lg p-4">
                    {imageSrc ? (
                        <img
                            src={getImageSrc(imageSrc) || ""}
                            alt={title}
                            style={{
                                transform: `scale(${zoom / 100})`,
                                transition: 'transform 0.2s ease-in-out',
                                maxWidth: 'none',
                                width: 'auto',
                                height: 'auto'
                            }}
                            className="rounded-lg shadow-lg cursor-zoom-in"
                            onClick={(e) => {
                                // Alternar zoom al hacer clic
                                if (zoom === 100) {
                                    setZoom(150)
                                } else if (zoom === 150) {
                                    setZoom(200)
                                } else {
                                    setZoom(100)
                                }
                            }}
                        />
                    ) : (
                        <div className="text-muted-foreground">
                            No hay imagen disponible
                        </div>
                    )}
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}