"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import * as Dialog from "@/components/ui/dialog"
import * as Icon from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ClienteCorporativoService } from "@/services/cliente-corporativo.service"
import { toast } from "sonner"
import * as XLSX from "xlsx"

interface UploadCsvModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    nombreTabla: string
    onSuccess?: () => void
}

export default function UploadCsvClientesCorporativosModal({
    open,
    onOpenChange,
    nombreTabla,
    onSuccess,
}: UploadCsvModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [fileName, setFileName] = useState("")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: "binary" })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 })

            // Limpieza básica: Nombre (0) y RUT (1) -> Actualizado al nuevo orden solicitado
            const formatted = data.slice(1).map(row => ({
                nombre_completo: String(row[0] || "").trim(),
                rut: String(row[1] || "").trim(),
                status: "ACTIVO"
            })).filter(r => r.rut.length > 5)

            setPreviewData(formatted)
        }
        reader.readAsBinaryString(file)
    }

    const handleUpload = async () => {
        if (previewData.length === 0) {
            toast.error("No hay datos válidos para cargar")
            return
        }

        setIsLoading(true)
        setProgress(0)

        let successCount = 0
        let formattedCount = 0
        let errorCount = 0

        try {
            const batchSize = 100
            const batches = []
            for (let i = 0; i < previewData.length; i += batchSize) {
                batches.push(previewData.slice(i, i + batchSize))
            }

            for (let i = 0; i < batches.length; i++) {
                try {
                    const res = await ClienteCorporativoService.cargarCsv(nombreTabla, batches[i])
                    successCount += res.exitosos || 0
                    formattedCount += res.formateados || 0
                    errorCount += (res.errores?.length || 0)
                    
                    if (res.errores && res.errores.length > 0) {
                        console.warn(`Errores en lote ${i+1}:`, res.errores)
                    }
                    if (res.detalleFormateados && res.detalleFormateados.length > 0) {
                        console.info(`RUTs formateados en lote ${i+1}:`, res.detalleFormateados)
                    }
                } catch (batchError: any) {
                    errorCount += batches[i].length
                    console.error(`Error crítico en lote ${i+1}:`, batchError)
                }
                setProgress(Math.round(((i + 1) / batches.length) * 100))
            }

            if (errorCount === 0 && formattedCount === 0) {
                toast.success(`Carga completada. Se procesaron ${successCount} registros exitosamente.`)
            } else {
                toast.warning(
                    `Resultados de la carga: 
                    - ${successCount} Exitosos
                    - ${formattedCount} Corregidos/Formateados
                    - ${errorCount} Errores/Duplicados`
                , { duration: 6000 })
            }

            onSuccess?.()
            onOpenChange(false)
            reset()
        } catch (error: any) {
            toast.error("Error crítico en el proceso de carga")
        } finally {
            setIsLoading(false)
            setProgress(0)
        }
    }

    const reset = () => {
        setPreviewData([])
        setFileName("")
        setProgress(0)
    }

    return (
        <Dialog.Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
            <Dialog.DialogContent className="sm:max-w-[600px]">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Cargar Nómina (CSV/Excel)</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Sube un archivo con el listado de clientes. **Orden: Nombre Completo (Col 1), RUT (Col 2).**
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="space-y-6 py-4">
                    {!fileName ? (
                        <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                            />
                            <div className="bg-primary/10 p-4 rounded-full">
                                <Icon.UploadCloud className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-lg">Haga clic o arrastre un archivo</p>
                                <p className="text-sm text-muted-foreground">CSV, XLSX hasta 10MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Icon.FileSpreadsheet className="h-6 w-6 text-green-600" />
                                    <div>
                                        <p className="font-medium text-sm truncate max-w-[250px]">{fileName}</p>
                                        <p className="text-xs text-muted-foreground">{previewData.length} registros encontrados</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={reset} disabled={isLoading}>
                                    <Icon.Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>

                            {isLoading && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                                        <span>Procesando nómina...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-1.5" />
                                </div>
                            )}

                            {previewData.length > 0 && !isLoading && (
                                <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted sticky top-0">
                                            <tr>
                                                <th className="p-2 text-left">Nombre</th>
                                                <th className="p-2 text-left">RUT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.slice(0, 5).map((row, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="p-2">{row.nombre_completo}</td>
                                                    <td className="p-2">{row.rut}</td>
                                                </tr>
                                            ))}
                                            {previewData.length > 5 && (
                                                <tr>
                                                    <td colSpan={2} className="p-2 text-center text-muted-foreground italic">
                                                        ... y {previewData.length - 5} registros más
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleUpload} disabled={isLoading || previewData.length === 0}>
                        {isLoading ? (
                            <Icon.Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Icon.CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Comenzar Carga
                    </Button>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
