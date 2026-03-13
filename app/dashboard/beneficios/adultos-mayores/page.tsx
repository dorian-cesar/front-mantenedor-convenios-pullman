"use client"

import { Button } from "@/components/ui/button"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState } from "react"
import useSWR from "swr"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import ExportModal from "@/components/modals/export"
import AddAdultoMayorModal from "@/components/modals/add-adulto-mayor"
import UpdateAdultoMayorModal from "@/components/modals/update-adulto-mayor"
import DetailsAdultoMayorModal from "@/components/modals/details-adulto-mayor"
import { AdultosMayoresService, type AdultoMayor, type GetAdultosMayoresParams } from "@/services/adulto-mayor.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { formatRut } from "@/utils/helpers"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import RechazarModal from "@/components/modals/rechazar"
import { useConvenios } from "@/hooks/use-convenios"


export default function AdultosMayoresPage() {
    const [searchValue, setSearchValue] = useState("")
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedAdultoMayor, setSelectedAdultoMayor] = useState<AdultoMayor | null>(null)
    const [openRechazar, setOpenRechazar] = useState(false)

    const { convenioMap } = useConvenios()

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetcher = async () => {
        const params: GetAdultosMayoresParams = {
            page: pagination.page,
            limit: pagination.limit,
        }

        if (debouncedSearch.trim()) {
            params.nombre = debouncedSearch.trim()
            params.rut = debouncedSearch.trim()
        }

        return AdultosMayoresService.getAdultosMayores(params)
    }

    const { data: response, error, isLoading, mutate } = useSWR(
        ['beneficiarios', 'adultos-mayores', pagination.page, pagination.limit, debouncedSearch],
        fetcher,
        { keepPreviousData: true }
    )

    const adultosMayores: AdultoMayor[] = (response?.rows || (response as any)?.data || (Array.isArray(response) ? response : [])) ?? [];
    
    const totalItems = Number(response?.totalItems ?? (response as any)?.total ?? adultosMayores.length);
    const totalPages = response?.totalPages ? Number(response.totalPages) : Math.ceil(totalItems / pagination.limit) || 1;
    const currentPage = Number(response?.currentPage ?? pagination.page);
    const hasPrevPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;

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
        currentStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO"
    ) => {
        try {
            await AdultosMayoresService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Adulto Mayor desactivado correctamente"
                    : "Adulto Mayor activado correctamente"
            )

            mutate()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleAdultoMayorAdded = () => {
        mutate()
        setOpenAdd(false)
    }

    const handleEditAdultoMayor = async (adultoMayor: AdultoMayor) => {
        try {
            const usuario = await AdultosMayoresService.getAdultoMayorById(adultoMayor.id)
            setSelectedAdultoMayor(usuario)
            setOpenUpdate(true)
        } catch (error) {
            console.error('Error fetching adulto mayor details:', error)
            toast.error("No se pudieron cargar los detalles del adulto mayor")
        }
    }

    const handleAdultoMayorUpdated = () => {
        mutate()
    }

    const handleDetailsAdultoMayor = async (adultoMayor: AdultoMayor) => {
        try {
            const usuario = await AdultosMayoresService.getAdultoMayorById(adultoMayor.id)
            setSelectedAdultoMayor(usuario)
            setOpenDetails(true)
        } catch (error) {
            console.error('Error fetching adulto mayor details:', error)
            toast.error("No se pudieron cargar los detalles del adulto mayor")
        }
    }

    const handleAdultoMayorRechazado = async (id: number, razon_rechazo: string) => {
        try {
            await AdultosMayoresService.rechazarAdultoMayor(id, { razon_rechazo, status: "RECHAZADO" })
            toast.success("Se rechazó la solicitud correctamente")
            mutate()
        } catch (error) {
            console.error('Error rechazando adulto mayor:', error)
            toast.error("No se pudo rechazar la solicitud")
        }
    }

    const handleRechazar = async (adultoMayor: AdultoMayor) => {
        setSelectedAdultoMayor(adultoMayor)
        setOpenRechazar(true)
    }

    const handleRefresh = () => {
        mutate();
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetAdultosMayoresParams = {
            }

            if (debouncedSearch.trim()) {
                params.nombre = debouncedSearch.trim()
                params.rut = debouncedSearch.trim()
            }

            const response = await AdultosMayoresService.getAdultosMayores(params)
            
            const rows = response.rows || (response as any).data || (Array.isArray(response) ? response : []);

            if (!rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = rows.map(am => ({
                ID: am.id,
                Nombre: am.nombre,
                RUT: formatRut(am.rut),
                Teléfono: am.telefono,
                Correo: am.correo,
                Estado: am.status,
                Creado: new Date(am.createdAt || "").toLocaleDateString(),
                Actualizado: new Date(am.updatedAt || "").toLocaleDateString(),
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "adultos_mayores.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "adultos_mayores.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting adultos mayores:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    const actionButtons = [
        {
            label: "Nuevo Adulto Mayor",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Adultos Mayores"
                description="Listado de adultos mayores registrados."
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
                        totalPages={totalPages}
                        totalItems={totalItems}
                        onPageChange={handlePageChange}
                        hasPrevPage={hasPrevPage}
                        hasNextPage={hasNextPage}
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
                            <Table.TableHead>Convenio</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
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
                        ) : adultosMayores?.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={7} className="text-center py-8">
                                    No se encontraron adultos mayores
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            adultosMayores.map((adultoMayor) => (
                                <Table.TableRow key={adultoMayor.id}>
                                    <Table.TableCell>{adultoMayor.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{adultoMayor.nombre}</Table.TableCell>
                                    <Table.TableCell>{formatRut(adultoMayor.rut)}</Table.TableCell>
                                    <Table.TableCell>{adultoMayor.correo}</Table.TableCell>
                                    <Table.TableCell>{adultoMayor.telefono}</Table.TableCell>
                                    <Table.TableCell>
                                        {adultoMayor.convenio?.nombre || (adultoMayor.convenio_id ? convenioMap[adultoMayor.convenio_id] : null) || "Sin convenio"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={adultoMayor.status === "ACTIVO" ? "active" : "inactive"}>
                                            {adultoMayor.status === "ACTIVO" ? "Activo" : adultoMayor.status === "INACTIVO" ? "Inactivo" : "Rechazado"}
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
                                                    onClick={() => handleDetailsAdultoMayor(adultoMayor)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleEditAdultoMayor(adultoMayor)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>
                                                {adultoMayor.status === "ACTIVO" ? (
                                                    <>
                                                        <Dropdown.DropdownMenuSeparator />
                                                        <Dropdown.DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() => handleToggleStatus(adultoMayor.id, adultoMayor.status)}
                                                        >
                                                            <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                            Desactivar
                                                        </Dropdown.DropdownMenuItem>
                                                    </>
                                                ) : (
                                                    <>
                                                        {adultoMayor.status !== "RECHAZADO" && (
                                                            <>
                                                                <Dropdown.DropdownMenuItem
                                                                    onClick={() => handleToggleStatus(adultoMayor.id, adultoMayor.status)}
                                                                >
                                                                    <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                                                    Activar
                                                                </Dropdown.DropdownMenuItem>
                                                                <Dropdown.DropdownMenuItem
                                                                    variant="destructive"
                                                                    onClick={() => handleRechazar(adultoMayor)}
                                                                >
                                                                    <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                                    Rechazar
                                                                </Dropdown.DropdownMenuItem>
                                                            </>
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

            <AddAdultoMayorModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleAdultoMayorAdded}
            />

            <UpdateAdultoMayorModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                adultoMayor={selectedAdultoMayor}
                onSuccess={handleAdultoMayorUpdated}
            />

            <DetailsAdultoMayorModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                adultoMayor={selectedAdultoMayor}
            />

            <RechazarModal
                open={openRechazar}
                onOpenChange={setOpenRechazar}
                onSubmit={(motivo) => handleAdultoMayorRechazado(selectedAdultoMayor?.id || 0, motivo)}
            />

        </div>
    )
}
