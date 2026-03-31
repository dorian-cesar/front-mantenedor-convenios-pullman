"use client"

import { useState } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import * as Card from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { downloadBlob } from "@/utils/download"
import * as XLSX from "xlsx"

export default function ExportacionesPage() {
    const [isExporting, setIsExporting] = useState<string | null>(null)

    const handleExport = async (type: 'beneficiarios' | 'convenios', format: 'csv' | 'xlsx') => {
        const loadingKey = `${type}-${format}`
        setIsExporting(loadingKey)
        
        const label = type === 'beneficiarios' ? 'beneficiarios' : 'convenios'
        const endpoint = type === 'beneficiarios' ? 'export/beneficiarios' : 'export/convenios'
        const defaultFileName = type === 'beneficiarios' ? 'beneficiarios_completos' : 'convenios_completos'
        
        const toastId = toast.loading(`Preparando descarga de ${label} (${format.toUpperCase()})...`)

        try {
            if (format === 'csv') {
                const response = await api.get(endpoint, {
                    responseType: "blob",
                })

                const contentDisposition = response.headers["content-disposition"]
                let fileName = `${defaultFileName}.csv`
                if (contentDisposition) {
                    const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/)
                    if (fileNameMatch && fileNameMatch.length === 2) {
                        fileName = fileNameMatch[1]
                    }
                }

                downloadBlob(response.data, fileName, response.headers["content-type"] || "text/csv")
            } else {
                const response = await api.get(endpoint, {
                    responseType: "text",
                })

                const rawData = response.data as string
                
                const rows = rawData.split('\n').filter(row => row.trim() !== '').map(row => {
                    return row.split(';').map(cell => {
                        return cell.replace(/^"(.*)"$/, '$1').trim()
                    })
                })

                const worksheet = XLSX.utils.aoa_to_sheet(rows)
                const workbook = XLSX.utils.book_new()
                const sheetName = type === 'beneficiarios' ? 'Beneficiarios' : 'Convenios'
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

                XLSX.writeFile(workbook, `${defaultFileName}.xlsx`)
            }

            toast.success("Descarga completada correctamente", { id: toastId })
        } catch (error) {
            console.error(`Error al exportar ${label} (${format}):`, error)
            toast.error("No se pudo completar la exportación", { id: toastId })
        } finally {
            setIsExporting(null)
        }
    }

    return (
        <div className="flex flex-col space-y-6">
            <PageHeader
                title="Exportaciones"
                description="Gestión de reportes y descargas masivas de datos del sistema."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Beneficiarios Card */}
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
                            Este reporte genera un archivo con el listado detallado de todos los beneficiarios en el sistema, vinculando cada <strong>RUT</strong> con su respectivo <strong>Convenio</strong> o beneficio asignado.
                        </p>
                    </Card.CardContent>
                    <Card.CardFooter className="pt-4 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2 w-full">
                            <Button 
                                variant="outline"
                                onClick={() => handleExport('beneficiarios', 'csv')} 
                                disabled={isExporting !== null}
                                className="w-full border-primary/20 hover:bg-primary/5"
                            >
                                {isExporting === 'beneficiarios-csv' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ...
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        CSV
                                    </>
                                )}
                            </Button>
                            <Button 
                                onClick={() => handleExport('beneficiarios', 'xlsx')} 
                                disabled={isExporting !== null}
                                className="w-full bg-primary hover:bg-primary/90"
                            >
                                {isExporting === 'beneficiarios-xlsx' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ...
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Excel
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card.CardFooter>
                </Card.Card>

                {/* Convenios Card */}
                <Card.Card className="flex flex-col h-full border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                    <Card.CardHeader>
                        <Card.CardTitle className="flex items-center gap-2 text-primary">
                            <FileSpreadsheet className="h-5 w-5" />
                            Convenios Totales
                        </Card.CardTitle>
                        <Card.CardDescription>
                            Listado completo de todos los convenios activos en el sistema.
                        </Card.CardDescription>
                    </Card.CardHeader>
                    <Card.CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Extrae un reporte detallado con todos los <strong>convenios</strong> registrados, sus categorías, empresas asociadas y estados actuales.
                        </p>
                    </Card.CardContent>
                    <Card.CardFooter className="pt-4 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2 w-full">
                            <Button 
                                variant="outline"
                                onClick={() => handleExport('convenios', 'csv')} 
                                disabled={isExporting !== null}
                                className="w-full border-primary/20 hover:bg-primary/5"
                            >
                                {isExporting === 'convenios-csv' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ...
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        CSV
                                    </>
                                )}
                            </Button>
                            <Button 
                                onClick={() => handleExport('convenios', 'xlsx')} 
                                disabled={isExporting !== null}
                                className="w-full bg-primary hover:bg-primary/90"
                            >
                                {isExporting === 'convenios-xlsx' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ...
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Excel
                                    </>
                                )}
                            </Button>
                        </div>
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
