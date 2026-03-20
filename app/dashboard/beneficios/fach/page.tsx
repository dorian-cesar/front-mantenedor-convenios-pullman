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
import AddFachModal from "@/components/modals/add-fach"
import UpdateFachModal from "@/components/modals/update-fach"
import DetailsFachModal from "@/components/modals/details-fach"

import { FachService, type Fach, type GetFachParams } from "@/services/fach.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { formatRut } from "@/utils/helpers"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import { useAuth } from "@/hooks/useAuth"
import { useConvenios } from "@/hooks/use-convenios"

export default function FachPage() {
    const [searchValue, setSearchValue] = useState("")
    const [fachList, setFachList] = useState<Fach[]>([])
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedFach, setSelectedFach] = useState<Fach | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("")
    const { convenioMap } = useConvenios()
    const { user } = useAuth()

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchEmpresas = async () => {
        try {
            const response = await EmpresasService.getEmpresas({ limit: 100 })
            setEmpresas(response.rows)
        } catch (error) {
            console.error('Error fetching empresas:', error)
        }
    }

    const fetchFach = async () => {
        setIsLoading(true)
        try {
            const params: GetFachParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (statusFilter) {
                params.status = statusFilter as any
            }

            if (debouncedSearch.trim()) {
                const isNumericOrRut = /^[0-9kK.-]+$/.test(debouncedSearch.trim())
                if (isNumericOrRut) {
                    params.rut = debouncedSearch.trim()
                } else {
                    params.search = debouncedSearch.trim()
                }
            }

            const response = await FachService.getFach(params)

            setFachList(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching fach:', error)
            toast.error("No se pudieron cargar los registros")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmpresas()
    }, [])

    useEffect(() => {
        fetchFach()
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
            await FachService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Registro desactivado correctamente"
                    : "Registro activado correctamente"
            )

            fetchFach()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleFachAdded = () => {
        fetchFach()
        setOpenAdd(false)
    }

    const handleEditFach = async (fach: Fach) => {
        try {
            const fullData = await FachService.getFachById(fach.id)
            setSelectedFach(fullData)
            setOpenUpdate(true)
        } catch (error) {
            console.error('Error fetching fach for edit:', error)
            toast.error("No se pudo cargar el registro para editar")
        }
    }

    const handleFachUpdated = () => {
        fetchFach()
    }

    const handleDetailsFach = async (fach: Fach) => {
        try {
            const fullData = await FachService.getFachById(fach.id)
            setSelectedFach(fullData)
            setOpenDetails(true)
        } catch (error) {
            console.error('Error fetching fach details:', error)
            toast.error("No se pudieron cargar los detalles del registro")
        }
    }

    const handleRefresh = () => {
        fetchFach();
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetFachParams = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim()
            }

            const response = await FachService.getFach(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(fach => ({
                Nombre: fach.nombre_completo,
                Empresa: fach.empresa.nombre,
                Estado: fach.status,
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "fach.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "fach.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }
        } catch (error) {
            console.error('Error exporting fach:', error)
            toast.error("No se pudo exportar los registros")
        }
    }

    const actionButtons = user?.rol === "SISTEMA" ? [] : [
        {
            label: "Nuevo Fach",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    // Client-side filtering for immediate feedback
    const filteredFach = fachList.filter(f => {
        if (!searchValue.trim()) return true;
        const searchLower = searchValue.toLowerCase();
        const convenioName = f.convenio?.nombre?.toLowerCase() || "";
        const passengerRut = f.rut?.toLowerCase() || "";
        const idString = f.id ? f.id.toString() : "";
        
        return (
            idString.includes(searchLower) ||
            (f.nombre_completo && f.nombre_completo.toLowerCase().includes(searchLower)) ||
            (f.rut && f.rut.toLowerCase().includes(searchLower)) ||
            convenioName.includes(searchLower)
        );
    });

    const filters = (
        <div className="flex flex-wrap gap-2 items-center">

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Dropdown.DropdownMenu>
                    <Dropdown.DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-between">
                            {statusFilter === "ACTIVO" ? "Activo" : statusFilter === "INACTIVO" ? "Inactivo" : statusFilter === "RECHAZADO" ? "Rechazado" : "Todos"}
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
                        <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("RECHAZADO")}>
                            Rechazado
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
                title="Fach"
                description="Listado de personal Fach beneficiarios del sistema."
                actionButtons={actionButtons}
                actionMenu={{
                    title: "Opciones",
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
                            <Table.TableHead>Estado</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
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
                        ) : filteredFach.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={5} className="text-center py-8">
                                    No se encontraron beneficios FACH
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredFach.map((fach, index) => (
                                <Table.TableRow key={`${fach.id}-${index}`}>
                                    <Table.TableCell className="font-medium">{fach.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{fach.nombre_completo}</Table.TableCell>
                                    <Table.TableCell>{fach.empresa.nombre}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={fach.status === "ACTIVO" ? "active" : "inactive"}>
                                            {fach.status === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell>{fach.convenio?.nombre || "-"}</Table.TableCell>
                                    <Table.TableCell className="text-right">
                                        <Dropdown.DropdownMenu>
                                            <Dropdown.DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <Icon.MoreHorizontalIcon />
                                                </Button>
                                            </Dropdown.DropdownMenuTrigger>
                                            <Dropdown.DropdownMenuContent align="end">
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleDetailsFach(fach)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>

                                                {user?.rol !== "SISTEMA" && (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleEditFach(fach)}
                                                    >
                                                        <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </Dropdown.DropdownMenuItem>
                                                )}
                                                 {user?.rol !== "SISTEMA" && (
                                                     <>
                                                         {fach.status === "ACTIVO" ? (
                                                             <Dropdown.DropdownMenuItem
                                                                 variant="destructive"
                                                                 onClick={() => handleToggleStatus(fach.id, fach.status)}
                                                             >
                                                                 <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                                 Desactivar
                                                             </Dropdown.DropdownMenuItem>
                                                         ) : (
                                                             <Dropdown.DropdownMenuItem
                                                                 onClick={() => handleToggleStatus(fach.id, fach.status)}
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

            <AddFachModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleFachAdded}
                empresas={empresas}
            />

            <UpdateFachModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                fach={selectedFach}
                onSuccess={handleFachUpdated}
                empresas={empresas}
            />

            <DetailsFachModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                fach={selectedFach}
            />
        </div>
    )
}