"use client"

import { Button } from "@/components/ui/button"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/dashboard/Pagination"
import { formatDateTime, formatRut } from "@/utils/helpers"
import { Input } from "@/components/ui/input"
import { InvalidacionesService, type InvalidacionLog } from "@/services/invalidaciones.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/hooks/useAuth"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"

export default function LoggerPage() {
    const { user, initialized: authInitialized } = useAuth()
    const [logs, setLogs] = useState<InvalidacionLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedLog, setSelectedLog] = useState<InvalidacionLog | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [copiedId, setCopiedId] = useState<number | null>(null)

    // Filters
    const [searchValue, setSearchValue] = useState("")
    const [rutFilter, setRutFilter] = useState("")
    const [pnrFilter, setPnrFilter] = useState("")
    const [ticketFilter, setTicketFilter] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    })

    const debouncedSearch = useDebounce(searchValue, 500)
    const debouncedRut = useDebounce(rutFilter, 500)
    const debouncedPnr = useDebounce(pnrFilter, 500)
    const debouncedTicket = useDebounce(ticketFilter, 500)

    // Role protection: Only SUPER_USUARIO has access to logs
    const hasAccess = user?.rol?.toUpperCase() === "SUPER_USUARIO"

    const fetchLogs = async (isSilent = false) => {
        if (!authInitialized || !hasAccess) return

        if (!isSilent) setIsLoading(true)
        try {
            const response = await InvalidacionesService.getLogs({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch,
                rut: debouncedRut,
                pnr: debouncedPnr,
                numero_ticket: debouncedTicket,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            })
            setLogs(response.rows)
            setPagination(prev => ({
                ...prev,
                total: response.total,
                totalPages: response.totalPages
            }))
        } catch (error) {
            console.error("Error al obtener logs de invalidaciones:", error)
            if (!isSilent) toast.error("No se pudieron cargar los registros de invalidaciones")
        } finally {
            if (!isSilent) setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [
        pagination.page,
        pagination.limit,
        debouncedSearch,
        debouncedRut,
        debouncedPnr,
        debouncedTicket,
        startDate,
        endDate,
        authInitialized
    ])

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const handleLimitChange = (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
    }

    const handleClearFilters = () => {
        setSearchValue("")
        setRutFilter("")
        setPnrFilter("")
        setTicketFilter("")
        setStartDate("")
        setEndDate("")
        toast.info("Filtros limpiados")
    }

    const handleViewPayload = (log: InvalidacionLog) => {
        setSelectedLog(log)
        setIsSheetOpen(true)
    }

    const handleCopyPayload = (payload: any, logId: number) => {
        if (!payload) return
        try {
            const jsonString = JSON.stringify(payload, null, 2)
            navigator.clipboard.writeText(jsonString)
            setCopiedId(logId)
            toast.success("Payload copiado al portapapeles")
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            toast.error("Error al copiar el payload")
        }
    }

    if (authInitialized && !hasAccess) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-4 max-w-md p-6 bg-card border rounded-lg shadow-sm">
                    <Icon.ShieldAlert className="h-16 w-16 text-red-500 mx-auto animate-pulse" />
                    <h1 className="text-2xl font-bold tracking-tight">Acceso Denegado</h1>
                    <p className="text-muted-foreground">
                        Este módulo contiene datos confidenciales del sistema. Solamente los usuarios con rol <strong className="text-foreground">SUPER_USUARIO</strong> están autorizados a ingresar.
                    </p>
                </div>
            </div>
        )
    }

    const actionButtons = [
        {
            label: "Limpiar Filtros",
            onClick: handleClearFilters,
            variant: "outline" as const,
            icon: <Icon.FilterX className="h-4 w-4" />
        }
    ]

    const filters = (
        <div className="w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">RUT</label>
                    <Input
                        placeholder="12345678-9"
                        value={rutFilter}
                        onChange={(e) => setRutFilter(e.target.value)}
                        className="h-9 font-mono"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PNR (Reserva)</label>
                    <Input
                        placeholder="A1B2C3"
                        value={pnrFilter}
                        onChange={(e) => setPnrFilter(e.target.value)}
                        className="h-9 font-mono"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nº Boleto</label>
                    <Input
                        placeholder="Nº Boleto / Ticket"
                        value={ticketFilter}
                        onChange={(e) => setTicketFilter(e.target.value)}
                        className="h-9 font-mono"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha Desde</label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha Hasta</label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9"
                    />
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col space-y-4">
            <PageHeader
                title="Logger de Invalidaciones"
                description="Auditoría de errores de validación, lógica de negocio y fallas de sincronización registradas en la API."
                actionButtons={actionButtons}
                showSearch={true}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onSearchClear={() => setSearchValue("")}
                onRefresh={() => fetchLogs()}
                showRefreshButton={true}
                showPagination={true}
                paginationComponent={
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        onPageChange={handlePageChange}
                        limit={pagination.limit}
                        onLimitChange={handleLimitChange}
                        hasPrevPage={pagination.page > 1}
                        hasNextPage={pagination.page < pagination.totalPages}
                    />
                }
                filters={filters}
            />

            <div className="rounded-md border bg-card overflow-hidden">
                <Table.Table>
                    <Table.TableHeader className="bg-muted/30">
                        <Table.TableRow>
                            <Table.TableHead className="w-[80px]">ID</Table.TableHead>
                            <Table.TableHead className="w-[160px]">Fecha</Table.TableHead>
                            <Table.TableHead className="w-[100px]">Método</Table.TableHead>
                            <Table.TableHead>Ruta Endpoint</Table.TableHead>
                            <Table.TableHead className="w-[140px]">RUT</Table.TableHead>
                            <Table.TableHead className="w-[100px]">PNR</Table.TableHead>
                            <Table.TableHead className="w-[120px]">Nº Boleto</Table.TableHead>
                            <Table.TableHead className="max-w-[250px]">Mensaje de Error</Table.TableHead>
                            <Table.TableHead className="w-[120px] text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                    <Icon.RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                                    Cargando registros del logger...
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : logs.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    <Icon.Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                    No se encontraron registros de invalidación.
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            logs.map((log) => {
                                const isGet = log.metodo?.toUpperCase() === "GET"
                                const isPost = log.metodo?.toUpperCase() === "POST"
                                const isPut = log.metodo?.toUpperCase() === "PUT"
                                const isDelete = log.metodo?.toUpperCase() === "DELETE"

                                return (
                                    <Table.TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                                        <Table.TableCell className="font-mono text-xs text-muted-foreground">#{log.id}</Table.TableCell>
                                        <Table.TableCell className="text-xs text-muted-foreground">
                                            {log.fecha ? formatDateTime(log.fecha) : "-"}
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase border-transparent ${
                                                    isPost ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                    isGet ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                    isPut ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                    isDelete ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                                                    "bg-slate-500/10 text-slate-600"
                                                }`}
                                            >
                                                {log.metodo || "-"}
                                            </Badge>
                                        </Table.TableCell>
                                        <Table.TableCell className="font-mono text-xs max-w-[200px] truncate" title={log.endpoint}>
                                            {log.endpoint || "-"}
                                        </Table.TableCell>
                                        <Table.TableCell className="font-mono text-xs">
                                            {log.rut ? formatRut(log.rut) : <span className="text-muted-foreground/40 italic">-</span>}
                                        </Table.TableCell>
                                        <Table.TableCell className="font-mono text-xs font-semibold text-primary">
                                            {log.pnr || <span className="text-muted-foreground/40 italic font-normal">-</span>}
                                        </Table.TableCell>
                                        <Table.TableCell className="font-mono text-xs">
                                            {log.numero_ticket || <span className="text-muted-foreground/40 italic">-</span>}
                                        </Table.TableCell>
                                        <Table.TableCell className="text-xs font-medium text-destructive max-w-[250px] truncate" title={log.error_mensaje}>
                                            {log.error_mensaje || <span className="text-muted-foreground/40 italic">-</span>}
                                        </Table.TableCell>
                                        <Table.TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-xs"
                                                    onClick={() => handleViewPayload(log)}
                                                    title="Ver detalles y payload completo"
                                                >
                                                    <Icon.Eye className="h-3.5 w-3.5 mr-1" />
                                                    Ver
                                                </Button>
                                                {log.payload && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleCopyPayload(log.payload, log.id)}
                                                        title="Copiar JSON del payload"
                                                    >
                                                        {copiedId === log.id ? (
                                                            <Icon.Check className="h-3.5 w-3.5 text-emerald-500" />
                                                        ) : (
                                                            <Icon.Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </Table.TableCell>
                                    </Table.TableRow>
                                )
                            })
                        )}
                    </Table.TableBody>
                </Table.Table>
            </div>

            {/* Radix Sheet for viewing payload */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl h-full flex flex-col p-6 overflow-hidden">
                    <SheetHeader className="mb-4">
                        <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                            <Icon.Terminal className="h-5 w-5 text-destructive" />
                            Detalle de la Invalidación
                        </SheetTitle>
                        <SheetDescription>
                            Información técnica detallada y cuerpo (payload) que causó el error de validación.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedLog && (
                        <div className="flex-1 overflow-y-auto space-y-5 pr-2">
                            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border/60">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">ID Registro</span>
                                    <span className="text-sm font-semibold font-mono">#{selectedLog.id}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Fecha y Hora</span>
                                    <span className="text-xs font-medium">{selectedLog.fecha ? formatDateTime(selectedLog.fecha) : "-"}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Endpoint Solicitado</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="font-bold text-[10px]">
                                            {selectedLog.metodo}
                                        </Badge>
                                        <span className="text-xs font-mono bg-background px-2 py-1 rounded border overflow-x-auto max-w-full block whitespace-nowrap scrollbar-thin">
                                            {selectedLog.endpoint}
                                        </span>
                                    </div>
                                </div>
                                {selectedLog.user_identifier && (
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Usuario/Identificador</span>
                                        <span className="text-xs font-medium">{selectedLog.user_identifier}</span>
                                    </div>
                                )}
                                {selectedLog.ip && (
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Dirección IP</span>
                                        <span className="text-xs font-mono">{selectedLog.ip}</span>
                                    </div>
                                )}
                                {selectedLog.rut && (
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">RUT Relacionado</span>
                                        <span className="text-xs font-mono">{formatRut(selectedLog.rut)}</span>
                                    </div>
                                )}
                                {selectedLog.pnr && (
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Reserva (PNR)</span>
                                        <span className="text-xs font-mono font-bold text-primary">{selectedLog.pnr}</span>
                                    </div>
                                )}
                                {selectedLog.numero_ticket && (
                                    <div className="col-span-2">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Número Boleto / Ticket</span>
                                        <span className="text-xs font-mono">{selectedLog.numero_ticket}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Mensaje de Error</span>
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm font-semibold text-destructive">
                                    {selectedLog.error_mensaje || "Sin mensaje de error detallado."}
                                </div>
                            </div>

                            {selectedLog.payload ? (
                                <div className="space-y-2 flex flex-col flex-1 min-h-[250px]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Cuerpo de la Petición (Payload JSON)</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs gap-1"
                                            onClick={() => handleCopyPayload(selectedLog.payload, selectedLog.id)}
                                        >
                                            {copiedId === selectedLog.id ? (
                                                <>
                                                    <Icon.Check className="h-3 w-3 text-emerald-500" />
                                                    Copiado
                                                </>
                                            ) : (
                                                <>
                                                    <Icon.Copy className="h-3 w-3" />
                                                    Copiar JSON
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <div className="bg-slate-950 text-slate-100 rounded-md p-4 overflow-auto font-mono text-xs leading-relaxed flex-1 border border-slate-800 shadow-inner">
                                        <pre>{JSON.stringify(selectedLog.payload, null, 2)}</pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-md border border-dashed text-center text-muted-foreground text-xs">
                                    Esta invalidación no contiene datos adicionales de payload.
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
