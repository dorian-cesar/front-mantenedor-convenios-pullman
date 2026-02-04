// app/dashboard/descuentos/page.tsx
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
// import AddDescuentoModal from "@/components/modals/add-descuento"
// import UpdateDescuentoModal from "@/components/modals/update-descuento"
// import DetailsDescuentoModal from "@/components/modals/details-descuento"
import { DescuentosService, type Descuento, type GetDescuentosParams } from "@/services/descuento.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
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
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedDescuento, setSelectedDescuento] = useState<Descuento | null>(null)
    const [selectedConvenio, setSelectedConvenio] = useState<number | null>(null)
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
                page: 1,
                limit: 100,
                status: "ACTIVO"
            })
            setConvenios(response.rows)
        } catch (error) {
            console.error('Error fetching convenios:', error)
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
        fetchEmpresas()
    }, [pagination.page, pagination.limit, debouncedSearch, selectedConvenio])

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
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

            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim()
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
                Pasajero: `${desc.pasajero.nombres} ${desc.pasajero.apellidos}`,
                RUT: formatRut(desc.pasajero.rut),
                Convenio_ID: desc.convenio_id,
                Código_Descuento: desc.codigo_descuento.codigo,
                Tipo_Pasajero: desc.tipo_pasajero.nombre,
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

    // Función para obtener nombre de empresa basado en convenio_id
    const getEmpresaNombre = (convenioId: number): string => {
        const convenio = convenios.find(c => c.id === convenioId)
        if (convenio && convenio.empresa) {
            return convenio.empresa.nombre
        }
        return "Sin empresa"
    }

    const actionButtons = [
        {
            label: "Nuevo Descuento",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

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
                    />
                }
                showRefreshButton={true}
                onRefresh={handleRefresh}
                filters={
                    <div className="flex items-center space-x-2">
                        <select
                            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={selectedConvenio || ""}
                            onChange={(e) => setSelectedConvenio(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">Todos los convenios</option>
                            {convenios.map((convenio) => (
                                <option key={convenio.id} value={convenio.id}>
                                    {convenio.nombre} {convenio.empresa ? `(${convenio.empresa.nombre})` : ''}
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
                            <Table.TableHead>Pasajero</Table.TableHead>
                            <Table.TableHead>RUT</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Código Descuento</Table.TableHead>
                            <Table.TableHead>Tipo Pasajero</Table.TableHead>
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
                        ) : descuentos.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={10} className="text-center py-8">
                                    No se encontraron descuentos
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            descuentos.map((descuento) => (
                                <Table.TableRow key={descuento.id}>
                                    <Table.TableCell>{descuento.id}</Table.TableCell>

                                    <Table.TableCell className="font-medium">
                                        {descuento?.pasajero?.nombres ?? "sin nombre"} {descuento?.pasajero?.apellidos ?? ""}
                                    </Table.TableCell>

                                    <Table.TableCell>{
                                        descuento?.pasajero?.rut ?
                                            formatRut(descuento?.pasajero?.rut)
                                            : "sin rut"}
                                    </Table.TableCell>

                                    <Table.TableCell>
                                        {
                                            descuento.convenio_id ?
                                                `Convenio #${descuento.convenio_id}` : "sin convenio"
                                        }
                                    </Table.TableCell>

                                    <Table.TableCell>
                                        {getEmpresaNombre(descuento.convenio_id)}
                                    </Table.TableCell>

                                    <Table.TableCell>
                                        <span className="font-mono text-sm">
                                            {descuento?.codigo_descuento?.codigo ?? "sin código"}
                                        </span>
                                    </Table.TableCell>

                                    <Table.TableCell>
                                        {descuento?.tipo_pasajero?.nombre ?? "sin tipo"}
                                    </Table.TableCell>

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

            {/* <AddDescuentoModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleDescuentoAdded}
                convenios={convenios}
            />

            <UpdateDescuentoModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                descuento={selectedDescuento}
                onSuccess={handleDescuentoUpdated}
                convenios={convenios}
            />

            <DetailsDescuentoModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                descuento={selectedDescuento}
            /> */}
        </div>
    )
}