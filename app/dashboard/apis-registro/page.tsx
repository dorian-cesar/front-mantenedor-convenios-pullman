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
import AddApiRegistroModal from "@/components/modals/add-api-registro"
import UpdateApiRegistroModal from "@/components/modals/update-api-registro"
import DetailsApiRegistroModal from "@/components/modals/details-api-registro"
import { ApisRegistroService, type ApiRegistro, type GetApisRegistroParams } from "@/services/api-registro.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"

export default function ApisRegistroPage() {
    const [searchValue, setSearchValue] = useState("")
    const [apisRegistro, setApisRegistro] = useState<ApiRegistro[]>([])
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedApi, setSelectedApi] = useState<ApiRegistro | null>(null)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchApisRegistro = async () => {
        setIsLoading(true)
        try {
            const params: GetApisRegistroParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: "id",
                order: "DESC",
            }
            if (debouncedSearch.trim()) params.nombre = debouncedSearch.trim()

            const response = await ApisRegistroService.getApisRegistro(params)
            setApisRegistro(response.rows)
            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1),
            }))
        } catch {
            toast.error("No se pudieron cargar las APIs de Registro")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchEmpresas = async () => {
        try {
            const response = await EmpresasService.getEmpresas({ status: "ACTIVO" })
            setEmpresas(response.rows)
        } catch {
            console.error("Error fetching empresas")
        }
    }

    useEffect(() => {
        fetchApisRegistro()
    }, [pagination.page, pagination.limit, debouncedSearch])

    useEffect(() => {
        fetchEmpresas()
    }, [])

    const handleToggleStatus = async (id: number, currentStatus: "ACTIVO" | "INACTIVO") => {
        try {
            await ApisRegistroService.toggleStatus(id, currentStatus)
            toast.success(currentStatus === "ACTIVO" ? "API desactivada correctamente" : "API activada correctamente")
            fetchApisRegistro()
        } catch {
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await ApisRegistroService.deleteApiRegistro(id)
            toast.success("API de Registro eliminada correctamente")
            fetchApisRegistro()
        } catch {
            toast.error("No se pudo eliminar la API de Registro")
        }
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })
            const response = await ApisRegistroService.getApisRegistro({ sortBy: "id", order: "DESC" })
            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }
            const formattedData = response.rows.map(api => ({
                ID: api.id,
                Nombre: api.nombre,
                Endpoint: api.endpoint,
                Empresa: api.empresa?.nombre || "Sin empresa",
                Estado: api.status,
            }))
            if (type === "csv") { exportToCSV(formattedData, "apis-registro.csv"); toast.success("CSV exportado", { id: "export" }) }
            if (type === "excel") { exportToExcel(formattedData, "apis-registro.xlsx"); toast.success("Excel exportado", { id: "export" }) }
        } catch {
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="APIs de Registro"
                description="Gestión de APIs externas para registro de beneficiarios"
                actionButtons={[{ label: "Nueva API de Registro", onClick: () => setOpenAdd(true), icon: <Icon.PlusIcon className="h-4 w-4" /> }]}
                actionMenu={{ title: "Detalles", items: [{ label: "Exportar", onClick: () => setOpenExport(true), icon: <Icon.DownloadIcon className="h-4 w-4" /> }] }}
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
                        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                        hasPrevPage={pagination.hasPrevPage}
                        hasNextPage={pagination.hasNextPage}
                        className="w-full"
                        limit={pagination.limit}
                        onLimitChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))}
                    />
                }
                showRefreshButton={true}
                onRefresh={fetchApisRegistro}
            />

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>Endpoint</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex justify-center"><Icon.Loader2Icon className="h-6 w-6 animate-spin" /></div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : apisRegistro.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={6} className="text-center py-8">No se encontraron APIs de Registro</Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            apisRegistro.map((api) => (
                                <Table.TableRow key={api.id}>
                                    <Table.TableCell>{api.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{api.nombre}</Table.TableCell>
                                    <Table.TableCell><span className="font-mono text-sm">{api.endpoint}</span></Table.TableCell>
                                    <Table.TableCell>{api.empresa?.nombre || "Sin empresa"}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={api.status === "ACTIVO" ? "active" : "inactive"}>
                                            {api.status === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-right">
                                        <Dropdown.DropdownMenu>
                                            <Dropdown.DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8"><Icon.MoreHorizontalIcon /></Button>
                                            </Dropdown.DropdownMenuTrigger>
                                            <Dropdown.DropdownMenuContent align="end">
                                                <Dropdown.DropdownMenuItem onClick={() => { setSelectedApi(api); setOpenDetails(true) }}>
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />Ver detalles
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuItem onClick={() => { setSelectedApi(api); setOpenUpdate(true) }}>
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />Editar
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuSeparator />
                                                {api.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem variant="destructive" onClick={() => handleToggleStatus(api.id, api.status)}>
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <>
                                                        <Dropdown.DropdownMenuItem onClick={() => handleToggleStatus(api.id, api.status)}>
                                                            <Icon.CheckIcon className="h-4 w-4 mr-2" />Activar
                                                        </Dropdown.DropdownMenuItem>
                                                        <Dropdown.DropdownMenuItem variant="destructive" onClick={() => handleDelete(api.id)}>
                                                            <Icon.Trash2 className="h-4 w-4 mr-2" />Eliminar
                                                        </Dropdown.DropdownMenuItem>
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

            <ExportModal open={openExport} onOpenChange={setOpenExport} onExport={handleExport} />
            <AddApiRegistroModal open={openAdd} onOpenChange={setOpenAdd} onSuccess={() => { fetchApisRegistro(); setOpenAdd(false) }} empresas={empresas} />
            <UpdateApiRegistroModal open={openUpdate} onOpenChange={setOpenUpdate} apiRegistro={selectedApi} onSuccess={fetchApisRegistro} empresas={empresas} />
            <DetailsApiRegistroModal open={openDetails} onOpenChange={setOpenDetails} apiRegistro={selectedApi} />
        </div>
    )
}
