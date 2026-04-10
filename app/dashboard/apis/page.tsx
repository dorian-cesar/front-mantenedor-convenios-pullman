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
import AddApiModal from "@/components/modals/add-api"
import UpdateApiModal from "@/components/modals/update-api"
import DetailsApiModal from "@/components/modals/details-api"
import { ApisService, type Api, type GetApisParams } from "@/services/api.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"

export default function ApisPage() {
    const [searchValue, setSearchValue] = useState("")
    const [apis, setApis] = useState<Api[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedApi, setSelectedApi] = useState<Api | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("")
    const [empresas, setEmpresas] = useState<Empresa[]>([])

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

    const fetchApis = async () => {
        setIsLoading(true)
        try {
            const params: GetApisParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (statusFilter) {
                params.status = statusFilter as any
            }

            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim()
            }

            const response = await ApisService.getApis(params)
            setApis(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching apis:', error)
            toast.error("No se pudieron cargar las APIs")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchApis()
    }, [pagination.page, pagination.limit, debouncedSearch, statusFilter])

    useEffect(() => {
        EmpresasService.getEmpresas({ page: 1, limit: 200, status: "ACTIVO" })
            .then(r => setEmpresas(r.rows))
            .catch(() => console.error("Error cargando empresas"))
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
            await ApisService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "API desactivada correctamente"
                    : "API activada correctamente"
            )

            fetchApis()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleApiAdded = () => {
        fetchApis()
        setOpenAdd(false)
    }

    const handleEditApi = (api: Api) => {
        setSelectedApi(api)
        setOpenUpdate(true)
    }

    const handleApiUpdated = () => {
        fetchApis()
    }

    const handleDetailsApi = (api: Api) => {
        setSelectedApi(api)
        setOpenDetails(true)
    }

    const handleRefresh = () => {
        fetchApis()
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetApisParams = {
                sortBy: "id",
                order: "DESC",
            }

            const response = await ApisService.getApis(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(api => ({
                ID: api.id,
                Nombre: api.nombre,
                Endpoint: api.endpoint,
                Estado: api.status,
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "apis.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "apis.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting apis:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    const actionButtons = [
        {
            label: "Nueva API",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    // Client-side filtering for immediate feedback
    const filteredApis = apis.filter(api => {
        if (!searchValue.trim()) return true;
        const searchTerms = normalizeString(searchValue).split(/\s+/).filter(Boolean);

        return searchTerms.every(term => {
            const idString = api.id ? api.id.toString() : "";
            const nombre = api.nombre ? normalizeString(api.nombre) : "";
            const endpoint = api.endpoint ? normalizeString(api.endpoint) : "";

            return (
                idString.includes(term) ||
                nombre.includes(term) ||
                endpoint.includes(term)
            );
        });
    });

    const filters = (
        <div className="flex flex-wrap gap-2 items-center">
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


            {statusFilter && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setStatusFilter("");
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
                title="APIs"
                description="Gestión de APIs de consulta externas"
                actionButtons={actionButtons}
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
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Endpoint</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>

                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : filteredApis.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={5} className="text-center py-8">
                                    No se encontraron APIs
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredApis.map((api) => (
                                <Table.TableRow key={api.id}>
                                    <Table.TableCell>{api.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium text-sm">{api.nombre}</Table.TableCell>
                                    <Table.TableCell className="text-sm">
                                        <span className={api.empresa ? "" : "text-muted-foreground italic text-xs"}>
                                            {api.empresa?.nombre || "General (N/A)"}
                                        </span>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                            {api.endpoint}
                                        </span>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {api.empresa?.nombre
                                                ?? (api.empresa_id ? empresas.find(e => e.id === api.empresa_id)?.nombre : null)
                                                ?? <span className="italic text-muted-foreground/60">Sin empresa</span>}
                                        </span>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus
                                            status={api.status === "ACTIVO" ? "active" : "inactive"}
                                        >
                                            {api.status === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-right">
                                        <Dropdown.DropdownMenu>
                                            <Dropdown.DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <Icon.MoreHorizontalIcon />
                                                </Button>
                                            </Dropdown.DropdownMenuTrigger>

                                            <Dropdown.DropdownMenuContent align="end">
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleDetailsApi(api)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>

                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleEditApi(api)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>

                                                <Dropdown.DropdownMenuSeparator />

                                                {api.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(api.id, api.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(api.id, api.status)}
                                                    >
                                                        <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                                        Activar
                                                    </Dropdown.DropdownMenuItem>
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

            <AddApiModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleApiAdded}
            />

            <UpdateApiModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                api={selectedApi}
                onSuccess={handleApiUpdated}
            />

            <DetailsApiModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                api={selectedApi}
                empresas={empresas}
            />
        </div>
    )
}