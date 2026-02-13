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
import AddEstudianteModal from "@/components/modals/add-estudiante"
import UpdateEstudianteModal from "@/components/modals/update-estudiante"
import DetailsEstudianteModal from "@/components/modals/details-estudiante"
import { EstudiantesService, type Estudiante, type GetEstudiantesParams } from "@/services/estudiante.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { formatRut } from "@/utils/helpers"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"


export default function EstudiantesPage() {
    const [searchValue, setSearchValue] = useState("")
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchEstudiantes = async () => {
        setIsLoading(true)
        try {
            const params: GetEstudiantesParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (debouncedSearch.trim()) {
                params.nombre = debouncedSearch.trim()
            }

            const response = await EstudiantesService.getEstudiantes(params)

            setEstudiantes(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching estudiantes:', error)
            toast.error("No se pudieron cargar los estudiantes")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEstudiantes()
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
            await EstudiantesService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Estudiante desactivado correctamente"
                    : "Estudiante activado correctamente"
            )

            fetchEstudiantes()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleEstudianteAdded = () => {
        fetchEstudiantes()
        setOpenAdd(false)
    }

    const handleEditEstudiante = (estudiante: Estudiante) => {
        setSelectedEstudiante(estudiante)
        setOpenUpdate(true)
    }

    const handleEstudianteUpdated = () => {
        fetchEstudiantes()
    }

    const handleDetailsEstudiante = (estudiante: Estudiante) => {
        setSelectedEstudiante(estudiante)
        setOpenDetails(true)
    }

    const handleRefresh = () => {
        fetchEstudiantes();
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetEstudiantesParams = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) {
                params.nombre = debouncedSearch.trim()
            }

            const response = await EstudiantesService.getEstudiantes(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(est => ({
                ID: est.id,
                Nombre: est.nombre,
                RUT: formatRut(est.rut),
                Teléfono: est.telefono,
                Correo: est.correo,
                "Carnet Estudiante": est.carnet_estudiante,
                Estado: est.status,
                Creado: new Date(est.createdAt || "").toLocaleDateString(),
                Actualizado: new Date(est.updatedAt || "").toLocaleDateString(),
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "estudiantes.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "estudiantes.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting estudiantes:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    const actionButtons = [
        {
            label: "Nuevo Estudiante",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Estudiantes"
                description="Listado de estudiantes registrados."
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
                            <Table.TableHead>Carnet</Table.TableHead>
                            <Table.TableHead>Fecha Vencimiento</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : estudiantes.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={7} className="text-center py-8">
                                    No se encontraron estudiantes
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            estudiantes.map((estudiante) => (
                                <Table.TableRow key={estudiante.id}>
                                    <Table.TableCell>{estudiante.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{estudiante.nombre}</Table.TableCell>
                                    <Table.TableCell>{formatRut(estudiante.rut)}</Table.TableCell>
                                    <Table.TableCell>{estudiante.correo}</Table.TableCell>
                                    <Table.TableCell>{estudiante.telefono}</Table.TableCell>
                                    <Table.TableCell>{estudiante.carnet_estudiante}</Table.TableCell>
                                    <Table.TableCell>{estudiante.fecha_vencimiento}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={estudiante.status === "ACTIVO" ? "active" : "inactive"}>
                                            {estudiante.status === "ACTIVO" ? "Activo" : "Inactivo"}
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
                                                    onClick={() => handleDetailsEstudiante(estudiante)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleEditEstudiante(estudiante)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuSeparator />
                                                {estudiante.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(estudiante.id, estudiante.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(estudiante.id, estudiante.status)}
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

            <AddEstudianteModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleEstudianteAdded}
            />

            <UpdateEstudianteModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                estudiante={selectedEstudiante}
                onSuccess={handleEstudianteUpdated}
            />

            <DetailsEstudianteModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                estudiante={selectedEstudiante}
            />

        </div>
    )
}
