"use client"

import * as Dialog from "@/components/ui/dialog"
import { type Beneficiario } from "@/services/beneficiarios.service"
import { formatDateOnly } from "@/utils/helpers"
import { getFileSrc, isPDF } from "@/utils/helpers"
import { useState } from "react"
import FileViewerModal from "./file-viewer-modal"
import { Button } from "@/components/ui/button"
import { Maximize2Icon, FileTextIcon, Ban, CheckCircle2, XCircle } from "lucide-react"

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
                            Información completa de {beneficiario?.nombre}
                        </Dialog.DialogDescription>
                    </Dialog.DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid gap-4 grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</p>
                                <p className="text-sm font-medium">{beneficiario?.nombre || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RUT</p>
                                <p className="text-sm font-medium">{beneficiario?.rut || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</p>
                                <p className="text-sm font-medium">{beneficiario?.telefono || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo</p>
                                <p className="text-sm font-medium">{beneficiario?.correo || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección</p>
                                <p className="text-sm font-medium">{beneficiario?.direccion || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</p>
                                <div className="flex items-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        beneficiario?.status === 'ACTIVO' ? 'bg-green-100 text-green-800' : 
                                        beneficiario?.status === 'RECHAZADO' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {beneficiario?.status}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha Creación</p>
                                <p className="text-sm font-medium">{beneficiario?.createdAt ? formatDateOnly(beneficiario.createdAt) : "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Convenio</p>
                                <p className="text-sm font-medium">{beneficiario?.convenio?.nombre || "-"}</p>
                            </div>
                        </div>

                        {beneficiario?.razon_rechazo && beneficiario.status === "RECHAZADO" && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                                <p className="text-xs font-semibold text-red-700 uppercase mb-1">Motivo de Rechazo</p>
                                <p className="text-sm text-red-800">{beneficiario.razon_rechazo}</p>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Documentos y Archivos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(() => {
                                    const docs: { label: string; src: string }[] = [];
                                    
                                    // Check for specific fields
                                    if ((beneficiario as any)?.imagen_cedula_identidad) {
                                        docs.push({ label: "Foto frontal de Carnet de Identidad", src: (beneficiario as any).imagen_cedula_identidad });
                                    }
                                    if ((beneficiario as any)?.imagen_certificado_residencia) {
                                        docs.push({ label: "Certificado de Residencia", src: (beneficiario as any).imagen_certificado_residencia });
                                    }
                                    if ((beneficiario as any)?.imagen_certificado_alumno_regular) {
                                        docs.push({ label: "Certificado Alumno Regular", src: (beneficiario as any).imagen_certificado_alumno_regular });
                                    }

                                    // Add dynamic images
                                    if (beneficiario?.imagenes) {
                                        Object.entries(beneficiario.imagenes).forEach(([key, src]) => {
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
                                                `${doc.label} de ${beneficiario?.nombre}`,
                                                () => handleFileClick(doc.src, `${doc.label} de ${beneficiario?.nombre}`)
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-6 mt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                        
                        {beneficiario && onRechazar && beneficiario.status !== "RECHAZADO" && (
                            <Button
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 border-destructive"
                                onClick={() => onRechazar(beneficiario)}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Rechazar
                            </Button>
                        )}
                        
                        {beneficiario && onToggleStatus && (
                            <Button
                                variant={beneficiario.status === "ACTIVO" ? "destructive" : "default"}
                                onClick={() => {
                                    onToggleStatus(beneficiario.id, beneficiario.status)
                                }}
                            >
                                {beneficiario.status === "ACTIVO" ? (
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
