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

const mockEmpresas = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    nombre: `Empresa ${i + 1}`,
    rut: `${(10000000 + i).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${(9 - (i % 10))}`,
    status: i % 3 === 0 ? "inactive" : "active",
    convenio: i % 4 === 0 ? "vencido" : "activo"
}))

export default function EmpresasPage() {
    const [searchValue, setSearchValue] = useState("")
    const [empresas, setEmpresas] = useState(mockEmpresas)
    const [filteredEmpresas, setFilteredEmpresas] = useState(mockEmpresas)
    const [openDetails, setOpenDetails] = useState(false)
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

    useEffect(() => {
        if (!searchValue.trim()) {
            setFilteredEmpresas(empresas)
        } else {
            const filtered = empresas.filter(empresa =>
                empresa.nombre.toLowerCase().includes(searchValue.toLowerCase()) ||
                empresa.rut.toLowerCase().includes(searchValue.toLowerCase())
            )
            setFilteredEmpresas(filtered)
        }
        setPagination(prev => ({ ...prev, page: 1 }))
    }, [searchValue, empresas])

    useEffect(() => {
        const total = filteredEmpresas.length
        const totalPages = Math.ceil(total / pagination.limit)
        const hasPrevPage = pagination.page > 1
        const hasNextPage = pagination.page < totalPages

        setPagination(prev => ({
            ...prev,
            total,
            totalPages,
            hasPrevPage,
            hasNextPage
        }))
    }, [filteredEmpresas, pagination.page, pagination.limit])

    const getCurrentPageEmpresas = () => {
        const startIndex = (pagination.page - 1) * pagination.limit
        const endIndex = startIndex + pagination.limit
        return filteredEmpresas.slice(startIndex, endIndex)
    }

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const actionButtons = [
        {
            label: "Nueva Empresa",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

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
                            label: "Visualización",
                            onClick: () => setOpenDetails(true),
                            icon: <Icon.InfoIcon className="h-4 w-4" />
                        },
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
            >
            </PageHeader>

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>RUT</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {getCurrentPageEmpresas().map((empresa) => (
                            <Table.TableRow key={empresa.id}>
                                <Table.TableCell>{empresa.id}</Table.TableCell>
                                <Table.TableCell className="font-medium">{empresa.nombre}</Table.TableCell>
                                <Table.TableCell>{empresa.rut}</Table.TableCell>
                                <Table.TableCell>
                                    <BadgeStatus status={empresa.status}>
                                        {empresa.status === "active" ? "Activa" : "Inactiva"}
                                    </BadgeStatus>
                                </Table.TableCell>
                                <Table.TableCell>
                                    <BadgeStatus status={empresa.convenio === "activo" ? "active" : "inactive"}>
                                        {empresa.convenio === "activo" ? "Activo" : "Vencido"}
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
                                            {empresa.status === "active" ? (
                                                <Dropdown.DropdownMenuItem variant="destructive">
                                                    <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                    Desactivar
                                                </Dropdown.DropdownMenuItem>
                                            ) : (
                                                <Dropdown.DropdownMenuItem>
                                                    <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                                    Activar
                                                </Dropdown.DropdownMenuItem>
                                            )}
                                        </Dropdown.DropdownMenuContent>
                                    </Dropdown.DropdownMenu>
                                </Table.TableCell>
                            </Table.TableRow>
                        ))}
                    </Table.TableBody>
                </Table.Table>
            </Card.Card>

            <ExportModal
                open={openExport}
                onOpenChange={setOpenExport}
            />

            <AddEmpresaModal
                open={openAdd}
                onOpenChange={setOpenAdd}
            />
        </div>
    )
}