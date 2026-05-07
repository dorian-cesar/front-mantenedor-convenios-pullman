"use client"

import * as Dialog from "@/components/ui/dialog"
import { type Beneficiario } from "@/services/beneficiarios.service"
import { formatDateOnly } from "@/utils/helpers"
import { getFileSrc, isPDF } from "@/utils/helpers"
import { useState } from "react"
import FileViewerModal from "./file-viewer-modal"
import { Button } from "@/components/ui/button"
import { Maximize2Icon, FileTextIcon, Ban, CheckCircle2, XCircle, Loader2Icon } from "lucide-react"
import { BeneficiariosService } from "@/services/beneficiarios.service"
import { toast } from "sonner"
import { useEffect } from "react"

interface DetailsBeneficiarioDinamicoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    beneficiario: Beneficiario | null
    onToggleStatus?: (id: number, currentStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO") => Promise<void>
    onRechazar?: (beneficiario: Beneficiario) => void
}

export default function DetailsBeneficiarioDinamicoModal({
    open,
    onOpenChange,
    beneficiario,
    onToggleStatus,
    onRechazar,
}: DetailsBeneficiarioDinamicoModalProps) {
    const [openFileViewer, setOpenFileViewer] = useState(false)
    const [selectedFile, setSelectedFile] = useState<{ src: string; title: string } | null>(null)
    const [fullBeneficiario, setFullBeneficiario] = useState<Beneficiario | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && beneficiario?.id) {
            fetchFullData(beneficiario.id)
        } else if (!open) {
            setFullBeneficiario(null)
        }
    }, [open, beneficiario?.id])

    const fetchFullData = async (id: number) => {
        setIsLoading(true)
        try {
            const data = await BeneficiariosService.getBeneficiarioById(id)
            setFullBeneficiario(data)
        } catch (error) {
            console.error("Error fetching full beneficiary data:", error)
            toast.error("No se pudo cargar la información detallada")
        } finally {
            setIsLoading(false)
        }
    }

    const currentBeneficiario = fullBeneficiario || beneficiario

    const handleFileClick = (fileSrc: string, title: string) => {
        setSelectedFile({ src: fileSrc, title })
        setOpenFileViewer(true)
    }

    const renderFilePreview = (fileSrc: string | undefined, title: string, onClick: () => void) => {
        if (!fileSrc) {
            return (
                <div className="h-48 w-full flex items-center justify-center border rounded-lg text-muted-foreground bg-slate-50">
                    Sin archivo
                </div>
            )
        }

        const fileIsPDF = isPDF(fileSrc)

        return (
            <div className="relative group h-48 w-full border rounded-lg overflow-hidden bg-slate-100/30">
                <div
                    className="h-full w-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
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
                <Dialog.DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <Dialog.DialogHeader>
                        <Dialog.DialogTitle>Detalles del Beneficiario</Dialog.DialogTitle>
                        <Dialog.DialogDescription>
                            Información completa de {currentBeneficiario?.nombre}
                        </Dialog.DialogDescription>
                    </Dialog.DialogHeader>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2Icon className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground animate-pulse">Cargando detalles e imágenes...</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</p>
                                    <p className="text-sm font-medium">{currentBeneficiario?.nombre || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RUT</p>
                                    <p className="text-sm font-medium">{currentBeneficiario?.rut || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</p>
                                    <p className="text-sm font-medium">{currentBeneficiario?.telefono || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo</p>
                                    <p className="text-sm font-medium">{currentBeneficiario?.correo || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección</p>
                                    <p className="text-sm font-medium">{currentBeneficiario?.direccion || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</p>
                                    <div className="flex items-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            currentBeneficiario?.status === 'ACTIVO' ? 'bg-green-100 text-green-800' : 
                                            currentBeneficiario?.status === 'RECHAZADO' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {currentBeneficiario?.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Convenio</p>
                                    <p className="text-sm font-medium">{currentBeneficiario?.convenio?.nombre || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa ID</p>
                                    <p className="text-sm font-medium">{(currentBeneficiario as any)?.empresa_id || "-"}</p>
                                </div>
                            </div>

                            {(currentBeneficiario as any)?.nombre_beneficio || (currentBeneficiario as any)?.tipo_beneficio ? (
                                <div className="grid gap-4 grid-cols-2 p-3 bg-slate-50 border rounded-md">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Beneficio</p>
                                        <p className="text-sm font-medium">{(currentBeneficiario as any)?.nombre_beneficio || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo Beneficio</p>
                                        <p className="text-sm font-medium">{(currentBeneficiario as any)?.tipo_beneficio || "-"}</p>
                                    </div>
                                </div>
                            ) : null}

                            {currentBeneficiario?.razon_rechazo && currentBeneficiario.status === "RECHAZADO" && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                                    <p className="text-xs font-semibold text-red-700 uppercase mb-1">Motivo de Rechazo</p>
                                    <p className="text-sm text-red-800">{currentBeneficiario.razon_rechazo}</p>
                                </div>
                            )}

                            <div className="grid gap-4 grid-cols-2 pt-4 border-t border-dashed">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creado por</p>
                                    <p className="text-sm font-medium">{(currentBeneficiario as any)?.created_by || "-"}</p>
                                    <p className="text-[10px] text-muted-foreground">{currentBeneficiario?.createdAt ? formatDateOnly(currentBeneficiario.createdAt) : ""}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actualizado por</p>
                                    <p className="text-sm font-medium">{(currentBeneficiario as any)?.updated_by || "-"}</p>
                                    <p className="text-[10px] text-muted-foreground">{(currentBeneficiario as any)?.updatedAt ? formatDateOnly((currentBeneficiario as any).updatedAt) : ""}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Documentos y Archivos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(() => {
                                        const docs: { label: string; src: string }[] = [];
                                        
                                        // Check for specific fields
                                        if ((currentBeneficiario as any)?.imagen_cedula_identidad) {
                                            docs.push({ label: "Foto frontal de Carnet de Identidad", src: (currentBeneficiario as any).imagen_cedula_identidad });
                                        }
                                        if ((currentBeneficiario as any)?.imagen_certificado_residencia) {
                                            docs.push({ label: "Certificado de Residencia", src: (currentBeneficiario as any).imagen_certificado_residencia });
                                        }
                                        if ((currentBeneficiario as any)?.imagen_certificado_alumno_regular) {
                                            docs.push({ label: "Certificado Alumno Regular", src: (currentBeneficiario as any).imagen_certificado_alumno_regular });
                                        }

                                        // Add dynamic images
                                        if (currentBeneficiario?.imagenes) {
                                            Object.entries(currentBeneficiario.imagenes).forEach(([key, src]) => {
                                                if (src && !docs.some(d => d.src === src)) {
                                                    docs.push({ label: key, src });
                                                }
                                            });
                                        }

                                        if (docs.length === 0) {
                                            return (
                                                <div className="col-span-2 py-8 text-center border-2 border-dashed rounded-lg bg-slate-50">
                                                    <p className="text-sm text-muted-foreground">No hay documentos adjuntos para este beneficiario.</p>
                                                </div>
                                            );
                                        }

                                        return docs.map((doc, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <p className="text-xs font-semibold text-muted-foreground">{doc.label}</p>
                                                {renderFilePreview(
                                                    doc.src,
                                                    `${doc.label} de ${currentBeneficiario?.nombre}`,
                                                    () => handleFileClick(doc.src, `${doc.label} de ${currentBeneficiario?.nombre}`)
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t pt-6 mt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                        
                        {currentBeneficiario && onRechazar && currentBeneficiario.status !== "RECHAZADO" && (
                            <Button
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 border-destructive"
                                onClick={() => onRechazar(currentBeneficiario)}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Rechazar
                            </Button>
                        )}
                        
                        {currentBeneficiario && onToggleStatus && (
                            <Button
                                variant={currentBeneficiario.status === "ACTIVO" ? "destructive" : "default"}
                                onClick={() => {
                                    onToggleStatus(currentBeneficiario.id, currentBeneficiario.status)
                                }}
                            >
                                {currentBeneficiario.status === "ACTIVO" ? (
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
