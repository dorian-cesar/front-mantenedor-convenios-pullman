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
import { ClienteCorporativoService, type ClienteCorporativo, type GetClientesParams } from "@/services/cliente-corporativo.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { useParams, useRouter } from "next/navigation"
import { formatRut } from "@/utils/helpers"
import UploadCsvClientesCorporativosModal from "@/components/modals/upload-csv-clientes-corporativos"
import AddClienteCorporativoModal from "@/components/modals/add-cliente-corporativo"
import UpdateClienteCorporativoModal from "@/components/modals/update-cliente-corporativo"

export default function DetalleTablaCorporativaPage() {
    const params = useParams()
    const router = useRouter()
    const nombreTabla = params.id as string

    const [searchValue, setSearchValue] = useState("")
    const [clientes, setClientes] = useState<ClienteCorporativo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openUpload, setOpenUpload] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [selectedCliente, setSelectedCliente] = useState<ClienteCorporativo | null>(null)
    const [tableLabel, setTableLabel] = useState(nombreTabla)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 300)

    const fetchClientes = async () => {
        setIsLoading(true)
        try {
            const queryParams: GetClientesParams = {
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch.trim() || undefined,
                sortBy: 'id',
                order: 'DESC'
            }

            const response = await ClienteCorporativoService.getClientes(nombreTabla, queryParams)
            setClientes(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching clientes:', error)
            toast.error("No se pudieron cargar los registros de la nómina")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (nombreTabla) {
            fetchClientes()
        }
    }, [nombreTabla, pagination.page, pagination.limit, debouncedSearch])

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

    const handleToggleStatus = async (rut: string) => {
        try {
            await ClienteCorporativoService.toggleClienteStatus(nombreTabla, rut)
            toast.success("Estado actualizado")
            fetchClientes()
        } catch (error) {
            toast.error("No se pudo cambiar el estado")
        }
    }

    const handleDelete = async (rut: string) => {
        if (!confirm("¿Eliminar este registro de la nómina?")) return
        try {
            await ClienteCorporativoService.deleteCliente(nombreTabla, rut)
            toast.success("Registro eliminado")
            fetchClientes()
        } catch (error) {
            toast.error("Error al eliminar")
        }
    }

    const handleEdit = (cliente: ClienteCorporativo) => {
        setSelectedCliente(cliente)
        setOpenUpdate(true)
    }

    const actionButtons = [
        {
            label: "Volver",
            onClick: () => router.push("/dashboard/tablas-clientes-corporativos"),
            variant: "outline" as const,
            icon: <Icon.ChevronLeft className="h-4 w-4" />
        },
        {
            label: "Agregar Cliente",
            onClick: () => setOpenAdd(true),
            variant: "outline" as const,
            icon: <Icon.UserPlus2 className="h-4 w-4" />
        },
        {
            label: "Cargar CSV/Excel",
            onClick: () => setOpenUpload(true),
            icon: <Icon.FileSpreadsheet className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title={`Gestión de Nómina: ${nombreTabla.replace("clientes_corporativos_", "").replace(/_/g, " ").toUpperCase()}`}
                description="Gestione los RUTs autorizados dentro de esta tabla dinámica corporativa."
                actionButtons={actionButtons}
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
                onRefresh={fetchClientes}
            />

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>RUT</Table.TableHead>
                            <Table.TableHead>Nombre Completo</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
                            <Table.TableHead>Creado</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : clientes.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No se encontraron registros en esta nómina. Use "Agregar Cliente" o "Cargar CSV" para subir datos.
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            clientes.map((cliente) => (
                                <Table.TableRow key={cliente.id}>
                                    <Table.TableCell className="text-muted-foreground text-xs">{cliente.id}</Table.TableCell>
                                    <Table.TableCell className="font-mono text-sm">{formatRut(cliente.rut)}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{cliente.nombre_completo}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={cliente.status === "ACTIVO" ? "active" : "inactive"}>
                                            {cliente.status}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-xs text-muted-foreground">
                                        {new Date(cliente.createdAt).toLocaleDateString()}
                                    </Table.TableCell>
                                    <Table.TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(cliente)}>
                                                <Icon.PencilIcon className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => handleToggleStatus(cliente.rut)}>
                                                {cliente.status === "ACTIVO" ? (
                                                    <Icon.UserCheck className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Icon.UserX className="h-4 w-4 text-destructive" />
                                                )}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(cliente.rut)}>
                                                <Icon.Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Table.TableCell>
                                </Table.TableRow>
                            ))
                        )}
                    </Table.TableBody>
                </Table.Table>
            </Card.Card>

            <UploadCsvClientesCorporativosModal 
                open={openUpload}
                onOpenChange={setOpenUpload}
                nombreTabla={nombreTabla}
                onSuccess={fetchClientes}
            />

            <AddClienteCorporativoModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                nombreTabla={nombreTabla}
                onSuccess={fetchClientes}
            />

            <UpdateClienteCorporativoModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                nombreTabla={nombreTabla}
                cliente={selectedCliente}
                onSuccess={fetchClientes}
            />
        </div>
    )
}
