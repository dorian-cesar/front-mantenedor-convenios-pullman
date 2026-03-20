"use client"

import { Button } from "@/components/ui/button"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
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
    const [statusFilter, setStatusFilter] = useState<"compra" | "anulado" | null>(null)
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
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchEventos = async () => {
        setIsLoading(true)
        try {
            const params: GetEventosParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
                tipo_evento: 'COMPRA',
            }

            // Aplicar filtros
            if (statusFilter === "anulado") {
                params.estado = "anulado"
                params.status = "anulado"
            } else if (statusFilter === "compra") {
                params.estado = "confirmado"
                params.status = "confirmado"
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
                params.fecha_inicio = format(dateRange.from, 'yyyy-MM-dd')
            }

            if (dateRange?.to) {
                params.fecha_fin = format(dateRange.to, 'yyyy-MM-dd')
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

            const response = await EventosService.getEventos(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map((evento) => ({
                ID: evento.id,
                Tipo: getTipoEventoLabel(evento),
                "Origen - Destino": `${evento.terminal_origen} → ${evento.terminal_destino}`,
                "Fecha Viaje": formatDateOnly(evento.fecha_viaje),
                "Hora Salida": evento.hora_salida ?? "N/A",
                "Fecha Evento": formatDateOnly(evento.fecha_evento),
                "Fecha Compra": formatDateTime(evento.fecha_compra),
                "Tarifa Base": `$${formatNumber(evento.tarifa_base)}`,
                "Monto Pagado": `$${formatNumber(evento.monto_pagado)}`,
                Descuento: `${evento.porcentaje_descuento_aplicado}%`,
                "Código Autorización": evento.codigo_autorizacion ?? "N/A",
                Empresa: evento.empresa?.nombre || "N/A",
                Pasajero: evento.pasajero
                    ? `${evento.pasajero.nombres} ${evento.pasajero.apellidos}`
                    : "N/A",
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
                                {statusFilter === "compra" ? "Confirmados" : statusFilter === "anulado" ? "Anulados" : "Todos"}
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
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>

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

                {(statusFilter || empresaFilter || pasajeroFilter || convenioFilter || dateRange) && (
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
                    />
                }
                filters={filters}
            />
            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Tipo</Table.TableHead>
                            <Table.TableHead>Origen - Destino</Table.TableHead>
                            <Table.TableHead>Fecha Viaje</Table.TableHead>
                            <Table.TableHead>Hora Salida</Table.TableHead>
                            <Table.TableHead>Fecha Compra</Table.TableHead>
                            <Table.TableHead>Tarifa Base</Table.TableHead>
                            <Table.TableHead>Monto Pagado</Table.TableHead>
                            <Table.TableHead>Descuento</Table.TableHead>
                            <Table.TableHead>Código Autorización</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Pasajero</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
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
                                    <Table.TableCell>{evento.id}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus
                                            status={
                                                evento.estado === "anulado" ? "inactive" : "active"
                                            }
                                        >
                                            {getTipoEventoLabel(evento)}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {evento.terminal_origen} → {evento.terminal_destino}
                                    </Table.TableCell>
                                    <Table.TableCell>{formatDateOnly(evento.fecha_viaje)}</Table.TableCell>
                                    <Table.TableCell>{evento.hora_salida ?? "N/A"}</Table.TableCell>
                                    <Table.TableCell>{formatDateTime(evento.fecha_compra)}</Table.TableCell>
                                    <Table.TableCell>${formatNumber(evento.tarifa_base)}</Table.TableCell>
                                    <Table.TableCell>${formatNumber(evento.monto_pagado)}</Table.TableCell>
                                    <Table.TableCell>{evento.porcentaje_descuento_aplicado}%</Table.TableCell>
                                    <Table.TableCell>{evento.codigo_autorizacion ?? "N/A"}</Table.TableCell>
                                    <Table.TableCell>
                                        {evento.empresa?.nombre || "N/A"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {evento.pasajero
                                            ? `${evento.pasajero.nombres} ${evento.pasajero.apellidos}`
                                            : "N/A"
                                        }
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {evento.convenio?.nombre || "N/A"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={evento.estado === "anulado" ? "anulado" : "confirmado"}>
                                            {
                                                evento.estado === "anulado"
                                                    ? "anulado"
                                                    : "confirmado"
                                            }
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