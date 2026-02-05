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
// import AddCodigoDescuentoModal from "@/components/modals/add-codigo-descuento"
// import DetailsCodigoDescuentoModal from "@/components/modals/details-codigo-descuento"
import { CodigosDescuentoService, type CodigoDescuento, type GetCodigosDescuentoParams } from "@/services/codigo-descuento.service"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import { AuthService, CurrentUser } from "@/services/auth.service"
import { formatDate, formatDateOnly, formatNumber } from "@/utils/helpers"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import * as Empty from "@/components/ui/empty"

export default function CodigosDescuentoPage() {
    const [searchValue, setSearchValue] = useState("")
    const [codigos, setCodigos] = useState<CodigoDescuento[]>([])
    const [convenios, setConvenios] = useState<Convenio[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedCodigo, setSelectedCodigo] = useState<CodigoDescuento | null>(null)
    const [selectedConvenio, setSelectedConvenio] = useState<number | null>(null)
    const [selectedStatus, setSelectedStatus] = useState<string>("")
    const [selectedVigencia, setSelectedVigencia] = useState<string>("")
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

    const fetchCodigosDescuento = async () => {
        setIsLoading(true)
        try {
            const params: GetCodigosDescuentoParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (debouncedSearch.trim()) {
                params.codigo = debouncedSearch.trim()
            }

            if (selectedConvenio) {
                params.convenio_id = selectedConvenio
            }

            if (selectedStatus) {
                params.status = selectedStatus as "ACTIVO" | "INACTIVO"
            }

            if (selectedVigencia === "vigentes") {
                params.vigentes = true
            } else if (selectedVigencia === "no-vigentes") {
                params.vigentes = false
            }

            const response = await CodigosDescuentoService.getCodigosDescuento(params)
            setCodigos(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching códigos descuento:', error)
            toast.error("No se pudieron cargar los códigos de descuento")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchConvenios = async () => {
        try {
            const response = await ConveniosService.getConvenios({
                page: 1,
                limit: 100,
                status: "ACTIVO",
            })
            setConvenios(response.rows)
        } catch (error) {
            console.error('Error fetching convenios:', error)
        }
    }

    useEffect(() => {
        fetchCodigosDescuento()
        fetchConvenios()
    }, [pagination.page, pagination.limit, debouncedSearch, selectedConvenio, selectedStatus, selectedVigencia])

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
            await CodigosDescuentoService.toggleStatus(id, currentStatus)
            toast.success(
                currentStatus === "ACTIVO"
                    ? "Código desactivado correctamente"
                    : "Código activado correctamente"
            )
            fetchCodigosDescuento()
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
                toast.error("No se puede eliminar un código activo")
                return;
            }

            await CodigosDescuentoService.deleteCodigoDescuento(id)
            toast.success("Código eliminado correctamente")
            fetchCodigosDescuento()
        } catch (error) {
            console.error('Error deleting:', error)
            toast.error("No se pudo eliminar el código")
        }
    }

    const handleCodigoAdded = () => {
        fetchCodigosDescuento()
        setOpenAdd(false)
    }

    const handleDetailsCodigo = (codigo: CodigoDescuento) => {
        setSelectedCodigo(codigo)
        setOpenDetails(true)
    }

    const handleRefresh = () => {
        fetchCodigosDescuento()
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetCodigosDescuentoParams = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) {
                params.codigo = debouncedSearch.trim()
            }

            if (selectedConvenio) {
                params.convenio_id = selectedConvenio
            }

            const response = await CodigosDescuentoService.getCodigosDescuento(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(codigo => ({
                ID: codigo.id,
                Código: codigo.codigo,
                Convenio: codigo.convenio?.nombre || "Sin convenio",
                Empresa: codigo.convenio?.empresa?.nombre || "Sin empresa",
                Fecha_Inicio: codigo.fecha_inicio ? formatDate(codigo.fecha_inicio) : "N/A",
                Fecha_Término: codigo.fecha_termino ? formatDate(codigo.fecha_termino) : "N/A",
                Usos_Realizados: codigo.usos_realizados,
                Máximo_Usos: codigo.max_usos,
                Estado: codigo.status,
                Vigente: codigo.vigente ? "Sí" : "No",
                Creado: codigo.created_at ? formatDate(codigo.created_at) : "N/A",
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "codigos-descuento.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "codigos-descuento.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting códigos descuento:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }


    const actionButtons = [
        {
            label: "Nuevo Código",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Códigos de Descuento"
                description="Gestione los códigos de descuento de los convenios aquí."
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
                    <div className="flex items-center gap-2">
                        <select
                            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={selectedConvenio || ""}
                            onChange={(e) => setSelectedConvenio(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">Todos los convenios</option>
                            {convenios.map((convenio, index) => (
                                <option key={index} value={convenio.id}>
                                    {convenio.nombre} {convenio.empresa && `- ${convenio.empresa.nombre}`}
                                </option>
                            ))}
                        </select>

                        <select
                            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="ACTIVO">Activos</option>
                            <option value="INACTIVO">Inactivos</option>
                        </select>

                        <select
                            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={selectedVigencia}
                            onChange={(e) => setSelectedVigencia(e.target.value)}
                        >
                            <option value="">Toda la vigencia</option>
                            <option value="vigentes">Vigentes</option>
                            <option value="no-vigentes">No vigentes</option>
                        </select>
                    </div>
                }
            />
            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Código</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Vigencia</Table.TableHead>
                            <Table.TableHead>Usos</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
                            <Table.TableHead>Vigente</Table.TableHead>
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
                        ) : codigos.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={9} className="text-center py-8">
                                    No se encontraron códigos de descuento
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            codigos.map((codigo, index) => (
                                <Table.TableRow key={`${codigo.id}-${index}`}>
                                    <Table.TableCell>{codigo.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Icon.TicketIcon className="h-4 w-4 text-muted-foreground" />
                                            <code className="bg-muted px-2 py-1 rounded text-sm">
                                                {codigo.codigo}
                                            </code>
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {codigo.convenio?.nombre || "Sin convenio"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {codigo.convenio?.empresa?.nombre || "Sin empresa"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {codigo.fecha_inicio
                                            ? formatDateOnly(codigo.fecha_inicio)
                                            : "Sin inicio"}
                                        {" - "}
                                        {codigo.fecha_termino
                                            ? formatDateOnly(codigo.fecha_termino)
                                            : "Sin fin"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {codigo.usos_realizados ?? 0}
                                        {" / "}
                                        {codigo.max_usos ?? "sin límite"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={codigo.status === "ACTIVO" ? "active" : "inactive"}>
                                            {codigo.status === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {
                                            codigo.vigente
                                                ? <BadgeStatus status="active">Vigente</BadgeStatus>
                                                : <BadgeStatus status="inactive">No vigente</BadgeStatus>
                                        }
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
                                                    onClick={() => handleDetailsCodigo(codigo)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuSeparator />
                                                {codigo.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(codigo.id, codigo.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(codigo.id, codigo.status)}
                                                    >
                                                        <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                                        Activar
                                                    </Dropdown.DropdownMenuItem>
                                                )}

                                                {(codigo.status === "INACTIVO" && user?.rol === "SUPER_USUARIO") && (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleDelete(codigo.id, codigo.status)}
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
            {/* 
            <AddCodigoDescuentoModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleCodigoAdded}
            />

            <DetailsCodigoDescuentoModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                codigo={selectedCodigo}
            /> */}
        </div>
    )
}