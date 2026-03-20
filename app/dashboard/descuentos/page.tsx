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
import AddDescuentoModal from "@/components/modals/add-descuento"
import UpdateDescuentoModal from "@/components/modals/update-descuento"
import DetailsDescuentoModal from "@/components/modals/details-descuento"
import { DescuentosService, type Descuento, type GetDescuentosParams } from "@/services/descuento.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { CodigosDescuentoService, type CodigoDescuento } from "@/services/codigo-descuento.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import { formatRut } from "@/utils/helpers"

export default function DescuentosPage() {
    const [searchValue, setSearchValue] = useState("")
    const [descuentos, setDescuentos] = useState<Descuento[]>([])
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [codigos, setCodigos] = useState<CodigoDescuento[]>([])
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedDescuento, setSelectedDescuento] = useState<Descuento | null>(null)
    const [selectedConvenio, setSelectedConvenio] = useState<number | null>(null)
    const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("")

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchDescuentos = async () => {
        setIsLoading(true)
        try {
            const params: GetDescuentosParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (debouncedSearch.trim()) {
                // Buscar por RUT o nombre de pasajero
                params.search = debouncedSearch.trim()
            }

            if (selectedConvenio) {
                params.convenio_id = selectedConvenio
            }

            if (statusFilter) {
                params.status = statusFilter as any
            }

            const response = await DescuentosService.getDescuentos(params)
            setDescuentos(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching descuentos:', error)
            toast.error("No se pudieron cargar los descuentos")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchConvenios = async () => {
        try {
            const response = await ConveniosService.getConvenios({
                status: "ACTIVO"
            })
            setConvenios(response.rows)
        } catch (error) {
            console.error('Error fetching convenios:', error)
        }
    }

    const fetchCodigos = async () => {
        try {
            const response = await CodigosDescuentoService.getCodigosDescuento({
                status: "ACTIVO"
            })
            setCodigos(response.rows)
        } catch (error) {
            console.error('Error fetching codigos:', error)
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
        fetchDescuentos()
        fetchConvenios()
        fetchCodigos()
        fetchEmpresas()
    }, [pagination.page, pagination.limit, debouncedSearch, selectedConvenio, statusFilter])

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
            await DescuentosService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Descuento desactivado correctamente"
                    : "Descuento activado correctamente"
            )

            fetchDescuentos()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleDescuentoAdded = () => {
        fetchDescuentos()
        setOpenAdd(false)
    }

    const handleEditDescuento = (descuento: Descuento) => {
        setSelectedDescuento(descuento)
        setOpenUpdate(true)
    }

    const handleDescuentoUpdated = () => {
        fetchDescuentos()
    }

    const handleDetailsDescuento = (descuento: Descuento) => {
        setSelectedDescuento(descuento)
        setOpenDetails(true)
    }

    const handleRefresh = () => {
        fetchDescuentos()
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetDescuentosParams = {
                sortBy: "id",
                order: "DESC",
            }


            if (selectedConvenio) {
                params.convenio_id = selectedConvenio
            }

            const response = await DescuentosService.getDescuentos(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(desc => ({
                ID: desc.id,
                Convenio_ID: desc.convenio_id ?? "Sin convenio",
                Código_Descuento: desc.codigo_descuento?.codigo ?? "Sin código",
                // Tipo_Pasajero: desc.tipo_pasajero.nombre,
                Porcentaje_Descuento: `${desc.porcentaje_descuento}%`,
                Estado: desc.status,
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "descuentos.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "descuentos.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting descuentos:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    const actionButtons = [
        {
            label: "Nuevo Descuento",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    const filteredDescuentos = descuentos.filter(descuento => {
        if (!searchValue.trim()) return true;
        const searchLower = searchValue.toLowerCase();
        const idString = descuento.id ? descuento.id.toString() : "";
        return (
            idString.includes(searchLower) ||
            (descuento.codigo_descuento?.codigo && descuento.codigo_descuento.codigo.toLowerCase().includes(searchLower)) ||
            (descuento.pasajero?.nombres && descuento.pasajero.nombres.toLowerCase().includes(searchLower)) ||
            (descuento.pasajero?.rut && descuento.pasajero.rut.toLowerCase().includes(searchLower))
        );
    });

    const filters = (
        <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Convenio:</span>
                <Dropdown.DropdownMenu>
                    <Dropdown.DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 min-w-[150px] justify-between text-left">
                            <span className="truncate">
                                {selectedConvenio ? convenios.find(c => c.id === selectedConvenio)?.nombre || "Seleccionar..." : "Todos"}
                            </span>
                            <Icon.ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                        </Button>
                    </Dropdown.DropdownMenuTrigger>
                    <Dropdown.DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                        <Dropdown.DropdownMenuItem onClick={() => setSelectedConvenio(null)}>
                            Todos
                        </Dropdown.DropdownMenuItem>
                        {convenios.map((convenio) => (
                            <Dropdown.DropdownMenuItem key={convenio.id} onClick={() => setSelectedConvenio(convenio.id)}>
                                {convenio.nombre} {convenio.empresa ? `(${convenio.empresa.nombre})` : ''}
                            </Dropdown.DropdownMenuItem>
                        ))}
                    </Dropdown.DropdownMenuContent>
                </Dropdown.DropdownMenu>
            </div>

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

            {(statusFilter || selectedConvenio) && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setStatusFilter("");
                        setSelectedConvenio(null);
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
                title="Descuentos"
                description="Descuentos aplicados."
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
                filters={filters}
            />

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
                            <Table.TableHead>Código Descuento</Table.TableHead>
                            {/* <Table.TableHead>Tipo Pasajero</Table.TableHead> */}
                            <Table.TableHead>Descuento</Table.TableHead>
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
                        ) : filteredDescuentos.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={10} className="text-center py-8">
                                    No se encontraron descuentos
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredDescuentos.map((descuento) => (
                                <Table.TableRow key={descuento.id}>
                                    <Table.TableCell>{descuento.id}</Table.TableCell>

                                    <Table.TableCell>
                                        {
                                            descuento.convenio_id ?
                                                `Convenio #${descuento.convenio_id}` : "sin convenio"
                                        }
                                    </Table.TableCell>

                                    <Table.TableCell>
                                        <span className="font-mono text-sm">
                                            {descuento?.codigo_descuento?.codigo ?? "sin código"}
                                        </span>
                                    </Table.TableCell>

                                    {/* <Table.TableCell>
                                        {descuento?.tipo_pasajero?.nombre ?? "sin tipo"}
                                    </Table.TableCell> */}

                                    <Table.TableCell>
                                        {descuento.porcentaje_descuento}%
                                    </Table.TableCell>

                                    <Table.TableCell>
                                        <BadgeStatus
                                            status={descuento.status === "ACTIVO" ? "active" : "inactive"}
                                        >
                                            {descuento.status === "ACTIVO" ? "Activo" : "Inactivo"}
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
                                                    onClick={() => handleDetailsDescuento(descuento)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>

                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleEditDescuento(descuento)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>

                                                <Dropdown.DropdownMenuSeparator />

                                                {descuento.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(descuento.id, descuento.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(descuento.id, descuento.status)}
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

            <AddDescuentoModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleDescuentoAdded}
                convenios={convenios}
                codigos={codigos}
            />

            <UpdateDescuentoModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                descuento={selectedDescuento}
                onSuccess={handleDescuentoUpdated}
            // convenios={convenios}
            // codigos={codigos}
            />

            <DetailsDescuentoModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                descuento={selectedDescuento}
            />
        </div>
    )
}