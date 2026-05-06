"use client"

import { Button } from "@/components/ui/button"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import * as Select from "@/components/ui/select"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import ExportModal from "@/components/modals/export"
import AddConvenioModal from "@/components/modals/add-convenio"
import UpdateConvenioModal from "@/components/modals/update-convenio"
import DetailsConvenioModal from "@/components/modals/details-convenio"
import RutasModal from "@/components/modals/rutas-modal"
import PreciosModal from "@/components/modals/precios-modal"
import { ConveniosService, type Convenio, type GetConveniosParams } from "@/services/convenio.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { ApisService, type Api } from "@/services/api.service"
import { CategoriasService, type Categoria } from "@/services/categoria.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/hooks/useAuth"
import { formatDateOnly, formatNumber } from "@/utils/helpers"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import * as Empty from "@/components/ui/empty"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import { cn } from "@/lib/utils"
import { ConvenioProvider } from "@/components/providers/convenio-provider"

export default function ConveniosPageWrapper() {
    return (
        <ConvenioProvider>
            <ConveniosPage />
        </ConvenioProvider>
    )
}

function ConveniosPage() {
    const [searchValue, setSearchValue] = useState("")
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [apis, setApis] = useState<Api[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [openRutas, setOpenRutas] = useState(false)
    const [openPrecios, setOpenPrecios] = useState(false)
    const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null)
    const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("")
    const { user, initialized: authInitialized } = useAuth()
    const [summary, setSummary] = useState({ activo: 0, inactivo: 0 })

    const isReadOnlyRole = user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user" || user?.rol?.toUpperCase() === "SISTEMA";
    const isScopedRole = user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user";
    const effectiveEmpresaId = user?.empresa_id || user?.empresaId || user?.id_empresa || user?.empresa?.id;

    useEffect(() => {
        if (authInitialized) {
        }
    }, [user, authInitialized]);

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

    const fetchSummary = async () => {
        try {
            const baseParams: GetConveniosParams = {}
            if (selectedEmpresa) baseParams.empresa_id = selectedEmpresa
            // Si es USUARIO (o user), forzar su empresa_id
            if (isScopedRole && effectiveEmpresaId) {
                baseParams.empresa_id = effectiveEmpresaId;
            }

            const [activeRes, inactiveRes] = await Promise.all([
                ConveniosService.getConvenios({ ...baseParams, status: 'ACTIVO', limit: 1 }),
                ConveniosService.getConvenios({ ...baseParams, status: 'INACTIVO', limit: 1 })
            ]);

            setSummary({
                activo: activeRes.totalItems,
                inactivo: inactiveRes.totalItems
            });
        } catch (error) {
            console.error('Error fetching convenios summary:', error)
        }
    }

    const fetchConvenios = async () => {
        // Esperar a que la autenticación esté lista Y enriquecida si es necesario
        const isWaitingForID = (user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user") && 
                               !effectiveEmpresaId;
        
        if (!authInitialized || isWaitingForID) return;
        
        setIsLoading(true)
        try {
            const params: GetConveniosParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            const searchTerm = debouncedSearch.trim()
            if (searchTerm) {
                params.search = searchTerm
            }

            if (statusFilter) {
                params.status = statusFilter as any
            }

            if (selectedEmpresa) {
                params.empresa_id = selectedEmpresa
            } else {
                // Lógica de filtrado combinando React y localStorage
                const reactEmpresaId = user?.empresa_id || user?.empresaId || user?.id_empresa || user?.empresa?.id;
                let manualEmpresaId = null;
                if (typeof window !== 'undefined') {
                    const rawUser = localStorage.getItem('user');
                    if (rawUser) {
                        const parsedUser = JSON.parse(rawUser);
                        manualEmpresaId = parsedUser.empresa_id || parsedUser.empresaId || parsedUser.id_empresa || parsedUser.empresa?.id;
                    }
                }

                const finalId = reactEmpresaId || manualEmpresaId;
                
                if (isScopedRole && finalId) {
                    params.empresa_id = finalId;
                }
            }

            const response = await ConveniosService.getConvenios(params)
            setConvenios(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))

            fetchSummary()
        } catch (error) {
            console.error('Error fetching convenios:', error)
            toast.error("No se pudieron cargar los convenios")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchEmpresas = async () => {
        try {
            const response = await EmpresasService.getEmpresas({
                status: "ACTIVO"
            })
            setEmpresas(response.rows)
        } catch (error) {
            console.error('Error fetching empresas:', error)
        }
    }

    const fetchApis = async () => {
        try {
            const response = await ApisService.getApis({
                status: "ACTIVO"
            })
            setApis(response.rows)
        } catch (error) {
            console.error('Error fetching apis:', error)
        }
    }

    const fetchCategorias = async () => {
        try {
            // Filtrar por empresa si el usuario tiene el rol restringido
            const empresaId = isScopedRole ? effectiveEmpresaId : undefined;
            const data = await CategoriasService.getCategorias(empresaId)
            setCategorias(data)
        } catch (error) {
            console.error('Error fetching categorias:', error)
        }
    }

    useEffect(() => {
        if (!authInitialized) return;
        fetchConvenios()
        fetchEmpresas()
        fetchApis()
        fetchCategorias()
    }, [pagination.page, pagination.limit, debouncedSearch, selectedEmpresa, statusFilter, user, authInitialized])


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
            await ConveniosService.toggleStatus(id, currentStatus)
            toast.success(
                currentStatus === "ACTIVO"
                    ? "Convenio desactivado correctamente"
                    : "Convenio activado correctamente"
            )
            fetchConvenios()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleDelete = async (
        id: number,
        currentStatus: "ACTIVO" | "INACTIVO"
    ) => {
        try {
            if (currentStatus === "ACTIVO") {
                toast.error("No se puede eliminar un convenio activo")
                return;
            };

            await ConveniosService.deleteConvenio(id)
            toast.success("Convenio eliminado correctamente")
            fetchConvenios()
        } catch (error) {
            console.error('Error deleting:', error)
            toast.error("No se pudo eliminar el convenio")
        }
    }

    const handleConvenioAdded = () => {
        fetchConvenios()
        setOpenAdd(false)
    }

    const handleEditConvenio = (convenio: Convenio) => {
        setSelectedConvenio(convenio)
        setOpenUpdate(true)
    }

    const handleManageRutas = (convenio: Convenio) => {
        setSelectedConvenio(convenio)
        setOpenRutas(true)
    }

    const handleManagePrecios = (convenio: Convenio) => {
        setSelectedConvenio(convenio)
        setOpenPrecios(true)
    }

    const handleConvenioUpdated = () => {
        fetchConvenios()
        setOpenUpdate(false)
    }

    const handleDetailsConvenio = (convenio: Convenio) => {
        setSelectedConvenio(convenio)
        setOpenDetails(true)
    }

    const handleRefresh = () => {
        fetchConvenios()
    }

    const handleUpdateCategory = async (convenioId: number, categoryId: number | null) => {
        try {
            await ConveniosService.patchConvenio(convenioId, { categoria_id: categoryId })
            toast.success("Categoría actualizada")
            fetchConvenios()
        } catch (error) {
            console.error('Error updating category:', error)
            toast.error("No se pudo actualizar la categoría")
        }
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetConveniosParams = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim()
            }

            if (selectedEmpresa) {
                params.empresa_id = selectedEmpresa
            }

            if (isScopedRole && effectiveEmpresaId) {
                params.empresa_id = effectiveEmpresaId;
            }

            const response = await ConveniosService.getConvenios(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(conv => ({
                ID: conv.id,
                Nombre: conv.nombre,
                Empresa: conv.empresa?.nombre || "Sin empresa",
                RUT_Empresa: conv.empresa?.rut || "N/A",
                Estado: conv.status,
                Consumo_Tickets: conv.consumo_tickets || 0,
                Consumo_Monto: conv.consumo_monto_descuento || 0,
                Creado: conv.createdAt ? new Date(conv.createdAt).toLocaleDateString() : "N/A",
                Actualizado: conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : "N/A",
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "convenios.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "convenios.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting convenios:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    const filteredConvenios = convenios.filter(conv => {
        if (!searchValue.trim()) return true;

        const cleanRut = (r: string) => r?.replace(/[^0-9kK]/g, "").toLowerCase() || "";
        const searchTerms = normalizeString(searchValue).split(/\s+/).filter(Boolean);

        const idString = conv.id ? conv.id.toString() : "";
        const nombre = conv.nombre ? normalizeString(conv.nombre) : "";
        const empresaNombre = conv.empresa_nombre || conv.empresa?.nombre ? normalizeString(conv.empresa_nombre || conv.empresa?.nombre || "") : "";
        const empresaRutClean = cleanRut(conv.empresa_rut || conv.empresa?.rut || "");

        return searchTerms.every(term => {
            const termClean = cleanRut(term);
            return (
                idString.includes(term) ||
                nombre.includes(term) ||
                empresaNombre.includes(term) ||
                (termClean !== "" && empresaRutClean.includes(termClean))
            );
        });
    });
    const filters = (
        <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-wrap items-center gap-3">
                {user?.rol !== "USUARIO" && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium whitespace-nowrap text-muted-foreground border-r pr-2 mr-1">Empresa:</span>
                        <Dropdown.DropdownMenu>
                            <Dropdown.DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between shadow-sm">
                                    {selectedEmpresa ? empresas.find(e => e.id === selectedEmpresa)?.nombre : "Todas las empresas"}
                                    <Icon.ChevronDown className="ml-2 h-4 w-4" />
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
                    <span className="text-sm font-medium whitespace-nowrap text-muted-foreground border-r pr-2 mr-1">Status:</span>
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

                {(statusFilter || selectedEmpresa) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setStatusFilter("");
                            setSelectedEmpresa(null);
                        }}
                        className="h-9 text-muted-foreground hover:text-foreground"
                    >
                        <Icon.X className="mr-2 h-4 w-4" />
                        Limpiar Filtros
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
                <BadgeStatus
                    status="active"
                    className={`h-9 px-4 text-sm font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-all border shadow-sm ${statusFilter === 'ACTIVO' ? 'ring-2 ring-primary ring-offset-2 border-primary bg-green-100' : 'bg-green-50 text-green-700 border-green-200'}`}
                    onClick={() => setStatusFilter(statusFilter === 'ACTIVO' ? '' : 'ACTIVO')}
                >
                    <Icon.CheckCircle2 className="mr-2 h-4 w-4" />
                    Activos: {summary.activo}
                </BadgeStatus>
                <BadgeStatus
                    status="inactive"
                    className={`h-9 px-4 text-sm font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-all border shadow-sm ${statusFilter === 'INACTIVO' ? 'ring-2 ring-primary ring-offset-2 border-primary bg-red-100' : 'bg-red-50 text-red-700 border-red-200'}`}
                    onClick={() => setStatusFilter(statusFilter === 'INACTIVO' ? '' : 'INACTIVO')}
                >
                    <Icon.XCircle className="mr-2 h-4 w-4" />
                    Inactivos: {summary.inactivo}
                </BadgeStatus>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Convenios"
                description="Gestione los convenios de las empresas aquí."
                actionButtons={isReadOnlyRole ? [] : [
                    {
                        label: "Nuevo Convenio",
                        onClick: () => setOpenAdd(true),
                        icon: <Icon.PlusIcon className="h-4 w-4" />
                    },
                ]}
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
                filters={filters}
            />
            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Categoría</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
                            <Table.TableHead>Tipo Consulta</Table.TableHead>
                            <Table.TableHead>Descuento</Table.TableHead>
                            <Table.TableHead>Alcance</Table.TableHead>
                            <Table.TableHead>Precios/Config</Table.TableHead>
                            <Table.TableHead>Beneficio</Table.TableHead>
                            <Table.TableHead>Tope Monto</Table.TableHead>
                            <Table.TableHead>Tope Tickets</Table.TableHead>
                            <Table.TableHead>Periodo</Table.TableHead>
                            <Table.TableHead className="text-center">Consumo Tickets</Table.TableHead>
                            <Table.TableHead className="text-center">Consumo Monto</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={15} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : filteredConvenios.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={15} className="text-center py-8">
                                    No se encontraron convenios
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredConvenios.map((convenio, index) => (
                                <Table.TableRow key={`${convenio.id}-${index}`}>
                                    <Table.TableCell>{convenio.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{convenio.nombre}</Table.TableCell>
                                    <Table.TableCell>
                                        {convenio.empresa_nombre || convenio.empresa?.nombre || "Sin empresa"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {categorias.filter(cat => cat.empresa_id === convenio.empresa_id).length > 0 ? (
                                            <Select.Select
                                                value={convenio.categoria_id?.toString() || convenio.categoria?.id?.toString() || "none"}
                                                onValueChange={(value) => handleUpdateCategory(convenio.id, value === "none" ? null : Number(value))}
                                            >
                                                <Select.SelectTrigger className="w-[180px] h-8 text-xs">
                                                    <Select.SelectValue placeholder="Sin categoría" />
                                                </Select.SelectTrigger>
                                                <Select.SelectContent>
                                                    <Select.SelectItem value="none">Sin categoría</Select.SelectItem>
                                                    {categorias
                                                        .filter(cat => cat.empresa_id === convenio.empresa_id)
                                                        .map((cat) => (
                                                            <Select.SelectItem key={cat.id} value={cat.id.toString()}>
                                                                {cat.nombre}
                                                            </Select.SelectItem>
                                                        ))}
                                                </Select.SelectContent>
                                            </Select.Select>
                                        ) : (
                                            <span className="text-muted-foreground italic">
                                                {convenio.categoria?.nombre || "-"}
                                            </span>
                                        )}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={convenio.status === "ACTIVO" ? "active" : "inactive"}>
                                            {convenio.status === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {convenio.tipo_consulta ? (
                                            convenio.tipo_consulta === "CODIGO_DESCUENTO" ? (
                                                <>
                                                    <span>Código</span>
                                                    <br />
                                                    <span className="text-sm text-gray-500">{convenio.codigo}</span>
                                                </>
                                            ) : (
                                                "API"
                                            )
                                        ) : (
                                            "Sin consulta"
                                        )}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {convenio.tipo_descuento && convenio.valor_descuento != null
                                            ? `${convenio.tipo_descuento}: ${convenio.tipo_descuento === "Porcentaje" ? `${formatNumber(convenio.valor_descuento)}%` : `$${formatNumber(convenio.valor_descuento)}`}`
                                            : convenio.porcentaje_descuento ? `${formatNumber(convenio.porcentaje_descuento)}%` : "Sin descuento"
                                        }
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-7 px-2 text-xs rounded-full",
                                                convenio.tipo_alcance === "Rutas Especificas"
                                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            )}
                                            onClick={() => handleManageRutas(convenio)}
                                        >
                                            {convenio.tipo_alcance === "Rutas Especificas" ? "Rutas" : "Global"}
                                        </Button>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-7 px-2 text-xs rounded-full",
                                                ((convenio.configuraciones && convenio.configuraciones.length > 0) || 
                                                 (convenio.rutas && convenio.rutas.some((r: any) => r.precio_solo_ida || (r.configuraciones && r.configuraciones.length > 0))))
                                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            )}
                                            onClick={() => handleManagePrecios(convenio)}
                                        >
                                            {((convenio.configuraciones && convenio.configuraciones.length > 0) || 
                                              (convenio.rutas && convenio.rutas.some((r: any) => r.precio_solo_ida || (r.configuraciones && r.configuraciones.length > 0)))) 
                                                ? "Configurado" : "Sin Config"}
                                        </Button>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {convenio.beneficio
                                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Sí</span>
                                            : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">No</span>
                                        }
                                    </Table.TableCell>
                                    <Table.TableCell>{(convenio.limitar_por_monto && convenio.tope_monto_descuento) ? formatNumber(convenio.tope_monto_descuento) : "Sin tope"}</Table.TableCell>
                                    <Table.TableCell>{(convenio.limitar_por_stock && convenio.tope_cantidad_tickets) ? formatNumber(convenio.tope_cantidad_tickets) : "Sin tope"}</Table.TableCell>
                                    <Table.TableCell>{convenio.fecha_inicio ? formatDateOnly(convenio.fecha_inicio) : "Sin inicio"} - {convenio.fecha_termino ? formatDateOnly(convenio.fecha_termino) : "Sin término"}</Table.TableCell>
                                    <Table.TableCell className="font-medium text-center">{formatNumber(convenio.consumo_tickets || 0)}</Table.TableCell>
                                    <Table.TableCell className="font-medium text-blue-600 text-center">${formatNumber(convenio.consumo_monto_descuento || 0)}</Table.TableCell>
                                    <Table.TableCell className="text-right">
                                        <Dropdown.DropdownMenu>
                                            <Dropdown.DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <Icon.MoreHorizontalIcon />
                                                </Button>
                                            </Dropdown.DropdownMenuTrigger>
                                            <Dropdown.DropdownMenuContent align="end">
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleDetailsConvenio(convenio)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>

                                                {!isReadOnlyRole && (
                                                    <>
                                                        <Dropdown.DropdownMenuItem
                                                            onClick={() => handleEditConvenio(convenio)}
                                                        >
                                                            <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </Dropdown.DropdownMenuItem>
                                                        <Dropdown.DropdownMenuSeparator />
                                                        <Dropdown.DropdownMenuItem
                                                            disabled={convenio.status === "ACTIVO"}
                                                            onClick={() => handleToggleStatus(convenio.id, "INACTIVO")}
                                                        >
                                                            <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                                            Activar
                                                        </Dropdown.DropdownMenuItem>
                                                        <Dropdown.DropdownMenuItem
                                                            disabled={convenio.status === "INACTIVO"}
                                                            variant="destructive"
                                                            onClick={() => handleToggleStatus(convenio.id, "ACTIVO")}
                                                        >
                                                            <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                            Desactivar
                                                        </Dropdown.DropdownMenuItem>

                                                        {(convenio.status === "INACTIVO" && user?.rol === "SUPER_USUARIO") && (
                                                            <Dropdown.DropdownMenuItem
                                                                variant="destructive"
                                                                onClick={() => handleDelete(convenio.id, convenio.status)}
                                                            >
                                                                <Icon.Trash2 className="h-4 w-4 mr-2" />
                                                                Eliminar
                                                            </Dropdown.DropdownMenuItem>
                                                        )}
                                                    </>
                                                )}
                                            </Dropdown.DropdownMenuContent>
                                        </Dropdown.DropdownMenu>
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

            <AddConvenioModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleConvenioAdded}
                empresas={empresas}
                apis={apis}
                categorias={categorias}
            />

            <UpdateConvenioModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                convenio={selectedConvenio}
                onSuccess={handleConvenioUpdated}
                empresas={empresas}
                apis={apis}
                categorias={categorias}
            />

            <DetailsConvenioModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                convenio={selectedConvenio}
            />

            {selectedConvenio && (
                <RutasModal
                    open={openRutas}
                    onOpenChange={setOpenRutas}
                    convenio={selectedConvenio}
                    onSuccess={fetchConvenios}
                />
            )}

            {selectedConvenio && (
                <PreciosModal
                    open={openPrecios}
                    onOpenChange={setOpenPrecios}
                    convenio={selectedConvenio}
                    onSuccess={fetchConvenios}
                />
            )}

        </div>
    )
}