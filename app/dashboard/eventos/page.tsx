"use client"

import { Button } from "@/components/ui/button"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/dashboard/Pagination"
import { Calendar } from "@/components/ui/calendar"
import { formatDateOnly, formatNumber, formatDateTime } from "@/utils/helpers"
import { es } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import ExportModal from "@/components/modals/export"
import { format } from "date-fns"
import { EventosService, type Evento, type GetEventosParams } from "@/services/evento.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { PasajerosService, type Pasajero } from "@/services/pasajero.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { useAuth } from "@/hooks/useAuth"

export default function EventosPage() {
    const [openExport, setOpenExport] = useState(false);
    const [searchValue, setSearchValue] = useState("")
    const [eventos, setEventos] = useState<Evento[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useAuth()

    // Filtros
    const [statusFilter, setStatusFilter] = useState<"compra" | "anulado" | "error_confirmacion" | "revisar" | "" | null>(null)
    const [empresaFilter, setEmpresaFilter] = useState<number | null>(null)
    const [pasajeroFilter, setPasajeroFilter] = useState<number | null>(null)
    const [convenioFilter, setConvenioFilter] = useState<number | null>(null)
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

    // Datos para selectores
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [pasajeros, setPasajeros] = useState<Pasajero[]>([])
    const [convenios, setConvenios] = useState<Convenio[]>([])

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchEventos = async () => {
        setIsLoading(true)
        try {
            const params: any = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
                tipo_evento: 'COMPRA',
            }

            // Aplicar filtros
            if (statusFilter === "anulado") {
                params.estado = "anulado"
            } else if (statusFilter === "compra") {
                params.estado = "confirmado"
            } else if (statusFilter === "error_confirmacion") {
                params.estado = "error_confirmacion"
            } else if (statusFilter === "revisar") {
                params.estado = "revisar"
            }

            if (empresaFilter) {
                params.empresa_id = empresaFilter
            }
            if (pasajeroFilter) {
                params.pasajero_id = pasajeroFilter
            }
            if (convenioFilter) {
                params.convenio_id = convenioFilter
            }
            if (dateRange?.from) {
                params.startDate = dateRange.from.toISOString()
            }
            if (dateRange?.to) {
                params.endDate = dateRange.to.toISOString()
            }

            // Restricción por Rol: Si es USUARIO, forzar su empresa_id
            if (user?.rol === "USUARIO" && user?.empresa_id) {
                params.empresa_id = user.empresa_id;
            }

            const response = await EventosService.getEventos(params)
            setEventos(response.rows)
            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching eventos:', error)
            toast.error("No se pudieron cargar los eventos")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchEmpresas = async () => {
        try {
            const response = await EmpresasService.getEmpresas({
                page: 1,
                limit: 100,
                status: "ACTIVO"
            })
            setEmpresas(response.rows)
        } catch (error) {
            console.error('Error fetching empresas:', error)
        }
    }

    const fetchPasajeros = async () => {
        try {
            const response = await PasajerosService.getPasajeros({
                page: 1,
                limit: 100,
                status: "ACTIVO"
            })
            setPasajeros(response.rows)
        } catch (error) {
            console.error('Error fetching pasajeros:', error)
        }
    }

    const fetchConvenios = async () => {
        try {
            const response = await ConveniosService.getConvenios({
                page: 1,
                limit: 100,
                status: "ACTIVO"
            })
            setConvenios(response.rows)
        } catch (error) {
            console.error('Error fetching convenios:', error)
        }
    }

    useEffect(() => {
        fetchEventos()
        fetchEmpresas()
        fetchPasajeros()
        fetchConvenios()
    }, [
        pagination.page,
        pagination.limit,
        statusFilter,
        empresaFilter,
        pasajeroFilter,
        convenioFilter,
        dateRange
    ])

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const handleLimitChange = (newLimit: number) => {
        setPagination(prev => ({
            ...prev,
            limit: newLimit,
            page: 1,
        }))
    }

    const handleRefresh = () => {
        fetchEventos()
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetEventosParams = {
                sortBy: "id",
                order: "DESC",
            }

            // Aplicar mismos filtros que la tabla
            if (statusFilter === "anulado") params.estado = "anulado"
            if (statusFilter === "compra") params.estado = "confirmado"
            if (empresaFilter) params.empresa_id = empresaFilter
            if (pasajeroFilter) params.pasajero_id = pasajeroFilter
            if (convenioFilter) params.convenio_id = convenioFilter
            if (dateRange?.from) params.fecha_inicio = format(dateRange.from, "yyyy-MM-dd")
            if (dateRange?.to) params.fecha_fin = format(dateRange.to, "yyyy-MM-dd")

            // Restricción por Rol: Si es USUARIO, forzar su empresa_id
            if (user?.rol === "USUARIO" && user?.empresa_id) {
                params.empresa_id = user.empresa_id;
            }

            const response = await EventosService.getEventos(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map((evento) => ({
                ID: evento.id,
                Tipo: evento.tipo_evento || "COMPRA",
                "Fecha Compra": formatDateTime(evento.fecha_compra),
                PNR: evento.pnr || "N/A",
                Ticket: evento.numero_ticket || "S/N",
                Asiento: evento.numero_asiento || "N/A",
                "Origen": evento.terminal_origen,
                "Destino": evento.terminal_destino,
                "Fecha Viaje": formatDateOnly(evento.fecha_viaje),
                "Hora Salida": evento.hora_salida || "N/A",
                Pasajero: evento.pasajero
                    ? `${evento.pasajero.nombres} ${evento.pasajero.apellidos}`
                    : "N/A",
                Empresa: evento.empresa?.nombre || "N/A",
                "Tarifa Base": `$${formatNumber(evento.tarifa_base || 0)}`,
                "Monto Descuento": `$${formatNumber(evento.monto_descuento ?? ((evento.tarifa_base || 0) - (evento.monto_pagado || 0)))}`,
                "Monto Pagado": `$${formatNumber(evento.monto_pagado)}`,
                "Código Autorización": evento.codigo_autorizacion ?? "N/A",
                Convenio: evento.convenio?.nombre || "N/A",
                Estado:
                    evento.estado === "anulado"
                        ? "anulado"
                        : "confirmado",
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "eventos.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "eventos.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting eventos:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }


    const actionButtons = [
        {
            label: "Exportar",
            onClick: () => setOpenExport(true),
            variant: "outline" as const,
            icon: <Icon.ArrowDownToLine className="h-4 w-4" />
        }
    ]

    const getTipoEventoLabel = (evento: Evento) => {
        if (evento.estado === "anulado") return "anulado"
        return "compra"
    }

    // Client-side filtering for immediate feedback
    const filteredEventos = eventos.filter(evento => {
        if (!searchValue.trim()) return true;
        const searchLower = searchValue.toLowerCase();
        const passengerName = evento.pasajero ? `${evento.pasajero.nombres} ${evento.pasajero.apellidos}`.toLowerCase() : "";
        const passengerRut = evento.pasajero?.rut?.toLowerCase() || "";
        const companyName = evento.empresa?.nombre?.toLowerCase() || "";
        const convenioName = evento.convenio?.nombre?.toLowerCase() || "";
        const authCode = evento.codigo_autorizacion?.toLowerCase() || "";

        return (
            passengerName.includes(searchLower) ||
            passengerRut.includes(searchLower) ||
            companyName.includes(searchLower) ||
            convenioName.includes(searchLower) ||
            authCode.includes(searchLower) ||
            evento.id.toString().includes(searchLower)
        );
    });

    const filters = (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Estado:</span>
                    <Dropdown.DropdownMenu>
                        <Dropdown.DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-between">
                                {statusFilter === "compra" ? "Confirmados" :
                                 statusFilter === "anulado" ? "Anulados" :
                                 statusFilter === "error_confirmacion" ? "Error Confirmación" :
                                 statusFilter === "revisar" ? "Revisar" : "Todos"}
                                <Icon.ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </Dropdown.DropdownMenuTrigger>
                        <Dropdown.DropdownMenuContent align="start">
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                Todos
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("compra")}>
                                Confirmados
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("anulado")}>
                                Anulados
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("error_confirmacion")}>
                                Error Confirmación
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("revisar")}>
                                Revisar
                            </Dropdown.DropdownMenuItem>
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>

                {user?.rol === "SUPER_USUARIO" && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Empresa:</span>
                    <Dropdown.DropdownMenu>
                        <Dropdown.DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between text-left">
                                <span className="truncate">
                                    {empresaFilter ? empresas.find(e => e.id === empresaFilter)?.nombre || "Seleccionar..." : "Todas"}
                                </span>
                                <Icon.ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                            </Button>
                        </Dropdown.DropdownMenuTrigger>
                        <Dropdown.DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                            <Dropdown.DropdownMenuItem onClick={() => setEmpresaFilter(null)}>
                                Todas
                            </Dropdown.DropdownMenuItem>
                            {empresas.map((empresa) => (
                                <Dropdown.DropdownMenuItem key={empresa.id} onClick={() => setEmpresaFilter(empresa.id)}>
                                    {empresa.nombre}
                                </Dropdown.DropdownMenuItem>
                            ))}
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>
            )}

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Convenio:</span>
                    <Dropdown.DropdownMenu>
                        <Dropdown.DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between text-left">
                                <span className="truncate">
                                    {convenioFilter ? convenios.find(c => c.id === convenioFilter)?.nombre || "Seleccionar..." : "Todos"}
                                </span>
                                <Icon.ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                            </Button>
                        </Dropdown.DropdownMenuTrigger>
                        <Dropdown.DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                            <Dropdown.DropdownMenuItem onClick={() => setConvenioFilter(null)}>
                                Todos
                            </Dropdown.DropdownMenuItem>
                            {convenios.map((convenio) => (
                                <Dropdown.DropdownMenuItem key={convenio.id} onClick={() => setConvenioFilter(convenio.id)}>
                                    {convenio.nombre}
                                </Dropdown.DropdownMenuItem>
                            ))}
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Pasajero:</span>
                    <Dropdown.DropdownMenu>
                        <Dropdown.DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between text-left">
                                <span className="truncate">
                                    {pasajeroFilter ? pasajeros.find(p => p.id === pasajeroFilter)?.nombres || "Seleccionar..." : "Todos"}
                                </span>
                                <Icon.ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                            </Button>
                        </Dropdown.DropdownMenuTrigger>
                        <Dropdown.DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                            <Dropdown.DropdownMenuItem onClick={() => setPasajeroFilter(null)}>
                                Todos
                            </Dropdown.DropdownMenuItem>
                            {pasajeros.map((pasajero) => (
                                <Dropdown.DropdownMenuItem key={pasajero.id} onClick={() => setPasajeroFilter(pasajero.id)}>
                                    {pasajero.nombres} {pasajero.apellidos}
                                </Dropdown.DropdownMenuItem>
                            ))}
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rango de Fecha:</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-9 min-w-[240px] gap-2 justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon.Calendar className="h-4 w-4" />
                                    <span className="text-sm">
                                        {dateRange?.from
                                            ? dateRange.to
                                                ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                                                : format(dateRange.from, "dd/MM/yyyy")
                                            : "Seleccionar rango"}
                                    </span>
                                </div>
                                <Icon.ChevronDown className="h-4 w-4 shrink-0" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-0">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                locale={es}
                                classNames={{
                                    cell: "p-1",
                                    day: "h-8 w-8 p-0",
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Badge variant="secondary" className="h-9 px-4 text-sm font-medium whitespace-nowrap">
                        Total: {pagination.total} registros
                    </Badge>
                </div>

                {(statusFilter || empresaFilter || pasajeroFilter || convenioFilter || dateRange?.from) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setStatusFilter(null)
                            setEmpresaFilter(null)
                            setPasajeroFilter(null)
                            setConvenioFilter(null)
                            setDateRange(undefined)
                        }}
                        className="h-9"
                    >
                        <Icon.X className="mr-2 h-4 w-4" />
                        Limpiar
                    </Button>
                )}
            </div>
        </div>
    )

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Eventos"
                description="Historial de todos los eventos del sistema."
                actionButtons={actionButtons}
                showSearch={true}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onSearchClear={() => setSearchValue("")}
                onRefresh={handleRefresh}
                showRefreshButton={true}
                showPagination={true}
                paginationComponent={
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        onPageChange={handlePageChange}
                        hasPrevPage={pagination.hasPrevPage}
                        hasNextPage={pagination.hasNextPage}
                        className="w-full"
                        limit={pagination.limit}
                        onLimitChange={handleLimitChange}
                    />
                }
                filters={filters}
            />
            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Fecha Compra</Table.TableHead>
                            <Table.TableHead>PNR / Ticket</Table.TableHead>
                            <Table.TableHead>Trayecto</Table.TableHead>
                            <Table.TableHead>Pasajero / Empresa</Table.TableHead>
                            <Table.TableHead>Tarifa Base</Table.TableHead>
                            <Table.TableHead>Descuento</Table.TableHead>
                            <Table.TableHead>Monto Pagado</Table.TableHead>
                            <Table.TableHead>Autorización</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={13} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : filteredEventos.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={14} className="text-center py-8">
                                    No se encontraron eventos
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredEventos.map((evento) => (
                                <Table.TableRow key={evento.id}>
                                    <Table.TableCell className="font-medium text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span>#{evento.id}</span>
                                            <Badge variant="secondary" className="w-fit text-[9px] px-1 py-0 h-4 uppercase">
                                                {evento.tipo_evento || "COMPRA"}
                                            </Badge>
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-xs">{formatDateTime(evento.fecha_compra)}</Table.TableCell>
                                    <Table.TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-primary">{evento.pnr || "N/A"}</span>
                                            <div className="flex flex-col text-[10px] text-muted-foreground leading-tight">
                                                <span>Tkt: {evento.numero_ticket || "S/N"}</span>
                                                {evento.numero_asiento && <span>Asiento: {evento.numero_asiento}</span>}
                                            </div>
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <div className="flex flex-col text-[11px] leading-tight">
                                            <div className="font-medium">
                                                {evento.terminal_origen} <span className="text-muted-foreground font-normal">→</span> {evento.terminal_destino}
                                            </div>
                                            {evento.fecha_viaje && (
                                                <div className="flex items-center gap-1 text-primary/80 font-medium mt-0.5">
                                                    <Icon.Calendar className="h-3 w-3" />
                                                    <span>{formatDateOnly(evento.fecha_viaje)} {evento.hora_salida}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span className="font-medium">
                                                {evento.pasajero ? `${evento.pasajero.nombres} ${evento.pasajero.apellidos}` : "N/A"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{evento.empresa?.nombre || "N/A"}</span>
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-xs text-muted-foreground">${formatNumber(evento.tarifa_base || 0)}</Table.TableCell>
                                    <Table.TableCell className="text-xs text-red-500 font-medium">${formatNumber(evento.monto_descuento ?? ((evento.tarifa_base || 0) - (evento.monto_pagado || 0)))}</Table.TableCell>
                                    <Table.TableCell className="font-bold text-xs text-green-600">${formatNumber(evento.monto_pagado)}</Table.TableCell>
                                    <Table.TableCell>
                                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                                            {evento.codigo_autorizacion || "N/A"}
                                        </Badge>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={evento.status || evento.estado}>
                                            {evento.status?.toLowerCase() === "error_confirmacion" ? "Error" :
                                                evento.status?.toLowerCase() === "revisar" ? "Revisar" :
                                                    evento.estado || evento.status || "N/A"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                </Table.TableRow>
                            ))
                        )}
                    </Table.TableBody>
                </Table.Table>
            </Card.Card>

            <ExportModal
                open={openExport}
                onOpenChange={setOpenExport}
                onExport={handleExport}
            />
        </div>
    )
}