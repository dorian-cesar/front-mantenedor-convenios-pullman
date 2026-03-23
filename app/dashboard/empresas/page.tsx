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
import AddEmpresaModal from "@/components/modals/add-empresa"
import UpdateEmpresaModal from "@/components/modals/update-empresa"
import DetailsEmpresaModal from "@/components/modals/details-empresa"
import { EmpresasService, type Empresa, type GetEmpresasParams } from "@/services/empresa.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { formatRut } from "@/utils/helpers"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"


export default function EmpresasPage() {
    const [searchValue, setSearchValue] = useState("")
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("")

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

    const fetchEmpresas = async () => {
        setIsLoading(true)
        try {
            const params: GetEmpresasParams = {
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

            const response = await EmpresasService.getEmpresas(params)

            setEmpresas(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching empresas:', error)
            toast.error("No se pudieron cargar las empresas")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmpresas()
    }, [pagination.page, pagination.limit, debouncedSearch, statusFilter])

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
            await EmpresasService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Empresa desactivada correctamente"
                    : "Empresa activada correctamente"
            )

            fetchEmpresas()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleEmpresaAdded = () => {
        fetchEmpresas()
        setOpenAdd(false)
    }

    const handleEditEmpresa = (empresa: Empresa) => {
        setSelectedEmpresa(empresa)
        setOpenUpdate(true)
    }

    const handleEmpresaUpdated = () => {
        fetchEmpresas()
    }

    const handleDetailsEmpresa = (empresa: Empresa) => {
        setSelectedEmpresa(empresa)
        setOpenDetails(true)
    }

    const handleRefresh = () => {
        fetchEmpresas();
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetEmpresasParams = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim()
            }

            const response = await EmpresasService.getEmpresas(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(emp => ({
                ID: emp.id,
                Nombre: emp.nombre,
                RUT: formatRut(emp.rut_empresa),
                Estado: emp.status,
                Creado: new Date(emp.createdAt).toLocaleDateString(),
                Actualizado: new Date(emp.updatedAt).toLocaleDateString(),
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "empresas.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "empresas.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting empresas:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    const actionButtons = [
        {
            label: "Nueva Empresa",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]



    // Client-side filtering for immediate feedback
    const filteredEmpresas = empresas.filter(emp => {
        if (!searchValue.trim()) return true;

        const cleanRut = (r: string) => r?.replace(/[^0-9kK]/g, "").toLowerCase() || "";
        const searchTerms = normalizeString(searchValue).split(/\s+/).filter(Boolean);

        const idString = emp.id ? emp.id.toString() : "";
        const nombre = emp.nombre ? normalizeString(emp.nombre) : "";
        const rutClean = cleanRut(emp.rut_empresa || "");

        return searchTerms.every(term => {
            const termClean = cleanRut(term);
            return (
                idString.includes(term) ||
                nombre.includes(term) ||
                (termClean !== "" && rutClean.includes(termClean))
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
                title="Empresas en Convenio"
                description="Listado de todas las empresas que tienen convenios activos."
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
                            <Table.TableHead>RUT</Table.TableHead>
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
                        ) : filteredEmpresas.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={5} className="text-center py-8">
                                    No se encontraron empresas
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredEmpresas.map((empresa) => (
                                <Table.TableRow key={empresa.id}>
                                    <Table.TableCell>{empresa.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{empresa.nombre}</Table.TableCell>
                                    <Table.TableCell>{formatRut(empresa.rut_empresa)}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={empresa.status === "ACTIVO" ? "active" : "inactive"}>
                                            {empresa.status === "ACTIVO" ? "Activa" : "Inactiva"}
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
                                                    onClick={() => handleDetailsEmpresa(empresa)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleEditEmpresa(empresa)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuSeparator />
                                                {empresa.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(empresa.id, empresa.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(empresa.id, empresa.status)}
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

            <AddEmpresaModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleEmpresaAdded}
            />

            <UpdateEmpresaModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                empresa={selectedEmpresa}
                onSuccess={handleEmpresaUpdated}
            />

            <DetailsEmpresaModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                empresa={selectedEmpresa}
            />

        </div>
    )
}
