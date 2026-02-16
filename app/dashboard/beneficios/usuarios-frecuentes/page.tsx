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
import AddUsuarioFrecuenteModal from "@/components/modals/add-usuario-frecuente"
import UpdateUsuarioFrecuenteModal from "@/components/modals/update-usuario-frecuente"
import DetailsUsuarioFrecuenteModal from "@/components/modals/details-usuario-frecuente"
import { UsuariosFrecuentesService, type UsuarioFrecuente, type GetUsuariosFrecuentesParams } from "@/services/usuario-frecuente.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { formatRut } from "@/utils/helpers"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"


export default function UsuariosFrecuentesPage() {
    const [searchValue, setSearchValue] = useState("")
    const [usuariosFrecuentes, setUsuariosFrecuentes] = useState<UsuarioFrecuente[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedUsuarioFrecuente, setSelectedUsuarioFrecuente] = useState<UsuarioFrecuente | null>(null)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchUsuariosFrecuentes = async () => {
        setIsLoading(true)
        try {
            const params: GetUsuariosFrecuentesParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (debouncedSearch.trim()) {
                params.nombre = debouncedSearch.trim()
            }

            const response = await UsuariosFrecuentesService.getUsuariosFrecuentes(params)

            setUsuariosFrecuentes(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching usuarios frecuentes:', error)
            toast.error("No se pudieron cargar los usuarios frecuentes")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsuariosFrecuentes()
    }, [pagination.page, pagination.limit, debouncedSearch])

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
            await UsuariosFrecuentesService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Usuario Frecuente desactivado correctamente"
                    : "Usuario Frecuente activado correctamente"
            )

            fetchUsuariosFrecuentes()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleUsuarioFrecuenteAdded = () => {
        fetchUsuariosFrecuentes()
        setOpenAdd(false)
    }

    const handleEditUsuarioFrecuente = (usuarioFrecuente: UsuarioFrecuente) => {
        setSelectedUsuarioFrecuente(usuarioFrecuente)
        setOpenUpdate(true)
    }

    const handleUsuarioFrecuenteUpdated = () => {
        fetchUsuariosFrecuentes()
    }

    const handleDetailsUsuarioFrecuente = async (usuarioFrecuente: UsuarioFrecuente) => {
        try {
            const usuario = await UsuariosFrecuentesService.getUsuarioFrecuenteById(usuarioFrecuente.id)
            setSelectedUsuarioFrecuente(usuario)
            setOpenDetails(true)
        } catch (error) {
            console.error('Error fetching usuario frecuente details:', error)
            toast.error("No se pudieron cargar los detalles del usuario frecuente")
        }
    }

    const handleRefresh = () => {
        fetchUsuariosFrecuentes();
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetUsuariosFrecuentesParams = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) {
                params.nombre = debouncedSearch.trim()
            }

            const response = await UsuariosFrecuentesService.getUsuariosFrecuentes(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(uf => ({
                ID: uf.id,
                Nombre: uf.nombre,
                RUT: formatRut(uf.rut),
                Teléfono: uf.telefono,
                Correo: uf.correo,
                Estado: uf.status,
                Creado: new Date(uf.createdAt || "").toLocaleDateString(),
                Actualizado: new Date(uf.updatedAt || "").toLocaleDateString(),
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "usuarios_frecuentes.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "usuarios_frecuentes.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting usuarios frecuentes:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    const actionButtons = [
        {
            label: "Nuevo Usuario Frecuente",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Usuarios Frecuentes"
                description="Listado de usuarios frecuentes registrados."
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
                            <Table.TableHead>Correo</Table.TableHead>
                            <Table.TableHead>Teléfono</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={10} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : usuariosFrecuentes.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={10} className="text-center py-8">
                                    No se encontraron usuarios frecuentes
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            usuariosFrecuentes.map((usuarioFrecuente) => (
                                <Table.TableRow key={usuarioFrecuente.id}>
                                    <Table.TableCell>{usuarioFrecuente.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{usuarioFrecuente.nombre}</Table.TableCell>
                                    <Table.TableCell>{formatRut(usuarioFrecuente.rut)}</Table.TableCell>
                                    <Table.TableCell>{usuarioFrecuente.correo}</Table.TableCell>
                                    <Table.TableCell>{usuarioFrecuente.telefono}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={usuarioFrecuente.status === "ACTIVO" ? "active" : "inactive"}>
                                            {usuarioFrecuente.status === "ACTIVO" ? "Activo" : "Inactivo"}
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
                                                    onClick={() => handleDetailsUsuarioFrecuente(usuarioFrecuente)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleEditUsuarioFrecuente(usuarioFrecuente)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuSeparator />
                                                {usuarioFrecuente.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(usuarioFrecuente.id, usuarioFrecuente.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(usuarioFrecuente.id, usuarioFrecuente.status)}
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

            <AddUsuarioFrecuenteModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleUsuarioFrecuenteAdded}
            />

            <UpdateUsuarioFrecuenteModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                usuarioFrecuente={selectedUsuarioFrecuente}
                onSuccess={handleUsuarioFrecuenteUpdated}
            />

            <DetailsUsuarioFrecuenteModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                usuarioFrecuente={selectedUsuarioFrecuente}
            />

        </div>
    )
}
