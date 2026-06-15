"use client"

import { Button } from "@/components/ui/button"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState, useEffect, useMemo } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/dashboard/Pagination"
import { Calendar } from "@/components/ui/calendar"
import { formatDateOnly, formatNumber, formatDateTime } from "@/utils/helpers"
import { Input } from "@/components/ui/input"
import { es } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import ExportModal from "@/components/modals/export"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxTrigger,
} from "@/components/ui/combobox"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { format, addDays, addHours, startOfDay } from "date-fns"
import { EventosService, type Evento, type GetEventosParams } from "@/services/evento.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { PasajerosService, type Pasajero } from "@/services/pasajero.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { useAuth } from "@/hooks/useAuth"
import { KpiService, type Resumen, type GetResumenParams } from "@/services/kpi.service";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Pie, PieChart, ResponsiveContainer, Legend } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const chartConfig = {
    ventas: {
        label: "Ventas",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

const selectOptions = [
    { value: "diario", label: "Diario" },
    { value: "semanal", label: "Semanal" },
    { value: "mensual", label: "Mensual" },
    { value: "trimestral", label: "Trimestral" },
    { value: "semestral", label: "Semestral" },
    { value: "anual", label: "Anual" },
    { value: "bienal", label: "2 Años" },
    { value: "trienal", label: "3 Años" },
    { value: "cuatrienal", label: "4 Años" },
    { value: "quinquenal", label: "5 Años" },
]

export default function EventosPage() {
    const [openExport, setOpenExport] = useState(false);
    const [dismissedErrorCount, setDismissedErrorCount] = useState(0);
    const [dismissedRevisarCount, setDismissedRevisarCount] = useState(0);
    const [dismissedExpiradoCount, setDismissedExpiradoCount] = useState(0);
    const [stats, setStats] = useState({
        confirmados: 0,
        anulados: 0,
        error_confirmacion: 0,
        revisar: 0,
        expirados: 0,
        total: 0
    })

    // Si los contadores de errores o pendientes bajan, sincronizamos el umbral de descarte
    useEffect(() => {
        if (stats.error_confirmacion < dismissedErrorCount) {
            setDismissedErrorCount(stats.error_confirmacion)
        }
        if (stats.revisar < dismissedRevisarCount) {
            setDismissedRevisarCount(stats.revisar)
        }
        if (stats.expirados < dismissedExpiradoCount) {
            setDismissedExpiradoCount(stats.expirados)
        }
    }, [stats.error_confirmacion, stats.revisar, stats.expirados, dismissedErrorCount, dismissedRevisarCount, dismissedExpiradoCount])

    const [searchValue, setSearchValue] = useState("")
    const [eventos, setEventos] = useState<Evento[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { user, initialized: authInitialized } = useAuth()
    
    // Lógica de Rol y Empresa robusta
    const isUserRole = user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user";
    const effectiveEmpresaId = user?.empresa_id || user?.empresaId || user?.id_empresa || user?.empresa?.id;


    // Filtros
    const [statusFilter, setStatusFilter] = useState<"compra" | "anulado" | "error_confirmacion" | "revisar" | "expirado" | "" | null>(null)
    const [empresaFilter, setEmpresaFilter] = useState<number | null>(null)
    const [pasajeroFilter, setPasajeroFilter] = useState<number | null>(null)
    const [convenioFilter, setConvenioFilter] = useState<number | null>(null)
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
    const [rutFilter, setRutFilter] = useState("")
    const [nombreFilter, setNombreFilter] = useState("")
    const [idFilter, setIdFilter] = useState("")
    const [pnrFilter, setPnrFilter] = useState("")
    const [ticketFilter, setTicketFilter] = useState("")

    // Datos para selectores
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [pasajeros, setPasajeros] = useState<Pasajero[]>([])
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [pasajeroSearch, setPasajeroSearch] = useState("")

    const filteredPasajerosList = useMemo(() => {
        if (!pasajeroSearch.trim()) return pasajeros;
        const search = pasajeroSearch.toLowerCase();
        return pasajeros.filter(p =>
            p.nombres?.toLowerCase().includes(search) ||
            p.apellidos?.toLowerCase().includes(search) ||
            p.rut?.toLowerCase().includes(search)
        );
    }, [pasajeros, pasajeroSearch]);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    // KPI States para el rol USUARIO
    const [resumen, setResumen] = useState<Resumen[]>([]);
    const [porConvenio, setPorConvenio] = useState<any[]>([]);
    const [isKpiLoading, setIsKpiLoading] = useState(false);
    const [granularidad, setGranularidad] = useState<"diario" | "semanal" | "mensual" | "trimestral" | "semestral" | "anual" | "bienal" | "trienal" | "cuatrienal" | "quinquenal">("diario")

    const fetchResumen = async () => {
        if (!isUserRole) return;
        setIsKpiLoading(true)
        try {
            const params: GetResumenParams = {
                granularidad,
                fecha_inicio: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
                fecha_fin: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
            }
            
            // Forzamos la actualización de KPIs con los mismos parámetros que las estadísticas
            const [resResponse, convResponse] = await Promise.all([
                KpiService.getResumen(params),
                KpiService.getPorConvenio(params)
            ])
            
            setResumen(resResponse.rows || [])
            setPorConvenio(convResponse || [])
        } catch (error) {
            console.error('Error fetching resumen:', error)
            setResumen([])
            setPorConvenio([])
        } finally {
            setIsKpiLoading(false)
        }
    }

    const chartData = useMemo(() => {
        if (resumen.length === 0) return [];

        const data = resumen.map(item => ({
            periodo: item.periodo,
            cantidad: Number(item.total_pasajeros || 0),
            ventas: Number(item.total_ventas || 0),
            fecha: new Date(item.fecha_ref || '')
        }));

        const filled: any[] = [];
        // Priorizar el rango del calendario si existe
        const startBound = dateRange?.from || data[0].fecha;
        const endBound = dateRange?.to || (data.length > 1 ? data[data.length - 1].fecha : new Date());

        // Lógica de relleno según granularidad
        if (granularidad === 'diario') {
            // Rellenar horas (Desde el inicio del día seleccionado hasta el fin del día seleccionado)
            let current = new Date(startBound);
            current.setHours(0, 0, 0, 0);
            const limit = new Date(endBound);
            limit.setHours(23, 59, 59, 999);
            
            while (current <= limit) {
                // Buscamos si hay un registro en esta hora exacta de este día exacto
                const found = data.find(d => 
                    d.fecha.getDate() === current.getDate() && 
                    d.fecha.getMonth() === current.getMonth() &&
                    d.fecha.getHours() === current.getHours()
                );
                
                filled.push({
                    periodo: format(current, "HH:00"),
                    fullLabel: format(current, "dd/MM HH:00"),
                    cantidad: found ? found.cantidad : 0,
                    ventas: found ? found.ventas : 0
                });
                current = addHours(current, 1);
            }
        } else if (granularidad === 'semanal' || granularidad === 'mensual') {
            // Rellenar días según el rango seleccionado
            let current = startOfDay(startBound);
            const limit = startOfDay(endBound);
            
            while (current <= limit) {
                const label = format(current, "dd/MM");
                const found = data.find(d => format(d.fecha, "dd/MM") === label);
                filled.push({
                    periodo: label,
                    cantidad: found ? found.cantidad : 0,
                    ventas: found ? found.ventas : 0
                });
                current = addDays(current, 1);
            }
        } else if (granularidad === 'anual') {
            // Rellenar meses (Desde Enero del año de inicio hasta el fin del rango)
            let current = new Date(startBound.getFullYear(), 0, 1); 
            const limit = new Date(endBound.getFullYear(), endBound.getMonth(), 1);
            
            while (current <= limit) {
                const label = format(current, "MMM yyyy", { locale: es });
                // Buscamos coincidencia por mes y año
                const found = data.find(d => 
                    d.fecha.getMonth() === current.getMonth() && 
                    d.fecha.getFullYear() === current.getFullYear()
                );
                
                filled.push({
                    periodo: label.charAt(0).toUpperCase() + label.slice(1),
                    cantidad: found ? found.cantidad : 0,
                    ventas: found ? found.ventas : 0
                });
                current = new Date(current.setMonth(current.getMonth() + 1));
            }
        } else {
            return data;
        }

        return filled;
    }, [resumen, granularidad]);

    const chartConfig = {
        cantidad: {
            label: "Boletos Vendidos",
            color: "hsl(var(--primary))",
        },
    } satisfies ChartConfig

    const debouncedSearch = useDebounce(searchValue, 500)
    const debouncedRut = useDebounce(rutFilter, 500)
    const debouncedNombre = useDebounce(nombreFilter, 500)
    const debouncedId = useDebounce(idFilter, 500)
    const debouncedPnr = useDebounce(pnrFilter, 500)
    const debouncedTicket = useDebounce(ticketFilter, 500)

    const fetchEventos = async () => {
        // Esperar a que la autenticación esté lista Y enriquecida si es necesario
        const isWaitingForID = (user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user") && 
                               !effectiveEmpresaId;
        
        if (!authInitialized || isWaitingForID) return;
        
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
            } else if (statusFilter === "expirado") {
                params.estado = "expirado"
            }
            // Para "revisar" (N/A) no enviamos el filtro al API para poder filtrar los blancos en el front


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

            // Restricción por Rol: Si es USUARIO (o user), forzar su empresa_id
            if (isUserRole && effectiveEmpresaId) {
                params.empresa_id = effectiveEmpresaId;
            }

            // Nuevos parámetros de búsqueda servidor
            if (debouncedSearch) params.search = debouncedSearch
            if (debouncedRut) params.rut = debouncedRut
            if (debouncedNombre) params.nombre = debouncedNombre
            if (debouncedId) params.id = debouncedId
            if (debouncedPnr) params.pnr = debouncedPnr
            if (debouncedTicket) params.numero_ticket = debouncedTicket

            const fetchParams = { ...params }
            // Si el filtro es N/A, traemos un bloque grande (400) para buscar los "blancos" en el front
            if (statusFilter === "revisar") {
                fetchParams.limit = 400
            }

            const response = await EventosService.getEventos(fetchParams)
            let finalRows = response.rows
            let totalToUse = response.totalItems

            // Si el filtro es N/A, filtramos manualmente para incluir los que tienen estado vacío
            if (statusFilter === "revisar") {
                finalRows = response.rows.filter((evento: Evento) => 
                    !evento.estado || 
                    evento.status?.toLowerCase() === "revisar"
                )
                // Usamos el total calculado en las stats para la paginación de N/A
                totalToUse = stats.revisar
            }

            setEventos(finalRows)
            setPagination(prev => ({
                ...prev,
                total: totalToUse,
                totalPages: Math.ceil(totalToUse / (statusFilter === "revisar" ? 400 : pagination.limit)) || 1,
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

    const fetchStats = async () => {
        // Esperar a que la autenticación esté lista Y enriquecida si es necesario
        const isWaitingForID = (user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user") && 
                               !effectiveEmpresaId;
        
        if (!authInitialized || isWaitingForID) return;
        try {
            const baseParams: any = {
                limit: 1,
                tipo_evento: 'COMPRA',
            }

            if (empresaFilter) baseParams.empresa_id = empresaFilter
            if (pasajeroFilter) baseParams.pasajero_id = pasajeroFilter
            if (convenioFilter) baseParams.convenio_id = convenioFilter
            if (dateRange?.from) baseParams.startDate = dateRange.from.toISOString()
            if (dateRange?.to) baseParams.endDate = dateRange.to.toISOString()

            // Restricción por Rol: Si es USUARIO (o user), forzar su empresa_id
            if (isUserRole && effectiveEmpresaId) {
                baseParams.empresa_id = effectiveEmpresaId;
            }

            const [all, conf, anul, err, rev, exp] = await Promise.all([
                EventosService.getEventos({ ...baseParams }),
                EventosService.getEventos({ ...baseParams, estado: 'confirmado' }),
                EventosService.getEventos({ ...baseParams, estado: 'anulado' }),
                EventosService.getEventos({ ...baseParams, estado: 'error_confirmacion' }),
                EventosService.getEventos({ ...baseParams, estado: 'revisar' }),
                EventosService.getEventos({ ...baseParams, estado: 'expirado' }),
            ])

            setStats({
                total: all.totalItems,
                confirmados: conf.totalItems,
                anulados: anul.totalItems,
                error_confirmacion: err.totalItems,
                expirados: exp.totalItems,
                revisar: all.totalItems - conf.totalItems - anul.totalItems - err.totalItems - exp.totalItems,
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
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
        fetchEmpresas()
        fetchPasajeros()
        fetchConvenios()
    }, [])

    useEffect(() => {
        fetchEventos()
    }, [
        pagination.page,
        pagination.limit,
        statusFilter,
        empresaFilter,
        pasajeroFilter,
        convenioFilter,
        dateRange,
        debouncedSearch,
        debouncedRut,
        debouncedNombre,
        debouncedId,
        debouncedPnr,
        debouncedTicket,
        user,
        authInitialized
    ])

    useEffect(() => {
        fetchStats()
        fetchResumen()
    }, [
        pasajeroFilter,
        convenioFilter,
        dateRange,
        user,
        authInitialized,
        granularidad
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
        fetchStats()
        fetchResumen()
    }

    const handleCopyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} ${text} copiado al portapapeles`, {
            icon: <Icon.Copy className="h-4 w-4" />,
            duration: 2000
        })
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
            if (statusFilter === "expirado") params.estado = "expirado"
            if (empresaFilter) params.empresa_id = empresaFilter
            if (pasajeroFilter) params.pasajero_id = pasajeroFilter
            if (convenioFilter) params.convenio_id = convenioFilter
            if (dateRange?.from) params.fecha_inicio = format(dateRange.from, "yyyy-MM-dd")
            if (dateRange?.to) params.fecha_fin = format(dateRange.to, "yyyy-MM-dd")

            // Restricción por Rol: Si es USUARIO (o user), forzar su empresa_id
            if (isUserRole && effectiveEmpresaId) {
                params.empresa_id = effectiveEmpresaId;
            } else if (empresaFilter) {
                params.empresa_id = empresaFilter;
            }

            const response = await EventosService.getEventos(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map((evento) => ({
                ID: evento.id,
                Tipo: evento.tipo_evento || "COMPRA",
                "Fecha Compra": formatDateTime(evento.fecha_compra || evento.created_at || evento.fecha_evento),
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
                    evento.status?.toLowerCase() === "error_confirmacion" ? "Error" :
                    (evento.status?.toLowerCase() === "revisar" || !evento.estado) ? "N/A" :
                    evento.estado || "N/A",
                "Tipo Pasajero": evento.convenio_id ? (evento.invitado ? "Invitado" : "Beneficiario") : "N/A",
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
                                 statusFilter === "revisar" ? "N/A" :
                                 statusFilter === "expirado" ? "Expirados" : "Todos"}
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
                                Todos los Revisar
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("expirado")}>
                                Expirados
                            </Dropdown.DropdownMenuItem>
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>

                {(user?.rol?.toUpperCase() === "SUPER_USUARIO" || user?.rol?.toUpperCase() === "SISTEMA") && (
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
                    <Combobox
                        value={pasajeros.find((p) => p.id === pasajeroFilter) || null}
                        onValueChange={(val: any) => {
                            setPasajeroFilter(val?.id || null);
                            setPasajeroSearch("");
                        }}
                        items={filteredPasajerosList}
                        itemToStringValue={(p: any) => p ? `${p.nombres} ${p.apellidos}` : "Todos"}
                    >
                        <ComboboxInput
                            placeholder="Buscar pasajero..."
                            className="h-9 w-[220px]"
                            value={pasajeroSearch}
                            onChange={(e) => setPasajeroSearch(e.target.value)}
                        />
                        <ComboboxContent>
                            <ComboboxEmpty>No hay resultados</ComboboxEmpty>
                            <ComboboxItem value={null!}>
                                Todos
                            </ComboboxItem>
                            {filteredPasajerosList.map((p: Pasajero) => (
                                <ComboboxItem key={p.id} value={p}>
                                    {p.nombres} {p.apellidos}
                                </ComboboxItem>
                            ))}
                        </ComboboxContent>
                    </Combobox>
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

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Nombre:</span>
                    <Input
                        placeholder="Buscar por nombre..."
                        value={nombreFilter}
                        onChange={(e) => setNombreFilter(e.target.value)}
                        className="h-9 w-[180px]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">RUT:</span>
                    <Input
                        placeholder="Buscar por RUT..."
                        value={rutFilter}
                        onChange={(e) => setRutFilter(e.target.value)}
                        className="h-9 w-[150px]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">ID Boleto:</span>
                    <Input
                        placeholder="ID..."
                        value={idFilter}
                        onChange={(e) => setIdFilter(e.target.value)}
                        className="h-9 w-[100px]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">PNR:</span>
                    <Input
                        placeholder="PNR..."
                        value={pnrFilter}
                        onChange={(e) => setPnrFilter(e.target.value)}
                        className="h-9 w-[120px]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Ticket:</span>
                    <Input
                        placeholder="Tkt..."
                        value={ticketFilter}
                        onChange={(e) => setTicketFilter(e.target.value)}
                        className="h-9 w-[120px]"
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="ml-auto flex items-center gap-2">
                    <Badge variant="secondary" className="h-9 px-4 text-sm font-medium whitespace-nowrap">
                        Total: {pagination.total} registros
                    </Badge>
                </div>

                {(statusFilter || empresaFilter || pasajeroFilter || convenioFilter || dateRange?.from || rutFilter || nombreFilter || idFilter || pnrFilter || ticketFilter) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setStatusFilter(null)
                            setEmpresaFilter(null)
                            setPasajeroFilter(null)
                            setConvenioFilter(null)
                            setDateRange(undefined)
                            setRutFilter("")
                            setNombreFilter("")
                            setIdFilter("")
                            setPnrFilter("")
                            setTicketFilter("")
                            setSearchValue("")
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

            {/* Dashboard para Rol USUARIO */}
            {isUserRole && (
                <div className="space-y-4 animate-in fade-in duration-700">
                    {/* Totales Calculados */}
                    {(() => {
                        const totalVentas = resumen.reduce((acc, curr) => acc + Number(curr.total_ventas || 0), 0);
                        const totalDevoluciones = resumen.reduce((acc, curr) => acc + Number(curr.total_devoluciones || 0), 0);
                        const totalDescuento = resumen.reduce((acc, curr) => acc + Number(curr.total_descuento || 0), 0);
                        const totalPasajesCount = resumen.reduce((acc, curr) => acc + Number(curr.total_pasajeros || 0), 0);

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card.Card className="row-span-1">
                                    <Card.CardHeader>
                                        <Card.CardTitle>Ventas Totales</Card.CardTitle>
                                        <Card.CardAction><Icon.DollarSign className="h-4 w-4 text-muted-foreground" /></Card.CardAction>
                                    </Card.CardHeader>
                                    <Card.CardContent>
                                        {isKpiLoading ? "Cargando..." : <p className="text-2xl font-bold">${formatNumber(totalVentas)}</p>}
                                    </Card.CardContent>
                                </Card.Card>

                                <Card.Card className="row-span-1">
                                    <Card.CardHeader>
                                        <Card.CardTitle>Devoluciones</Card.CardTitle>
                                        <Card.CardAction><Icon.Undo2 className="h-4 w-4 text-muted-foreground" /></Card.CardAction>
                                    </Card.CardHeader>
                                    <Card.CardContent>
                                        {isKpiLoading ? "Cargando..." : <p className="text-2xl font-bold">${formatNumber(totalDevoluciones)}</p>}
                                    </Card.CardContent>
                                </Card.Card>

                                <Card.Card className="row-span-1">
                                    <Card.CardHeader>
                                        <Card.CardTitle>Total Descuentos</Card.CardTitle>
                                        <Card.CardAction><Icon.Percent className="h-4 w-4 text-muted-foreground" /></Card.CardAction>
                                    </Card.CardHeader>
                                    <Card.CardContent>
                                        {isKpiLoading ? "Cargando..." : <p className="text-2xl font-bold">${formatNumber(totalDescuento)}</p>}
                                    </Card.CardContent>
                                </Card.Card>

                                <Card.Card className="row-span-1">
                                    <Card.CardHeader>
                                        <Card.CardTitle>Total Pasajes</Card.CardTitle>
                                        <Card.CardAction><Icon.Activity className="h-4 w-4 text-muted-foreground" /></Card.CardAction>
                                    </Card.CardHeader>
                                    <Card.CardContent>
                                        {isKpiLoading ? "Cargando..." : <p className="text-2xl font-bold">{totalPasajesCount}</p>}
                                    </Card.CardContent>
                                </Card.Card>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 gap-4">
                        <Card.Card className="flex flex-col h-[450px] w-full">
                            <Card.CardHeader>
                                <Card.CardTitle>Resumen de Ventas</Card.CardTitle>
                                <Card.CardAction>
                                    <div className="flex items-center gap-2">
                                        <Select value={granularidad} onValueChange={(v: any) => setGranularidad(v)}>
                                            <SelectTrigger className="h-8 w-[180px]">
                                                <SelectValue placeholder="Granularidad" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="diario">Diario</SelectItem>
                                                <SelectItem value="semanal">Semanal</SelectItem>
                                                <SelectItem value="mensual">Mensual</SelectItem>
                                                <SelectItem value="trimestral">Trimestral</SelectItem>
                                                <SelectItem value="semestral">Semestral</SelectItem>
                                                <SelectItem value="anual">Anual</SelectItem>
                                                <SelectItem value="bienal">Últimos 2 años</SelectItem>
                                                <SelectItem value="trienal">Últimos 3 años</SelectItem>
                                                <SelectItem value="cuatrienal">Últimos 4 años</SelectItem>
                                                <SelectItem value="quinquenal">Últimos 5 años</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </Card.CardAction>
                            </Card.CardHeader>
                            <Card.CardContent className="flex-1 pb-0">
                                {isKpiLoading ? (
                                    <div className="flex items-center justify-center h-full w-full">Cargando...</div>
                                ) : resumen.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground text-center p-4">
                                        <Icon.BarChart3 className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="font-medium">Sin datos para el período</p>
                                        <p className="text-xs">Prueba cambiando la granularidad (Mes/Año) o el rango de fechas.</p>
                                    </div>
                                ) : (
                                    <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
                                        <BarChart
                                            accessibilityLayer
                                            data={chartData}
                                            margin={{ left: 12, right: 12 }}
                                        >
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="periodo"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                tickFormatter={(value) => value}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent indicator="dashed" />}
                                            />
                                            <Bar
                                                dataKey="cantidad"
                                                radius={[4, 4, 0, 0]}
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={[
                                                            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
                                                            '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6', '#6366f1'
                                                        ][index % 10]} 
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ChartContainer>
                                )}
                            </Card.CardContent>
                        </Card.Card>
                    </div>
                </div>
            )}

            {(stats.error_confirmacion > dismissedErrorCount || stats.revisar > dismissedRevisarCount || stats.expirados > dismissedExpiradoCount) && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg border-red-200">
                    <Icon.AlertOctagon className="h-4 w-4" />
                    <AlertTitle className="font-bold">Alarma: Nuevos Incidentes Detectados</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            {stats.error_confirmacion > dismissedErrorCount && (
                                <span>• Se detectaron <strong>{stats.error_confirmacion - dismissedErrorCount}</strong> nuevos boletos con error de confirmación.</span>
                            )}
                            {stats.revisar > dismissedRevisarCount && (
                                <span>• Se detectaron <strong>{stats.revisar - dismissedRevisarCount}</strong> nuevos boletos pendientes (N/A) por revisar.</span>
                            )}
                            {stats.expirados > dismissedExpiradoCount && (
                                <span>• Se detectaron <strong>{stats.expirados - dismissedExpiradoCount}</strong> nuevos boletos **expirados**.</span>
                            )}
                            <span className="text-[10px] text-red-700/80 mt-1 italic">
                                Total acumulado: {stats.error_confirmacion} errores, {stats.revisar} pendientes y {stats.expirados} expirados.
                            </span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px] border-red-300 text-red-900 hover:bg-red-100/50 bg-white/50"
                                onClick={() => {
                                    setDismissedErrorCount(stats.error_confirmacion);
                                    setDismissedRevisarCount(stats.revisar);
                                    setDismissedExpiradoCount(stats.expirados);
                                }}
                            >
                                Marcar como Vistos
                            </Button>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="h-7 text-[10px] bg-red-600 hover:bg-red-700 font-bold"
                                onClick={() => setStatusFilter(stats.error_confirmacion > dismissedErrorCount ? 'error_confirmacion' : stats.expirados > dismissedExpiradoCount ? 'expirado' : 'revisar')}
                            >
                                Revisar Ahora
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card.Card
                    className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${statusFilter === null ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                    onClick={() => setStatusFilter(null)}
                >
                    <Card.CardHeader className="pb-2">
                        <Card.CardTitle className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <Icon.List className="h-3 w-3" /> Total General
                        </Card.CardTitle>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card
                    className={`cursor-pointer transition-all hover:ring-2 hover:ring-green-500/20 ${statusFilter === 'compra' ? 'ring-2 ring-green-500 bg-green-50/50' : ''}`}
                    onClick={() => setStatusFilter('compra')}
                >
                    <Card.CardHeader className="pb-2">
                        <Card.CardTitle className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-2">
                            <Icon.CheckCircle2 className="h-3 w-3" /> Confirmados
                        </Card.CardTitle>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.confirmados}</div>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card
                    className={`cursor-pointer transition-all hover:ring-2 hover:ring-red-500/20 ${
                        statusFilter === 'error_confirmacion' ? 'ring-2 ring-red-500 bg-red-50/50' : ''
                    } ${stats.error_confirmacion > 0 ? 'animate-pulse border-red-500 ring-2 ring-red-500/30 bg-red-50/50' : ''}`}
                    onClick={() => setStatusFilter('error_confirmacion')}
                >
                    <Card.CardHeader className="pb-2">
                        <Card.CardTitle className={`text-[10px] font-bold uppercase flex items-center gap-2 ${stats.error_confirmacion > 0 ? 'text-red-700' : 'text-red-600'}`}>
                            <Icon.AlertTriangle className={`h-3 w-3 ${stats.error_confirmacion > 0 ? 'animate-bounce' : ''}`} /> Error Confirmación
                        </Card.CardTitle>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className={`text-2xl font-bold ${stats.error_confirmacion > 0 ? 'text-red-700' : 'text-red-600'}`}>
                            {stats.error_confirmacion}
                        </div>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card
                    className={`cursor-pointer transition-all hover:ring-2 hover:ring-amber-500/20 ${statusFilter === 'revisar' ? 'ring-2 ring-amber-500 bg-amber-50/50' : ''}`}
                    onClick={() => setStatusFilter('revisar')}
                >
                    <Card.CardHeader className="pb-2">
                        <Card.CardTitle className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-2">
                            <Icon.Search className="h-3 w-3" /> N/A
                        </Card.CardTitle>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.revisar}</div>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card
                    className={`cursor-pointer transition-all hover:ring-2 hover:ring-slate-500/20 ${
                        statusFilter === 'expirado' ? 'ring-2 ring-slate-500 bg-slate-50/50' : ''
                    } ${stats.expirados > dismissedExpiradoCount ? 'animate-pulse border-red-500 ring-2 ring-red-500/30 bg-red-50/50' : ''}`}
                    onClick={() => setStatusFilter('expirado')}
                >
                    <Card.CardHeader className="pb-2">
                        <Card.CardTitle className={`text-[10px] font-bold uppercase flex items-center gap-2 ${stats.expirados > dismissedExpiradoCount ? 'text-red-700' : 'text-slate-600'}`}>
                            <Icon.TimerIcon className={`h-3 w-3 ${stats.expirados > dismissedExpiradoCount ? 'animate-bounce' : ''}`} /> Expirados
                        </Card.CardTitle>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className={`text-2xl font-bold ${stats.expirados > dismissedExpiradoCount ? 'text-red-700' : 'text-slate-600'}`}>
                            {stats.expirados}
                        </div>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card
                    className={`cursor-pointer transition-all hover:ring-2 hover:ring-slate-500/20 ${statusFilter === 'anulado' ? 'ring-2 ring-slate-500 bg-slate-50/50' : ''}`}
                    onClick={() => setStatusFilter('anulado')}
                >
                    <Card.CardHeader className="pb-2">
                        <Card.CardTitle className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-2">
                            <Icon.XCircle className="h-3 w-3" /> Anulados
                        </Card.CardTitle>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold text-slate-600">{stats.anulados}</div>
                    </Card.CardContent>
                </Card.Card>
            </div>

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
                            <Table.TableHead>Tipo Pasajero</Table.TableHead>
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
                        ) : eventos.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={14} className="text-center py-8">
                                    No se encontraron eventos
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            eventos.map((evento) => (
                                <Table.TableRow key={evento.id}>
                                    <Table.TableCell className="font-medium text-xs">
                                        <div className="flex flex-col gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span 
                                                        className="cursor-pointer hover:text-primary transition-colors hover:underline underline-offset-2"
                                                        onClick={() => handleCopyToClipboard(evento.id.toString(), "ID")}
                                                    >
                                                        #{evento.id}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">Clic para copiar ID</TooltipContent>
                                            </Tooltip>
                                            <Badge variant="secondary" className="w-fit text-[9px] px-1 py-0 h-4 uppercase">
                                                {evento.tipo_evento || "COMPRA"}
                                            </Badge>
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-xs">{formatDateTime(evento.fecha_compra || evento.created_at || evento.fecha_evento)}</Table.TableCell>
                                    <Table.TableCell>
                                        <div className="flex flex-col">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span 
                                                        className="font-bold text-sm text-primary cursor-pointer hover:underline underline-offset-4 active:scale-95 transition-all"
                                                        onClick={() => handleCopyToClipboard(evento.pnr || "", "PNR")}
                                                    >
                                                        {evento.pnr || "N/A"}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">Clic para copiar PNR</TooltipContent>
                                            </Tooltip>
                                            <div className="flex flex-col text-[10px] text-muted-foreground leading-tight mt-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span 
                                                            className="cursor-pointer hover:text-primary transition-colors"
                                                            onClick={() => handleCopyToClipboard(evento.numero_ticket || "", "Ticket")}
                                                        >
                                                            Tkt: {evento.numero_ticket || "S/N"}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom">Clic para copiar Ticket</TooltipContent>
                                                </Tooltip>
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
                                            {evento.pasajero ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span 
                                                            className="font-medium cursor-pointer hover:text-primary transition-colors decoration-dotted underline-offset-4 hover:underline active:scale-95 transition-transform"
                                                            onClick={() => handleCopyToClipboard(evento.pasajero!.rut, "RUT")}
                                                            title="Clic para copiar RUT"
                                                        >
                                                            {evento.pasajero.nombres} {evento.pasajero.apellidos}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="flex flex-col gap-1 p-2">
                                                        <div className="flex items-center gap-2">
                                                            <Icon.User className="h-3 w-3 text-primary" />
                                                            <span className="font-bold text-[10px]">Datos del Pasajero</span>
                                                        </div>
                                                        <div className="text-[10px] space-y-0.5">
                                                            <p><span className="text-muted-foreground mr-1 text-[9px]">RUT:</span> <span className="font-mono">{evento.pasajero.rut}</span></p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <span className="font-medium text-muted-foreground">N/A</span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground uppercase mt-0.5" title="Empresa">
                                                {evento.empresa?.nombre || "N/A"}
                                            </span>
                                            {evento.convenio?.nombre && (
                                                <span className="text-[9px] text-primary/70 font-medium italic truncate max-w-[150px]" title={`Convenio: ${evento.convenio.nombre}`}>
                                                    {evento.convenio.nombre}
                                                </span>
                                            )}
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
                                                evento.status?.toLowerCase() === "revisar" ? "N/A" :
                                                    evento.estado || evento.status || "N/A"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {evento.convenio_id ? (
                                            <Badge 
                                                variant={evento.invitado ? "outline" : "secondary"}
                                                className={`text-[10px] px-2 py-0.5 ${
                                                    evento.invitado 
                                                        ? 'border-amber-400 text-amber-700 bg-amber-50' 
                                                        : 'border-green-400 text-green-700 bg-green-50'
                                                }`}
                                            >
                                                {evento.invitado ? (
                                                    <><Icon.UserPlus className="h-3 w-3 mr-1" />Invitado</>
                                                ) : (
                                                    <><Icon.UserCheck className="h-3 w-3 mr-1" />Beneficiario</>
                                                )}
                                            </Badge>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">—</span>
                                        )}
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