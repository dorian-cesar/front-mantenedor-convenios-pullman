"use client"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import * as Icon from "lucide-react"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Card from "@/components/ui/card"
import { useState } from "react"

export default function AdultosMayoresPage() {
    const [searchValue, setSearchValue] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
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

    const handleRefresh = () => {
        alert("refresh")
    }

    const actionButtons = [
        {
            label: "Nuevo Registro",
            onClick: () => alert("nuevo registro"),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Usuarios Frecuentes"
                description="Gestione los usuarios frecuentes beneficiados"
                actionButtons={actionButtons}
                actionMenu={{
                    title: "Detalles",
                    items: [
                        {
                            label: "Exportar",
                            onClick: () => alert("exportar"),
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
                filters={
                    <div className="flex items-center space-x-2">
                        filtros acá
                    </div>
                }
            />

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
                            <Table.TableHead>Tipo Consulta</Table.TableHead>
                            <Table.TableHead>Descuento</Table.TableHead>
                            <Table.TableHead>Endpoint</Table.TableHead>
                            <Table.TableHead>Tope Monto</Table.TableHead>
                            <Table.TableHead>Tope Cantidad Tickets</Table.TableHead>
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
                        )
                            // : convenios.length === 0 ? (
                            //     <Table.TableRow>
                            //         <Table.TableCell colSpan={5} className="text-center py-8">
                            //             No se encontraron convenios
                            //         </Table.TableCell>
                            //     </Table.TableRow>
                            // )
                            : (
                                // convenios.map((convenio, index) => (
                                //     <Table.TableRow key={`${convenio.id}-${index}`}>
                                //         <Table.TableCell>{convenio.id}</Table.TableCell>
                                //         <Table.TableCell className="font-medium">{convenio.nombre}</Table.TableCell>
                                //         <Table.TableCell>
                                //             {convenio.empresa?.nombre || "Sin empresa"}
                                //         </Table.TableCell>
                                //         <Table.TableCell>
                                //             <BadgeStatus status={convenio.status === "ACTIVO" ? "active" : "inactive"}>
                                //                 {convenio.status === "ACTIVO" ? "Activo" : "Inactivo"}
                                //             </BadgeStatus>
                                //         </Table.TableCell>
                                //         <Table.TableCell>
                                //             {convenio.tipo_consulta ? (
                                //                 convenio.tipo_consulta === "CODIGO_DESCUENTO" ? (
                                //                     <>
                                //                         <span>Código</span>
                                //                         <br />
                                //                         <span className="text-sm text-gray-500">{convenio.codigo}</span>
                                //                     </>
                                //                 ) : (
                                //                     "API"
                                //                 )
                                //             ) : (
                                //                 "Sin consulta"
                                //             )}
                                //         </Table.TableCell>
                                //         <Table.TableCell>{convenio.porcentaje_descuento ? `${formatNumber(convenio.porcentaje_descuento)}%` : "Sin descuento"}</Table.TableCell>
                                //         <Table.TableCell>
                                //             {convenio.endpoint || "Sin endpoint"}
                                //         </Table.TableCell>
                                //         <Table.TableCell>{convenio.tope_monto_ventas ? formatNumber(convenio.tope_monto_ventas) : "Sin tope"}</Table.TableCell>
                                //         <Table.TableCell>{convenio.tope_cantidad_tickets ? formatNumber(convenio.tope_cantidad_tickets) : "Sin tope"}</Table.TableCell>
                                //         {/* <Table.TableCell>{convenio.descuento?.porcentaje ? `${formatNumber(convenio.descuento.porcentaje)}%` : "Sin descuento"}</Table.TableCell> */}
                                //         <Table.TableCell className="text-right">
                                //             <Dropdown.DropdownMenu>
                                //                 <Dropdown.DropdownMenuTrigger asChild>
                                //                     <Button variant="ghost" size="icon" className="size-8">
                                //                         <Icon.MoreHorizontalIcon />
                                //                     </Button>
                                //                 </Dropdown.DropdownMenuTrigger>
                                //                 <Dropdown.DropdownMenuContent align="end">
                                //                     <Dropdown.DropdownMenuItem
                                //                         onClick={() => handleDetailsConvenio(convenio)}
                                //                     >
                                //                         <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                //                         Ver detalles
                                //                     </Dropdown.DropdownMenuItem>
                                //                     <Dropdown.DropdownMenuItem
                                //                         onClick={() => handleEditConvenio(convenio)}
                                //                     >
                                //                         <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                //                         Editar
                                //                     </Dropdown.DropdownMenuItem>
                                //                     <Dropdown.DropdownMenuSeparator />
                                //                     {convenio.status === "ACTIVO" ? (
                                //                         <Dropdown.DropdownMenuItem
                                //                             variant="destructive"
                                //                             onClick={() => handleToggleStatus(convenio.id, convenio.status)}
                                //                         >
                                //                             <Icon.BanIcon className="h-4 w-4 mr-2" />
                                //                             Desactivar
                                //                         </Dropdown.DropdownMenuItem>
                                //                     ) : (
                                //                         <Dropdown.DropdownMenuItem
                                //                             onClick={() => handleToggleStatus(convenio.id, convenio.status)}
                                //                         >
                                //                             <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                //                             Activar
                                //                         </Dropdown.DropdownMenuItem>
                                //                     )}

                                //                     {(convenio.status === "INACTIVO" && user?.rol === "SUPER_USUARIO") && (
                                //                         <Dropdown.DropdownMenuItem
                                //                             variant="destructive"
                                //                             onClick={() => handleDelete(convenio.id, convenio.status)}
                                //                         >
                                //                             <Icon.Trash2 className="h-4 w-4 mr-2" />
                                //                             Eliminar
                                //                         </Dropdown.DropdownMenuItem>
                                //                     )}
                                //                 </Dropdown.DropdownMenuContent>
                                //             </Dropdown.DropdownMenu>
                                //         </Table.TableCell>
                                //     </Table.TableRow>
                                // ))
                                <div>
                                    tabla aca
                                </div>
                            )}
                    </Table.TableBody>
                </Table.Table>
            </Card.Card>
        </div>
    )
}
