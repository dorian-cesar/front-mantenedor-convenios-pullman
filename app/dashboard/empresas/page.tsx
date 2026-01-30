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
import AddEmpresaModal from "@/components/modals/add-empresa"
import { EmpresasService, type Empresa, type GetEmpresasParams } from "@/services/empresa.service"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"

export default function EmpresasPage() {
    const [searchValue, setSearchValue] = useState("")
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const { toast } = useToast()

    const debouncedSearch = useDebounce(searchValue, 500)

    const fetchEmpresas = async () => {
        setIsLoading(true)
        try {
            const params: GetEmpresasParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim()
            }

            const response = await EmpresasService.getEmpresas(params)

            setEmpresas(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching empresas:', error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las empresas",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmpresas()
    }, [pagination.page, pagination.limit, debouncedSearch])

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const handleToggleStatus = async (id: number, currentStatus: "ACTIVO" | "INACTIVO") => {
        try {
            await EmpresasService.toggleStatus(id, currentStatus)
            toast({
                title: "Éxito",
                description: "Estado actualizado correctamente",
            })
            fetchEmpresas()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast({
                title: "Error",
                description: "No se pudo actualizar el estado",
                variant: "destructive"
            })
        }
    }

    const handleEmpresaAdded = () => {
        fetchEmpresas()
        setOpenAdd(false)
    }

    const actionButtons = [
        {
            label: "Nueva Empresa",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    const formatRut = (rut: string) => {
        if (rut.includes('-')) return rut

        const rutBody = rut.slice(0, -1)
        const dv = rut.slice(-1)
        return `${rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
    }

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Empresas en Convenio"
                description="Listado de todas las empresas que tienen convenios activos."
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
            />

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>RUT</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
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
                        ) : empresas.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={5} className="text-center py-8">
                                    No se encontraron empresas
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            empresas.map((empresa) => (
                                <Table.TableRow key={empresa.id}>
                                    <Table.TableCell>{empresa.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{empresa.nombre}</Table.TableCell>
                                    <Table.TableCell>{formatRut(empresa.rut_empresa)}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={empresa.status === "ACTIVO" ? "active" : "inactive"}>
                                            {empresa.status === "ACTIVO" ? "Activa" : "Inactiva"}
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
                                                <Dropdown.DropdownMenuItem>
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuItem>
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuSeparator />
                                                {empresa.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(empresa.id, empresa.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(empresa.id, empresa.status)}
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

            <ExportModal open={openExport} onOpenChange={setOpenExport} />

            <AddEmpresaModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleEmpresaAdded}
            />
        </div>
    )
}
