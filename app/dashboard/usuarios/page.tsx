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
import { Input } from "@/components/ui/input"
import AddUserModal from "@/components/modals/add-usuario"
import ExportModal from "@/components/modals/export"
import { set } from "date-fns"

const mockUsuarios = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  correo: `correo${i + 1}@gmail.com`,
  status: i % 3 === 0 ? "inactive" : "active",
}))

const mockRoles = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  nombre: `rol ${i + 1}`,
  status: i % 3 === 0 ? "inactive" : "active",
}))

export default function UsuariosPage() {
  const [searchUser, setSearchUser] = useState("")
  const [usuarios, setUsuarios] = useState(mockUsuarios)
  const [filteredUsuarios, setFilteredUsuarios] = useState(mockUsuarios)
  const [openAddUserModal, setOpenAddUserModal] = useState(false)
  const [openDetails, setOpenDetails] = useState(false)
  const [openExportModal, setOpenExportModal] = useState(false)

  const [searchRol, setSearchRol] = useState("")
  const [roles, setRoles] = useState(mockRoles)
  const [filteredRoles, setFilteredRoles] = useState(mockUsuarios)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  useEffect(() => {
    if (!searchUser.trim()) {
      setFilteredUsuarios(usuarios)
    } else {
      const filtered = usuarios.filter(usuario =>
        usuario.correo.toLowerCase().includes(searchUser.toLowerCase())
      )
      setFilteredUsuarios(filtered)
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchUser, usuarios])

  useEffect(() => {
    const total = filteredUsuarios.length
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
  }, [filteredUsuarios, pagination.page, pagination.limit])

  const getCurrentPageUsuarios = () => {
    const startIndex = (pagination.page - 1) * pagination.limit
    const endIndex = startIndex + pagination.limit
    return filteredUsuarios.slice(startIndex, endIndex)
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const actionButtons = [
    {
      label: "Nuevo Usuario",
      onClick: () => setOpenAddUserModal(true),
      icon: <Icon.PlusIcon className="h-4 w-4" />
    },
  ]

  return (
    <div className="flex flex-col justify-center space-y-4">
      <PageHeader
        title="Usuarios del Sistema"
        description="Listado de los usuarios que tienen acceso a la plataforma"
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
              onClick: () => setOpenExportModal(true),
              icon: <Icon.DownloadIcon className="h-4 w-4" />
            }
          ]
        }}
        showSearch={true}
        searchValue={searchUser}
        onSearchChange={setSearchUser}
        onSearchClear={() => setSearchUser("")}
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

      <div className="flex gap-4">
        <Card.Card className="flex-1">
          <Table.Table>
            <Table.TableHeader>
              <Table.TableRow>
                <Table.TableHead>ID</Table.TableHead>
                <Table.TableHead>Correo</Table.TableHead>
                <Table.TableHead>Status</Table.TableHead>
                <Table.TableHead className="text-right">Acciones</Table.TableHead>
              </Table.TableRow>
            </Table.TableHeader>
            <Table.TableBody>
              {getCurrentPageUsuarios().map((usuario) => (
                <Table.TableRow key={usuario.id}>
                  <Table.TableCell>{usuario.id}</Table.TableCell>
                  <Table.TableCell className="font-medium">{usuario.correo}</Table.TableCell>
                  <Table.TableCell>
                    <BadgeStatus status={usuario.status}>
                      {usuario.status === "active" ? "Activa" : "Inactiva"}
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
                        {usuario.status === "active" ? (
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
        <Card.Card className="flex flex-col flex-1 max-h-[579px]">
          <Card.CardHeader>
            <Card.CardTitle className="text-xl">Roles</Card.CardTitle>
            <Card.CardDescription>Administra roles dentro del sistema</Card.CardDescription>
            <Card.CardAction>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={() => alert("hola")}
                >
                  <span className="mr-2">{<Icon.PlusIcon className="h-4 w-4" />}</span>
                  Nuevo Rol
                </Button>
                <Button
                  variant="outline"
                  onClick={() => alert("hola")}
                >
                  Detalles
                </Button>
              </div>
            </Card.CardAction>
            <div className="flex items-center space-x-2 max-w-md">
              <div className="relative flex-1">
                <Icon.SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar rol..."
                  value={searchRol}
                  onChange={(e) => alert(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchRol && (
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
          </Card.CardHeader>
          <Card.CardContent className="flex-1 overflow-y-auto">
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
                {roles.map((rol) => (
                  <Table.TableRow key={rol.id}>
                    <Table.TableCell>{rol.id}</Table.TableCell>
                    <Table.TableCell className="font-medium">{rol.nombre}</Table.TableCell>
                    <Table.TableCell>
                      <BadgeStatus status={rol.status}>
                        {rol.status === "active" ? "Activa" : "Inactiva"}
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
                          {rol.status === "active" ? (
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
          </Card.CardContent>
        </Card.Card>
      </div>

      <AddUserModal
        open={openAddUserModal}
        onOpenChange={setOpenAddUserModal}
      />

      {/* <ExportModal
        open={openExportModal}
        onOpenChange={setOpenExportModal}
      /> */}
    </div>
  )
}