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
import ExportModal from "@/components/modals/export"
import AddPasajeroModal from "@/components/modals/add-pasajero"
// import UpdatePasajeroModal from "@/components/modals/update-pasajero"
// import DetailsPasajeroModal from "@/components/modals/details-pasajero"
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
    const [selectedPasajero, setSelectedPasajero] = useState<Pasajero | null>(null)
    const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
    const [selectedConvenio, setSelectedConvenio] = useState<number | null>(null)
    const [selectedTipoPasajero, setSelectedTipoPasajero] = useState<number | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("")
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
    const normalizeString = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const fetchPasajeros = async () => {
        setIsLoading(true)
        try {
            const params: GetPasajerosParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            const searchTerm = debouncedSearch.trim()
            if (searchTerm) {
                params.search = searchTerm
            }

            if (selectedEmpresa) {
                params.empresa_id = selectedEmpresa
            }

            if (selectedConvenio) {
                params.convenio_id = selectedConvenio
            }

            if (selectedTipoPasajero) {
                params.tipo_pasajero_id = selectedTipoPasajero
            }

            const response = await PasajerosService.getPasajeros(params)
            setPasajeros(response.rows)

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
        fetchEmpresas()
        fetchConvenios()
        fetchTiposPasajero()
    }, [pagination.page, pagination.limit, debouncedSearch, selectedEmpresa, selectedConvenio, selectedTipoPasajero, statusFilter])

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

            const params: GetPasajerosParams = {
                sortBy: "id",
                order: "DESC",
            }

            const searchTerm = debouncedSearch.trim()
            if (searchTerm) {
                params.search = searchTerm
            }

            if (selectedEmpresa) {
                params.empresa_id = selectedEmpresa
            }

            if (selectedConvenio) {
                params.convenio_id = selectedConvenio
            }

            if (selectedTipoPasajero) {
                params.tipo_pasajero_id = selectedTipoPasajero
            }

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
                Empresa_ID: pasajero.empresa_id || "Sin empresa",
                Convenio_ID: pasajero.convenio_id || "Sin convenio",
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

    // Función para obtener nombre de tipo de pasajero
    const getTipoPasajeroNombre = (tipoId: number | null): string => {
        if (!tipoId) return "Sin tipo"
        const tipo = tiposPasajero.find(t => t.id === tipoId)
        return tipo?.nombre || `Tipo #${tipoId}`
    }

    const actionButtons = [
        {
            label: "Nuevo Pasajero",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
        // {
        //     label: "Asociar Pasajero",
        //     onClick: () => setOpenAsociar(true),
        //     variant: "outline" as const,
        //     icon: <Icon.LinkIcon className="h-4 w-4" />
        // }
    ]

    // Client-side filtering for immediate feedback
    const filteredPasajeros = pasajeros.filter(pasajero => {
        if (!searchValue.trim()) return true;

        const cleanRut = (r: string) => r?.replace(/[^0-9kK]/g, "").toLowerCase() || "";
        const searchTerms = normalizeString(searchValue).split(/\s+/).filter(Boolean);

        const idString = pasajero.id ? pasajero.id.toString() : "";
        const nombres = pasajero.nombres ? normalizeString(pasajero.nombres) : "";
        const apellidos = pasajero.apellidos ? normalizeString(pasajero.apellidos) : "";
        const rutClean = cleanRut(pasajero.rut || "");
        const correo = pasajero.correo ? normalizeString(pasajero.correo) : "";

        return searchTerms.every(term => {
            const termClean = cleanRut(term);
            return (
                idString.includes(term) ||
                nombres.includes(term) ||
                apellidos.includes(term) ||
                (termClean !== "" && rutClean.includes(termClean)) ||
                correo.includes(term)
            );
        });
    });

    const filters = (
        <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Empresa:</span>
                <Dropdown.DropdownMenu>
                    <Dropdown.DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between text-left">
                            <span className="truncate">
                                {selectedEmpresa ? empresas.find(e => e.id === selectedEmpresa)?.nombre || "Seleccionar..." : "Todas"}
                            </span>
                            <Icon.ChevronDown className="ml-2 h-4 w-4 shrink-0" />
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

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Convenio:</span>
                <Dropdown.DropdownMenu>
                    <Dropdown.DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between text-left">
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
                        <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-between">
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

            {(statusFilter || selectedEmpresa || selectedConvenio) && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setStatusFilter("");
                        setSelectedEmpresa(null);
                        setSelectedConvenio(null);
                    }}
                    className="h-9"
                >
                    <Icon.X className="mr-2 h-4 w-4" />
                    Limpiar
                </Button>
            )}
        </div>
    )

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Pasajeros"
                description="Listado de los pasajeros disponibles"
                actionButtons={user?.rol === "SUPER_USUARIO" ? actionButtons : undefined}
                actionMenu={{
                    title: "Detalles",
                    items: [
                        {
                            label: "Exportar",
                            onClick: () => setOpenExport(true),
                            icon: <Icon.DownloadIcon className="h-4 w-4" />
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
                        ) : filteredPasajeros.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={8} className="text-center py-8">
                                    No se encontraron pasajeros
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredPasajeros.map((pasajero) => (
                                <Table.TableRow key={pasajero.id}>
                                    <Table.TableCell>{pasajero.id}</Table.TableCell>
                                    <Table.TableCell>{formatRut(pasajero.rut)}</Table.TableCell>
                                    <Table.TableCell>
                                        <div className="font-medium">
                                            {pasajero.nombres || "Sin nombre"} {pasajero.apellidos || ""}
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {pasajero.correo || "Sin correo"}
                                    </Table.TableCell>
                                    {/* <Table.TableCell>{getTipoPasajeroNombre(pasajero.tipo_pasajero_id)}</Table.TableCell> */}
                                    <Table.TableCell>{getEmpresaNombre(pasajero.empresa_id)}</Table.TableCell>
                                    <Table.TableCell>{getConvenioNombre(pasajero.convenio_id)}</Table.TableCell>
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
                empresas={empresas}
                convenios={convenios}
                tiposPasajero={tiposPasajero}
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
                empresas={empresas}
                convenios={convenios}
                tiposPasajero={tiposPasajero}
            />

            <DetailsPasajeroModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                pasajero={selectedPasajero}
            /> */}
        </div>
    )
}