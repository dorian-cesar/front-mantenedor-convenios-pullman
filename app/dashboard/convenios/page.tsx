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
import AddConvenioModal from "@/components/modals/add-convenio"
import UpdateConvenioModal from "@/components/modals/update-convenio"
import DetailsConvenioModal from "@/components/modals/details-convenio"
import { ConveniosService, type Convenio, type GetConveniosParams } from "@/services/convenio.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import { AuthService, CurrentUser } from "@/services/auth.service"
import { formatDateOnly, formatNumber } from "@/utils/helpers"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import * as Empty from "@/components/ui/empty"

export default function ConveniosPage() {
    const [searchValue, setSearchValue] = useState("")
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null)
    const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
    const [user, setUser] = useState<CurrentUser | null>(null)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchConvenios = async () => {
        setIsLoading(true)
        try {
            const params: GetConveniosParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (debouncedSearch.trim()) {
                params.nombre = debouncedSearch.trim()
            }

            if (selectedEmpresa) {
                params.empresa_id = selectedEmpresa
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
                page: 1,
                limit: 100,
                status: "ACTIVO"
            })
            setEmpresas(response.rows)
        } catch (error) {
            console.error('Error fetching empresas:', error)
        }
    }

    useEffect(() => {
        fetchConvenios()
        fetchEmpresas()
    }, [pagination.page, pagination.limit, debouncedSearch, selectedEmpresa])

    useEffect(() => {
        setUser(AuthService.getCurrentUser())
    }, [])

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
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

    const handleConvenioUpdated = () => {
        fetchConvenios()
    }

    const handleDetailsConvenio = (convenio: Convenio) => {
        setSelectedConvenio(convenio)
        setOpenDetails(true)
    }

    const handleRefresh = () => {
        fetchConvenios()
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetConveniosParams = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) {
                params.nombre = debouncedSearch.trim()
            }

            if (selectedEmpresa) {
                params.empresa_id = selectedEmpresa
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

    const actionButtons = [
        {
            label: "Nuevo Convenio",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Convenios"
                description="Gestione los convenios de las empresas aquí."
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
                showRefreshButton={true}
                onRefresh={handleRefresh}
                filters={
                    <div className="flex items-center space-x-2">
                        <select
                            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={selectedEmpresa || ""}
                            onChange={(e) => setSelectedEmpresa(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">Todas las empresas</option>
                            {empresas.map((empresa) => (
                                <option key={empresa.id} value={empresa.id}>
                                    {empresa.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                }
            />
            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
                            <Table.TableHead>Tipo Consulta</Table.TableHead>
                            <Table.TableHead>Vigencia</Table.TableHead>
                            <Table.TableHead>Monto tope</Table.TableHead>
                            <Table.TableHead>Cantidad Tickets</Table.TableHead>
                            <Table.TableHead>Descuento</Table.TableHead>
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
                        ) : convenios.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={5} className="text-center py-8">
                                    No se encontraron convenios
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            convenios.map((convenio, index) => (
                                <Table.TableRow key={`${convenio.id}-${index}`}>
                                    <Table.TableCell>{convenio.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{convenio.nombre}</Table.TableCell>
                                    <Table.TableCell>
                                        {convenio.empresa?.nombre || "Sin empresa"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={convenio.status === "ACTIVO" ? "active" : "inactive"}>
                                            {convenio.status === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell>{convenio.tipo_consulta ? convenio.tipo_consulta === "API_EXTERNA" ? "API" : "Código" : "Sin consulta"}</Table.TableCell>
                                    <Table.TableCell>
                                        {convenio.fecha_inicio
                                            ? formatDateOnly(convenio.fecha_inicio)
                                            : "Sin inicio"}
                                        {" - "}
                                        {convenio.fecha_termino
                                            ? formatDateOnly(convenio.fecha_termino)
                                            : "Sin fin"}
                                    </Table.TableCell>
                                    <Table.TableCell>{convenio.tope_monto_ventas ? formatNumber(convenio.tope_monto_ventas) : "Sin tope"}</Table.TableCell>
                                    <Table.TableCell>{convenio.tope_cantidad_tickets ? formatNumber(convenio.tope_cantidad_tickets) : "Sin tope"}</Table.TableCell>
                                            <Table.TableCell>{convenio.descuento?.porcentaje ? `${formatNumber(convenio.descuento.porcentaje)}%` : "Sin descuento"}</Table.TableCell>
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
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleEditConvenio(convenio)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuSeparator />
                                                {convenio.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(convenio.id, convenio.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(convenio.id, convenio.status)}
                                                    >
                                                        <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                                        Activar
                                                    </Dropdown.DropdownMenuItem>
                                                )}

                                                {(convenio.status === "INACTIVO" && user?.rol === "SUPER_USUARIO") && (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleDelete(convenio.id, convenio.status)}
                                                    >
                                                        <Icon.Trash2 className="h-4 w-4 mr-2" />
                                                        Eliminar
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

            <AddConvenioModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleConvenioAdded}
                empresas={empresas}
            />

            <UpdateConvenioModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                convenio={selectedConvenio}
                onSuccess={handleConvenioUpdated}
                empresas={empresas}
            />

            <DetailsConvenioModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                convenio={selectedConvenio}
            />

        </div>
    )
}