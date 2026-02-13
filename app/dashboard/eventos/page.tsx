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
import { formatDateOnly, formatNumber } from "@/utils/helpers"
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

export default function EventosPage() {
    const [openExport, setOpenExport] = useState(false);
    const [searchValue, setSearchValue] = useState("")
    const [eventos, setEventos] = useState<Evento[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Filtros
    const [tipoEventoFilter, setTipoEventoFilter] = useState<"COMPRA" | "CAMBIO" | "DEVOLUCION" | null>(null)
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
            }

            // Aplicar filtros
            if (tipoEventoFilter) {
                params.tipo_evento = tipoEventoFilter
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
        tipoEventoFilter,
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
            if (tipoEventoFilter) params.tipo_evento = tipoEventoFilter
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
                Tipo: getTipoEventoLabel(evento.tipo_evento),
                "Origen - Destino": `${evento.terminal_origen} → ${evento.terminal_destino}`,
                "Fecha Viaje": formatDateOnly(evento.fecha_viaje),
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
                    evento.estado === "ANULADO"
                        ? "Anulado"
                        : evento.estado === "REVERTIDO"
                            ? "Revertido"
                            : "Confirmado",
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

    const getTipoEventoLabel = (tipo: "COMPRA" | "CAMBIO" | "DEVOLUCION") => {
        switch (tipo) {
            case "COMPRA": return "Compra"
            case "CAMBIO": return "Cambio"
            case "DEVOLUCION": return "Devolución"
            default: return tipo
        }
    }

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Eventos"
                description="Historial de todos los eventos del sistema."
                actionButtons={actionButtons}
                showSearch={true}
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
                filters={
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Tipo de Evento</label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    value={tipoEventoFilter || ""}
                                    onChange={(e) => setTipoEventoFilter(e.target.value ? e.target.value as any : null)}
                                >
                                    <option value="">Todos los tipos</option>
                                    <option value="COMPRA">Compra</option>
                                    <option value="CAMBIO">Cambio</option>
                                    <option value="DEVOLUCION">Devolución</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Empresa</label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    value={empresaFilter || ""}
                                    onChange={(e) => setEmpresaFilter(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">Todas las empresas</option>
                                    {empresas.map((empresa) => (
                                        <option key={empresa.id} value={empresa.id}>
                                            {empresa.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Pasajero</label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    value={pasajeroFilter || ""}
                                    onChange={(e) => setPasajeroFilter(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">Todos los pasajeros</option>
                                    {pasajeros.map((pasajero) => (
                                        <option key={pasajero.id} value={pasajero.id}>
                                            {pasajero.nombres} {pasajero.apellidos} ({pasajero.rut})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Convenio</label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    value={convenioFilter || ""}
                                    onChange={(e) => setConvenioFilter(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">Todos los convenios</option>
                                    {convenios.map((convenio) => (
                                        <option key={convenio.id} value={convenio.id}>
                                            {convenio.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-end gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Fecha del Evento</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full gap-2">
                                            <Icon.Calendar className="h-4 w-4" />
                                            {dateRange?.from
                                                ? dateRange.to
                                                    ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                                                    : format(dateRange.from, "dd/MM/yyyy")
                                                : "Seleccionar rango"}
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

                            {(tipoEventoFilter || empresaFilter || pasajeroFilter || convenioFilter || dateRange) && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setTipoEventoFilter(null)
                                        setEmpresaFilter(null)
                                        setPasajeroFilter(null)
                                        setConvenioFilter(null)
                                        setDateRange(undefined)
                                    }}
                                >
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    </div>
                }
            />
            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Tipo</Table.TableHead>
                            <Table.TableHead>Origen - Destino</Table.TableHead>
                            <Table.TableHead>Fecha Viaje</Table.TableHead>
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
                                <Table.TableCell colSpan={11} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : eventos.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={11} className="text-center py-8">
                                    No se encontraron eventos
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            eventos.map((evento) => (
                                <Table.TableRow key={evento.id}>
                                    <Table.TableCell>{evento.id}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus
                                            status={
                                                evento.tipo_evento === "COMPRA" ? "active" :
                                                    evento.tipo_evento === "CAMBIO" ? "warning" : "inactive"
                                            }
                                        >
                                            {getTipoEventoLabel(evento.tipo_evento)}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {evento.terminal_origen} → {evento.terminal_destino}
                                    </Table.TableCell>
                                    <Table.TableCell>{formatDateOnly(evento.fecha_viaje)}</Table.TableCell>
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
                                        {
                                            evento.estado === "ANULADO"
                                                ? "Anulado"
                                                : evento.estado === "REVERTIDO"
                                                    ? "Revertido"
                                                    : "Confirmado"
                                        }
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