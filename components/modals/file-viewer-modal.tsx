"use client"

import * as Dialog from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ZoomInIcon, ZoomOutIcon, FileTextIcon, DownloadIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { getFileSrc, isPDF } from "@/utils/helpers"

interface FileViewerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fileSrc: string | null
    title?: string
}

export default function FileViewerModal({
    open,
    onOpenChange,
    fileSrc,
    title = "Documento"
}: FileViewerModalProps) {
    const [zoom, setZoom] = useState(100)
    const [isPdf, setIsPdf] = useState(false)

    useEffect(() => {
        if (fileSrc) {
            setIsPdf(isPDF(fileSrc))
        }
    }, [fileSrc])

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 300))
    }

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 50))
    }

    const handleReset = () => {
        setZoom(100)
    }

    const handleDownload = () => {
        if (!fileSrc) return

        const link = document.createElement('a')
        link.href = getFileSrc(fileSrc) || ''
        link.download = title.replace(/\s+/g, '_') + (isPdf ? '.pdf' : '.jpg')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="!max-w-none w-[95vw] h-[95vh] p-8 flex flex-col">
                <Dialog.DialogHeader className="flex flex-row items-center justify-between">
                    <div>
                        <Dialog.DialogTitle>{title}</Dialog.DialogTitle>
                        <Dialog.DialogDescription>
                            {isPdf ? "Documento PDF" : `${zoom}% - Haz clic en la imagen para hacer zoom`}
                        </Dialog.DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isPdf && (
                            <>
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
                            </>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleDownload}
                            title="Descargar"
                        >
                            <DownloadIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </Dialog.DialogHeader>

                <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 rounded-lg p-4">
                    {fileSrc ? (
                        isPdf ? (
                            <iframe
                                src={getFileSrc(fileSrc) || ''}
                                className="w-full h-full rounded-lg"
                                title={title}
                            />
                        ) : (
                            <img
                                src={getFileSrc(fileSrc) || ""}
                                alt={title}
                                style={{
                                    transform: `scale(${zoom / 100})`,
                                    transition: 'transform 0.2s ease-in-out',
                                    maxWidth: 'none',
                                    width: 'auto',
                                    height: 'auto'
                                }}
                                className="rounded-lg shadow-lg cursor-zoom-in"
                                onClick={() => {
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
                        )
                    ) : (
                        <div className="text-muted-foreground flex flex-col items-center">
                            <FileTextIcon className="h-16 w-16 mb-2" />
                            <p>No hay documento disponible</p>
                        </div>
                    )}
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}