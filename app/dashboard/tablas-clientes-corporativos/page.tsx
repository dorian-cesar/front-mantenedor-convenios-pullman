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
import { ClienteCorporativoService, type RegistroTablaClienteCorporativo, type GetTablasParams } from "@/services/cliente-corporativo.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import AddTablaCorporativaModal from "@/components/modals/add-tabla-corporativa"
import Link from "next/link"

export default function TablasClientesCorporativosPage() {
    const [searchValue, setSearchValue] = useState("")
    const [tablas, setTablas] = useState<RegistroTablaClienteCorporativo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openAdd, setOpenAdd] = useState(false)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 300)

    const fetchTablas = async () => {
        setIsLoading(true)
        try {
            const params: GetTablasParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            const response = await ClienteCorporativoService.getTablas(params)

            setTablas(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching tablas corporativas:', error)
            toast.error("No se pudieron cargar las nóminas")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTablas()
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

    const handleDeleteTabla = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar esta nómina? Se borrará la tabla física y todos sus clientes.")) return;
        
        try {
            await ClienteCorporativoService.deleteTabla(id)
            toast.success("Nómina eliminada correctamente")
            fetchTablas()
        } catch (error) {
            toast.error("No se pudo eliminar la nómina")
        }
    }

    const actionButtons = [
        {
            label: "Nueva Nómina Física",
            onClick: () => setOpenAdd(true),
            icon: <Icon.DatabaseBackup className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Gestión de Nóminas Corporativas"
                description="Administra las tablas dinámicas de clientes corporativos por empresa."
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
                onRefresh={fetchTablas}
            />

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre Nómina</Table.TableHead>
                            <Table.TableHead>Empresa / Convenio</Table.TableHead>
                            <Table.TableHead>Nombre Tabla (Físico)</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
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
                        ) : tablas.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay nóminas corporativas registradas.
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            tablas.map((tabla) => (
                                <Table.TableRow key={tabla.id}>
                                    <Table.TableCell className="text-muted-foreground text-xs">{tabla.id}</Table.TableCell>
                                    <Table.TableCell className="font-semibold">{tabla.nombre_display}</Table.TableCell>
                                    <Table.TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{tabla.empresa?.nombre || 'Sin Empresa'}</span>
                                            <span className="text-xs text-muted-foreground">{tabla.convenio?.nombre || 'Sin Convenio asociado'}</span>
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{tabla.nombre_tabla}</code>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={tabla.status === "ACTIVO" ? "active" : "inactive"}>
                                            {tabla.status}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/tablas-clientes-corporativos/${tabla.nombre_tabla}`}>
                                                    <Icon.UsersIcon className="h-4 w-4 mr-2" />
                                                    Gestionar Clientes
                                                </Link>
                                            </Button>
                                            <Dropdown.DropdownMenu>
                                                <Dropdown.DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <Icon.MoreVerticalIcon className="h-4 w-4" />
                                                    </Button>
                                                </Dropdown.DropdownMenuTrigger>
                                                <Dropdown.DropdownMenuContent align="end">
                                                    <Dropdown.DropdownMenuItem 
                                                        className="text-destructive font-medium focus:text-destructive"
                                                        onClick={() => handleDeleteTabla(tabla.id)}
                                                    >
                                                        <Icon.Trash2Icon className="h-4 w-4 mr-2" />
                                                        Eliminar Nómina
                                                    </Dropdown.DropdownMenuItem>
                                                </Dropdown.DropdownMenuContent>
                                            </Dropdown.DropdownMenu>
                                        </div>
                                    </Table.TableCell>
                                </Table.TableRow>
                            ))
                        )}
                    </Table.TableBody>
                </Table.Table>
            </Card.Card>

            <AddTablaCorporativaModal 
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={() => {
                    fetchTablas()
                    setOpenAdd(false)
                }}
            />
        </div>
    )
}
