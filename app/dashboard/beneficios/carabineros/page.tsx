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
import AddCarabineroModal from "@/components/modals/add-carabinero"
import UpdateCarabineroModal from "@/components/modals/update-carabinero"

import { CarabinerosService, type Carabinero, GetCarabinerosParams } from "@/services/carabineros.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { formatRut } from "@/utils/helpers"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"

export default function CarabinerosPage() {
    const [searchValue, setSearchValue] = useState("")
    const [carabineros, setCarabineros] = useState<Carabinero[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedCarabinero, setSelectedCarabinero] = useState<Carabinero | null>(null)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchCarabineros = async () => {
        setIsLoading(true)
        try {
            const params: GetCarabinerosParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (debouncedSearch.trim()) {
                params.nombre_completo = debouncedSearch.trim()
                params.rut = debouncedSearch.trim()
            }

            const response = await CarabinerosService.getCarabineros(params)

            setCarabineros(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching carabineros:', error)
            toast.error("No se pudieron cargar los carabineros")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCarabineros()
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
        rut: string,
        currentStatus: "ACTIVO" | "INACTIVO"
    ) => {
        try {
            await CarabinerosService.toggleStatus(rut, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Adulto Mayor desactivado correctamente"
                    : "Adulto Mayor activado correctamente"
            )

            fetchCarabineros()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleCarabineroAdded = () => {
        fetchCarabineros()
        setOpenAdd(false)
    }

    const handleEditCarabinero = (carabinero: Carabinero) => {
        setSelectedCarabinero(carabinero)
        setOpenUpdate(true)
    }

    const handleCarabineroUpdated = () => {
        fetchCarabineros()
    }

    const handleDetailsCarabinero = (carabinero: Carabinero) => {
        setSelectedCarabinero(carabinero)
        setOpenDetails(true)
    }

    const handleRefresh = () => {
        fetchCarabineros();
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetCarabinerosParams = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) {
                params.nombre_completo = debouncedSearch.trim()
                params.rut = debouncedSearch.trim()
            }

            const response = await CarabinerosService.getCarabineros(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(ca => ({
                Nombre: ca.nombre_completo,
                RUT: formatRut(ca.rut),
                Estado: ca.status,
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "carabineros.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "carabineros.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }
        } catch (error) {
            console.error('Error exporting carabineros:', error)
            toast.error("No se pudo exportar los carabineros")
        }
    }

    const actionButtons = [
        {
            label: "Nuevo Carabinero",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Carabineros"
                description="Listado de carabineros registrados."
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
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>RUT</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={4} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : carabineros.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={4} className="text-center py-8">
                                    No se encontraron carabineros
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            carabineros.map((carabinero, index) => (
                                <Table.TableRow key={`${carabinero.rut}-${index}`}>
                                    <Table.TableCell className="font-medium">{carabinero.nombre_completo}</Table.TableCell>
                                    <Table.TableCell>{carabinero.rut}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={carabinero.status === "ACTIVO" ? "active" : "inactive"}>
                                            {carabinero.status === "ACTIVO" ? "Activo" : "Inactivo"}
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
                                                {/* <Dropdown.DropdownMenuItem
                                                    onClick={() => handleDetailsCarabinero(carabinero)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem> */}
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleEditCarabinero(carabinero)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuSeparator />
                                                {carabinero.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(carabinero.rut, carabinero.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(carabinero.rut, carabinero.status)}
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

            <AddCarabineroModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleCarabineroAdded}
            />

            <UpdateCarabineroModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                carabinero={selectedCarabinero}
                onSuccess={handleCarabineroUpdated}
            />
        </div>
    )
}