"use client";
import { RolesService, type Role, type GetRolesParams } from "@/services/roles.service"
import * as Card from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import * as Icon from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import * as Table from "@/components/ui/table"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Dropdown from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"


export default function Roles() {
    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

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

    const fetchRoles = async () => {
        setIsLoading(true)
        try {
            const params: GetRolesParams = {
                page: pagination.page,
                limit: pagination.limit,
            }

            const response = await RolesService.getRoles(params)
            setRoles(response.rows)

            setPagination(prev => ({
                ...prev,
                total: response.totalItems,
                totalPages: response.totalPages || 1,
                hasPrevPage: (response.currentPage || 1) > 1,
                hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
            }))
        } catch (error) {
            console.error('Error fetching roles:', error)
            toast.error("No se pudieron cargar los roles")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [pagination.page, pagination.limit])

    const handleToggleStatus = async (
        id: number,
        currentStatus: "ACTIVO" | "INACTIVO"
    ) => {
        try {
            await RolesService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Rol desactivado correctamente"
                    : "Rol activado correctamente"
            )

            fetchRoles()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleRoleAdded = () => {
        fetchRoles()
        setOpenAdd(false)
    }

    const handleEditRole = (role: Role) => {
        setSelectedRole(role)
        setOpenUpdate(true)
    }

    const handleRoleUpdated = () => {
        fetchRoles()
    }



    const actionButtons = [
        {
            label: "Nuevo Rol",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4 flex-[1]">
            <PageHeader
                title="Roles del Sistema"
                description="Gestione los roles acceso a la plataforma"
                actionButtons={actionButtons}
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
                        limitOptions = {[5, 10, 30]}
                        showResults={false}
                    />
                }
                showRefreshButton={true}
            // onRefresh={fetchUsuarios}
            />

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
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
                        ) : roles.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={6} className="text-center py-8">
                                    No se encontraron roles
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            roles.map((rol) => (
                                <Table.TableRow key={rol.id}>
                                    <Table.TableCell>{rol.id}</Table.TableCell>
                                    <Table.TableCell>{rol.nombre || "Sin nombre"}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={rol.status === "ACTIVO" ? "active" : "inactive"}>
                                            {rol.status === "ACTIVO" ? "Activo" : "Inactivo"}
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
                                                    onClick={() => handleEditRole(rol)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>
                                                <Dropdown.DropdownMenuSeparator />
                                                {rol.status === "ACTIVO" ? (
                                                    <Dropdown.DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleToggleStatus(rol.id, rol.status)}
                                                    >
                                                        <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                        Desactivar
                                                    </Dropdown.DropdownMenuItem>
                                                ) : (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleToggleStatus(rol.id, rol.status)}
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
        </div>
    )
}