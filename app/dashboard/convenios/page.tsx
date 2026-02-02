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
import { formatDateOnly } from "@/utils/helpers"
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
            <div className="flex gap-4">
                <Card.Card className="flex-1">
                    <Table.Table>
                        <Table.TableHeader>
                            <Table.TableRow>
                                <Table.TableHead>ID</Table.TableHead>
                                <Table.TableHead>Nombre</Table.TableHead>
                                <Table.TableHead>Empresa</Table.TableHead>
                                <Table.TableHead>Estado</Table.TableHead>
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
                                convenios.map((convenio) => (
                                    <Table.TableRow key={convenio.id}>
                                        <Table.TableCell>{convenio.id}</Table.TableCell>
                                        <Table.TableCell className="font-medium">{convenio.nombre}</Table.TableCell>
                                        <Table.TableCell>
                                            {convenio.empresa?.nombre || "Sin empresa asignada"}
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <BadgeStatus status={convenio.status === "ACTIVO" ? "active" : "inactive"}>
                                                {convenio.status === "ACTIVO" ? "Activo" : "Inactivo"}
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
                                                </Dropdown.DropdownMenuContent>
                                            </Dropdown.DropdownMenu>
                                        </Table.TableCell>
                                    </Table.TableRow>
                                ))
                            )}
                        </Table.TableBody>
                    </Table.Table>
                </Card.Card>
                <Card.Card className="flex flex-col flex-1">
                    <Card.CardHeader>
                        <Card.CardTitle className="text-xl">Códigos de Descuento {selectedEmpresa !== null && (`${selectedEmpresa}`)}</Card.CardTitle>
                        <Card.CardDescription>Códigos asociados a cada convenio</Card.CardDescription>
                        {selectedEmpresa !== null && (
                            <>
                                <Card.CardAction>
                                    <Button size="sm" onClick={() => console.log("Agregar código de descuento")}>
                                        <Icon.PlusIcon className="h-4 w-4 mr-2" />
                                        Agregar Código
                                    </Button>
                                </Card.CardAction>
                                <div className="flex items-center space-x-2 max-w-md">
                                    <div className="relative flex-1">
                                        <Icon.SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Buscar código..."
                                            value={searchValue}
                                            onChange={(e) => alert(e.target.value)}
                                            className="pl-10 pr-10"
                                        />
                                        {searchValue && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                                                onClick={() => alert("clear")}
                                            >
                                                <Icon.XIcon className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <Button type="submit">Buscar</Button>
                                </div>
                            </>
                        )}
                    </Card.CardHeader>
                    <Card.CardContent className="flex-1 flex items-center justify-center">
                        {selectedEmpresa !== null ? (
                            <div className="h-full w-full">
                                <Card.Card className="mb-3 flex-1">
                                    <Card.CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Card.CardTitle className="text-lg">
                                                    Código: <span className="font-mono">XYZ2025</span>
                                                </Card.CardTitle>
                                                <Card.CardDescription>
                                                    Vigente del 01/01/2025 al 31/03/2025
                                                </Card.CardDescription>
                                            </div>

                                            <BadgeStatus status="active">Activo</BadgeStatus>
                                        </div>
                                    </Card.CardHeader>

                                    <Card.CardContent className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tipo pasajero</span>
                                            <span>Adulto</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <Field className="w-full max-w-sm">
                                                <FieldLabel>
                                                    <span>Uso del código</span>
                                                    <span className="ml-auto">{80}%</span>
                                                </FieldLabel>
                                                <Progress value={80} />
                                            </Field>
                                            <span>{8} / {10}</span>
                                        </div>
                                    </Card.CardContent>

                                    <Card.CardFooter className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline">
                                            <Icon.PencilIcon className="h-4 w-4 mr-1" />
                                            Editar
                                        </Button>

                                        <Button size="sm" variant="destructive">
                                            <Icon.BanIcon className="h-4 w-4 mr-1" />
                                            Desactivar
                                        </Button>
                                    </Card.CardFooter>
                                </Card.Card>
                            </div>

                        ) : (
                            <Empty.Empty>
                                <Empty.EmptyHeader>
                                    <Empty.EmptyMedia variant="icon">
                                        <Icon.Handshake />
                                    </Empty.EmptyMedia>
                                    <Empty.EmptyTitle>Códigos Asociados</Empty.EmptyTitle>
                                    <Empty.EmptyDescription>
                                        Seleccione un convenio para ver sus códigos de descuento
                                    </Empty.EmptyDescription>
                                </Empty.EmptyHeader>
                            </Empty.Empty>
                        )}
                    </Card.CardContent>
                </Card.Card>
            </div>


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