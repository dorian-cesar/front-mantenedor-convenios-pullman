"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import ExportModal from "@/components/modals/export"
import AddPasajeroModal from "@/components/modals/add-pasajero"
import UpdatePasajeroModal from "@/components/modals/update-pasajero"
import DetailsPasajeroModal from "@/components/modals/details-pasajero"
// import AsociarPasajeroModal from "@/components/modals/asociar-pasajero"
import { PasajerosService, type Pasajero, type GetPasajerosParams } from "@/services/pasajero.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { TipoPasajeroService } from "@/services/tipo-pasajero.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import { formatRut, formatDate, formatDateOnly } from "@/utils/helpers"
import { useAuth } from "@/hooks/useAuth"

export default function PasajerosPage() {
    const [searchValue, setSearchValue] = useState("")
    const [pasajeros, setPasajeros] = useState<Pasajero[]>([])
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [tiposPasajero, setTiposPasajero] = useState<{ id: number, nombre: string }[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openAsociar, setOpenAsociar] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [summary, setSummary] = useState({ activos: 0, inactivos: 0, total: 0 })
    const [selectedPasajero, setSelectedPasajero] = useState<Pasajero | null>(null)
    const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
    const [selectedConvenio, setSelectedConvenio] = useState<number | null>(null)
    const [selectedTipoPasajero, setSelectedTipoPasajero] = useState<number | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("")
    const [rutFilter, setRutFilter] = useState("")
    const [correoFilter, setCorreoFilter] = useState("")
    const [nombreFilter, setNombreFilter] = useState("")
    const [idFilter, setIdFilter] = useState("")
    const { user } = useAuth()

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 300)
    const debouncedRut = useDebounce(rutFilter, 300)
    const debouncedCorreo = useDebounce(correoFilter, 300)
    const debouncedNombre = useDebounce(nombreFilter, 300)
    const debouncedId = useDebounce(idFilter, 300)


    const fetchPasajeros = async () => {
        setIsLoading(true)
        try {
            const params: any = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
            if (debouncedRut.trim()) params.rut = debouncedRut.trim()
            if (debouncedCorreo.trim()) params.correo = debouncedCorreo.trim()
            if (debouncedNombre.trim()) params.nombre = debouncedNombre.trim()
            if (debouncedId.trim()) params.id = debouncedId.trim()
            if (statusFilter) params.status = statusFilter

            if (selectedEmpresa) {
                params.empresa_id = selectedEmpresa
            } else {
                const isUserRole = user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user";
                const effectiveEmpresaId = user?.empresa_id || user?.empresaId || user?.id_empresa || user?.empresa?.id;
                if (isUserRole && effectiveEmpresaId) params.empresa_id = effectiveEmpresaId;
            }

            if (selectedConvenio) params.convenio_id = selectedConvenio
            if (selectedTipoPasajero) params.tipo_pasajero_id = selectedTipoPasajero

            const response = await PasajerosService.getPasajeros(params)
            setPasajeros(response.rows)

            if (response.summary) {
                setSummary(response.summary)
            }

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching pasajeros:', error)
            toast.error("No se pudieron cargar los pasajeros")
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

    const fetchTiposPasajero = async () => {
        try {
            const tipos = TipoPasajeroService.getTiposPasajeroStatic();
            setTiposPasajero(tipos);
        } catch {
        }
    }

    useEffect(() => {
        fetchPasajeros()
    }, [
        pagination.page, 
        pagination.limit, 
        debouncedSearch, 
        debouncedRut, 
        debouncedCorreo, 
        debouncedNombre, 
        debouncedId,
        selectedEmpresa, 
        selectedConvenio, 
        selectedTipoPasajero, 
        statusFilter
    ])

    useEffect(() => {
        fetchEmpresas()
        fetchConvenios()
        fetchTiposPasajero()
    }, [])

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


    const handleToggleStatus = async (
        id: number,
        currentStatus: "ACTIVO" | "INACTIVO"
    ) => {
        try {
            await PasajerosService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Pasajero desactivado correctamente"
                    : "Pasajero activado correctamente"
            )

            fetchPasajeros()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handlePasajeroAdded = () => {
        fetchPasajeros()
        setOpenAdd(false)
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado al portapapeles`)
    }

    const handlePasajeroAsociado = () => {
        fetchPasajeros()
        setOpenAsociar(false)
    }

    const handleEditPasajero = (pasajero: Pasajero) => {
        setSelectedPasajero(pasajero)
        setOpenUpdate(true)
    }

    const handlePasajeroUpdated = () => {
        fetchPasajeros()
    }

    const handleDetailsPasajero = (pasajero: Pasajero) => {
        setSelectedPasajero(pasajero)
        setOpenDetails(true)
    }

    const handleRefresh = () => {
        fetchPasajeros()
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: any = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
            if (debouncedRut.trim()) params.rut = debouncedRut.trim()
            if (debouncedCorreo.trim()) params.correo = debouncedCorreo.trim()
            if (debouncedNombre.trim()) params.nombre = debouncedNombre.trim()
            if (selectedEmpresa) params.empresa_id = selectedEmpresa
            if (selectedConvenio) params.convenio_id = selectedConvenio
            if (selectedTipoPasajero) params.tipo_pasajero_id = selectedTipoPasajero
            if (statusFilter) params.status = statusFilter

            const response = await PasajerosService.getPasajeros(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(pasajero => ({
                ID: pasajero.id,
                RUT: formatRut(pasajero.rut),
                Nombres: pasajero.nombres || "Sin nombre",
                Apellidos: pasajero.apellidos || "Sin apellido",
                Fecha_Nacimiento: pasajero.fecha_nacimiento ? formatDate(pasajero.fecha_nacimiento) : "Sin fecha",
                Correo: pasajero.correo || "Sin correo",
                Teléfono: pasajero.telefono || "Sin teléfono",
                Tipo_Pasajero: tiposPasajero.find(t => t.id === pasajero.tipo_pasajero_id)?.nombre || "Sin tipo",
                Empresa: pasajero.empresa?.nombre || "Sin empresa",
                Convenio: pasajero.convenio?.nombre || "Sin convenio",
                Estado: pasajero.status,
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "pasajeros.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "pasajeros.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting pasajeros:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    // Función para obtener nombre de empresa
    const getEmpresaNombre = (empresaId: number | null): string => {
        if (!empresaId) return "Sin empresa"
        const empresa = empresas.find(e => e.id === empresaId)
        return empresa?.nombre || `Empresa #${empresaId}`
    }

    // Función para obtener nombre de convenio
    const getConvenioNombre = (convenioId: number | null): string => {
        if (!convenioId) return "Sin convenio"
        const convenio = convenios.find(c => c.id === convenioId)
        return convenio?.nombre || `Convenio #${convenioId}`
    }

    const actionButtons = [
        {
            label: "Nuevo Pasajero",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        }
    ]



    const filters = (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">RUT:</span>
                    <Input
                        placeholder="Filtrar por RUT..."
                        value={rutFilter}
                        onChange={(e) => setRutFilter(e.target.value)}
                        className="h-9 w-[150px] shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Nombre:</span>
                    <Input
                        placeholder="Buscar por nombre..."
                        value={nombreFilter}
                        onChange={(e) => setNombreFilter(e.target.value)}
                        className="h-9 w-[180px] shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Correo:</span>
                    <Input
                        placeholder="Buscar por correo..."
                        value={correoFilter}
                        onChange={(e) => setCorreoFilter(e.target.value)}
                        className="h-9 w-[180px] shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">ID:</span>
                    <Input
                        placeholder="ID..."
                        value={idFilter}
                        onChange={(e) => setIdFilter(e.target.value)}
                        className="h-9 w-[80px] shadow-sm"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                    {(user?.rol?.toUpperCase() === "SUPER_USUARIO" || user?.rol?.toUpperCase() === "SISTEMA") && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Empresa:</span>
                            <Dropdown.DropdownMenu>
                                <Dropdown.DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between text-left shadow-sm">
                                        <span className="truncate">
                                            {selectedEmpresa ? empresas.find(e => e.id === selectedEmpresa)?.nombre || "Seleccionar..." : "Todas"}
                                        </span>
                                        <Icon.ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </Dropdown.DropdownMenuTrigger>
                                <Dropdown.DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                                    <Dropdown.DropdownMenuItem onClick={() => setSelectedEmpresa(null)}>
                                        Todas
                                    </Dropdown.DropdownMenuItem>
                                    {empresas.map((empresa) => (
                                        <Dropdown.DropdownMenuItem key={empresa.id} onClick={() => setSelectedEmpresa(empresa.id)}>
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
                            <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between text-left shadow-sm">
                                <span className="truncate">
                                    {selectedConvenio ? convenios.find(c => c.id === selectedConvenio)?.nombre || "Seleccionar..." : "Todos"}
                                </span>
                                <Icon.ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                            </Button>
                        </Dropdown.DropdownMenuTrigger>
                        <Dropdown.DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                            <Dropdown.DropdownMenuItem onClick={() => setSelectedConvenio(null)}>
                                Todos
                            </Dropdown.DropdownMenuItem>
                            {convenios.map((convenio) => (
                                <Dropdown.DropdownMenuItem key={convenio.id} onClick={() => setSelectedConvenio(convenio.id)}>
                                    {convenio.nombre}
                                </Dropdown.DropdownMenuItem>
                            ))}
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Dropdown.DropdownMenu>
                        <Dropdown.DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-between shadow-sm">
                                {statusFilter === "ACTIVO" ? "Activo" : statusFilter === "INACTIVO" ? "Inactivo" : "Todos"}
                                <Icon.ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </Dropdown.DropdownMenuTrigger>
                        <Dropdown.DropdownMenuContent align="start">
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("")}>
                                Todos
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("ACTIVO")}>
                                Activo
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("INACTIVO")}>
                                Inactivo
                            </Dropdown.DropdownMenuItem>
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>

                {(statusFilter || selectedEmpresa || selectedConvenio || rutFilter || nombreFilter || correoFilter || idFilter || searchValue) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setStatusFilter("");
                            setSelectedEmpresa(null);
                            setSelectedConvenio(null);
                            setRutFilter("");
                            setNombreFilter("");
                            setCorreoFilter("");
                            setIdFilter("");
                            setSearchValue("");
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
        <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-2">
                <hr className="border-t border-muted" />
                <PageHeader
                    title="Consulta Pasajeros"
                    description="Gestión y búsqueda avanzada de pasajeros del sistema."
                    actionButtons={user?.rol === "SUPER_USUARIO" ? actionButtons : undefined}
                    actionMenu={{
                        title: "Acciones",
                        items: [
                            {
                                label: "Exportar CSV",
                                onClick: () => handleExport("csv"),
                                icon: <Icon.DownloadIcon className="h-4 w-4" />
                            },
                            {
                                label: "Exportar Excel",
                                onClick: () => handleExport("excel"),
                                icon: <Icon.FileTextIcon className="h-4 w-4" />
                            }
                        ]
                    }}
                    showSearch={true}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    onSearchClear={() => setSearchValue("")}
                    filters={filters}
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
                    showRefreshButton={true}
                    onRefresh={handleRefresh}
                />
                <hr className="border-t border-muted" />
            </div>

            {/* Dashboard de Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card.Card 
                    className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-primary ${statusFilter === "" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setStatusFilter("")}
                >
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-bold uppercase text-muted-foreground">Total Pasajeros</Card.CardTitle>
                        <Icon.Users className="h-4 w-4 text-muted-foreground" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold">{summary.total}</div>
                        <p className="text-xs text-muted-foreground">Universo total de pasajeros</p>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card 
                    className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-emerald-500 ${statusFilter === "ACTIVO" ? "ring-2 ring-emerald-500" : ""}`}
                    onClick={() => setStatusFilter("ACTIVO")}
                >
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-bold uppercase text-emerald-600">Pasajeros Activos</Card.CardTitle>
                        <Icon.UserCheck className="h-4 w-4 text-emerald-500" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{summary.activos}</div>
                        <p className="text-xs text-muted-foreground">Habilitados para viajar</p>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card 
                    className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-amber-500 ${statusFilter === "INACTIVO" ? "ring-2 ring-amber-500" : ""}`}
                    onClick={() => setStatusFilter("INACTIVO")}
                >
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-bold uppercase text-amber-600">Pasajeros Inactivos</Card.CardTitle>
                        <Icon.UserX className="h-4 w-4 text-amber-500" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold text-amber-600">{summary.inactivos}</div>
                        <p className="text-xs text-muted-foreground">Cuentas desactivadas</p>
                    </Card.CardContent>
                </Card.Card>
            </div>

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>RUT</Table.TableHead>
                            <Table.TableHead>Nombre Completo</Table.TableHead>
                            <Table.TableHead>Correo</Table.TableHead>
                            {/* <Table.TableHead>Tipo Pasajero</Table.TableHead> */}
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            {(user?.rol === "SUPER_USUARIO" || user?.rol === "SISTEMA") && <Table.TableHead className="text-right">Acciones</Table.TableHead>}
                        </Table.TableRow>
                    </Table.TableHeader>

                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={9} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : pasajeros.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={8} className="text-center py-8">
                                    No se encontraron pasajeros
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            pasajeros.map((pasajero) => (
                                <Table.TableRow key={pasajero.id}>
                                    <Table.TableCell>
                                        <div className="flex items-center gap-2 group">
                                            <span>{pasajero.id}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => copyToClipboard(pasajero.id.toString(), "ID")}
                                            >
                                                <Icon.Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <div className="flex items-center gap-2 group">
                                            <span className="font-mono text-xs">{formatRut(pasajero.rut)}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => copyToClipboard(pasajero.rut, "RUT")}
                                            >
                                                <Icon.Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <div className="flex items-center gap-2 group">
                                            <div className="font-medium truncate max-w-[200px]">
                                                {pasajero.nombres || "Sin nombre"} {pasajero.apellidos || ""}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => copyToClipboard(`${pasajero.nombres || ""} ${pasajero.apellidos || ""}`.trim(), "Nombre")}
                                            >
                                                <Icon.Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <div className="flex items-center gap-2 group">
                                            <span className="truncate max-w-[150px]">{pasajero.correo || "Sin correo"}</span>
                                            {pasajero.correo && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => copyToClipboard(pasajero.correo!, "Correo")}
                                                >
                                                    <Icon.Copy className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <span className="text-xs">
                                            {pasajero.empresa?.nombre || getEmpresaNombre(pasajero.empresa_id)}
                                        </span>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <span className="text-xs">
                                            {pasajero.convenio?.nombre || getConvenioNombre(pasajero.convenio_id)}
                                        </span>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={pasajero.status === "ACTIVO" ? "active" : "inactive"}>
                                            {pasajero.status === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    {(user?.rol === "SUPER_USUARIO" || user?.rol === "SISTEMA") && (
                                        <Table.TableCell className="text-right">
                                            <Dropdown.DropdownMenu>
                                                <Dropdown.DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <Icon.MoreHorizontalIcon />
                                                    </Button>
                                                </Dropdown.DropdownMenuTrigger>
                                                <Dropdown.DropdownMenuContent align="end">
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleDetailsPasajero(pasajero)}
                                                    >
                                                        <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                        Ver detalles
                                                    </Dropdown.DropdownMenuItem>

                                                    {user?.rol !== "SISTEMA" && (
                                                        <>
                                                            <Dropdown.DropdownMenuItem
                                                                onClick={() => handleEditPasajero(pasajero)}
                                                            >
                                                                <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                                Editar
                                                            </Dropdown.DropdownMenuItem>
                                                            <Dropdown.DropdownMenuSeparator />
                                                            {pasajero.status === "ACTIVO" ? (
                                                                <Dropdown.DropdownMenuItem
                                                                    variant="destructive"
                                                                    onClick={() => handleToggleStatus(pasajero.id, pasajero.status)}
                                                                >
                                                                    <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                                    Desactivar
                                                                </Dropdown.DropdownMenuItem>
                                                            ) : (
                                                                <Dropdown.DropdownMenuItem
                                                                    onClick={() => handleToggleStatus(pasajero.id, pasajero.status)}
                                                                >
                                                                    <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                                                    Activar
                                                                </Dropdown.DropdownMenuItem>
                                                            )}
                                                        </>
                                                    )}
                                                </Dropdown.DropdownMenuContent>
                                            </Dropdown.DropdownMenu>
                                        </Table.TableCell>
                                    )}
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

            <AddPasajeroModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handlePasajeroAdded}
            />

            {/* <AsociarPasajeroModal
                open={openAsociar}
                onOpenChange={setOpenAsociar}
                onSuccess={handlePasajeroAsociado}
                empresas={empresas}
                convenios={convenios}
            />

            <UpdatePasajeroModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                pasajero={selectedPasajero}
                onSuccess={handlePasajeroUpdated}
            />

            <DetailsPasajeroModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                pasajero={selectedPasajero}
                onToggleStatus={handleToggleStatus}
            /> */}
        </div>
    )
}