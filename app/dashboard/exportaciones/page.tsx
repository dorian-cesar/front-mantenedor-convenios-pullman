"use client"

import { useState } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import * as Card from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { downloadBlob } from "@/utils/download"

export default function ExportacionesPage() {
    const [isExporting, setIsExporting] = useState(false)

    const handleExportBeneficiarios = async () => {
        setIsExporting(true)
        const toastId = toast.loading("Preparando descarga de beneficiarios...")

        try {
            const response = await api.get("export/beneficiarios", {
                responseType: "blob",
            })

            // Intentar obtener el nombre del archivo de la cabecera content-disposition
            const contentDisposition = response.headers["content-disposition"]
            let fileName = "beneficiarios_completos.csv"
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/)
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1]
                }
            }

            // Usar la utilidad de descarga optimizada
            downloadBlob(
                response.data, 
                fileName, 
                response.headers["content-type"] || "text/csv"
            )

            toast.success("Descarga completada correctamente", { id: toastId })
        } catch (error) {
            console.error("Error al exportar beneficiarios:", error)
            toast.error("No se pudo completar la exportación", { id: toastId })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="flex flex-col space-y-6">
            <PageHeader
                title="Exportaciones"
                description="Gestión de reportes y descargas masivas de datos del sistema."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card.Card className="flex flex-col h-full border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                    <Card.CardHeader>
                        <Card.CardTitle className="flex items-center gap-2 text-primary">
                            <FileDown className="h-5 w-5" />
                            Beneficiarios Totales
                        </Card.CardTitle>
                        <Card.CardDescription>
                            Exportación completa de todos los beneficiarios registrados.
                        </Card.CardDescription>
                    </Card.CardHeader>
                    <Card.CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Este reporte genera un archivo (Excel/CSV) con el listado detallado de todos los beneficiarios en el sistema, vinculando cada <strong>RUT</strong> con su respectivo <strong>Convenio</strong> o beneficio asignado.
                        </p>
                    </Card.CardContent>
                    <Card.CardFooter className="pt-4">
                        <Button 
                            onClick={handleExportBeneficiarios} 
                            disabled={isExporting}
                            className="w-full bg-primary hover:bg-primary/90"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Preparando archivo...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Descargar Beneficiarios
                                </>
                            )}
                        </Button>
                    </Card.CardFooter>
                </Card.Card>
                
                {/* Espacio para futuras herramientas de exportación */}
                <Card.Card className="flex flex-col h-full border-dashed border-muted-foreground/20 bg-muted/5 opacity-60">
                    <Card.CardHeader>
                        <Card.CardTitle className="text-muted-foreground text-sm flex items-center gap-2">
                             Más Reportes Próximamente
                        </Card.CardTitle>
                    </Card.CardHeader>
                    <Card.CardContent className="flex-1 items-center justify-center flex py-8">
                        <p className="text-xs text-center text-muted-foreground italic">
                            Se añadirán más herramientas de exportación masiva próximamente.
                        </p>
                    </Card.CardContent>
                </Card.Card>
            </div>
        </div>
    )
}
