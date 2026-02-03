"use client"

import { Button } from "@/components/ui/button"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import { BadgeRole } from "@/components/ui/badge-role"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import ExportModal from "@/components/modals/export"
import AddUsuarioModal from "@/components/modals/add-usuario"
// import UpdateUsuarioModal from "@/components/modals/update-usuario"
import DetailsUsuarioModal from "@/components/modals/details-usuario"
import { UsuariosService, type Usuario, type GetUsuariosParams } from "@/services/usuario.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"

export default function UsuariosPage() {
  const [searchValue, setSearchValue] = useState("")
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openExport, setOpenExport] = useState(false)
  const [openAdd, setOpenAdd] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [openDetails, setOpenDetails] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const debouncedSearch = useDebounce(searchValue, 500)

  const fetchUsuarios = async () => {
    setIsLoading(true)
    try {
      const params: GetUsuariosParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'id',
        order: 'DESC',
      }

      if (debouncedSearch.trim()) {
        params.correo = debouncedSearch.trim()
      }

      const response = await UsuariosService.getUsuarios(params)

      setUsuarios(response.rows)

      setPagination(prev => ({
        ...prev,
        total: response.totalItems,
        totalPages: response.totalPages || 1,
        hasPrevPage: (response.currentPage || 1) > 1,
        hasNextPage: (response.currentPage || 1) < (response.totalPages || 1)
      }))
    } catch (error) {
      console.error('Error fetching usuarios:', error)
      toast.error("No se pudieron cargar los usuarios")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [pagination.page, pagination.limit, debouncedSearch])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleToggleStatus = async (
    id: number,
    currentStatus: "ACTIVO" | "INACTIVO"
  ) => {
    try {
      await UsuariosService.toggleStatus(id, currentStatus)

      toast.success(
        currentStatus === "ACTIVO"
          ? "Usuario desactivado correctamente"
          : "Usuario activado correctamente"
      )

      fetchUsuarios()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error("No se pudo actualizar el estado")
    }
  }

  const handleUsuarioAdded = () => {
    fetchUsuarios()
    setOpenAdd(false)
  }

  const handleEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setOpenUpdate(true)
  }

  const handleUsuarioUpdated = () => {
    fetchUsuarios()
  }

  const handleDetailsUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setOpenDetails(true)
  }

  const handleExport = async (type: "csv" | "excel") => {
    try {
      toast.loading("Preparando exportación...", { id: "export" })

      const params: GetUsuariosParams = {
        sortBy: "id",
        order: "DESC",
      }

      if (debouncedSearch.trim()) {
        params.correo = debouncedSearch.trim()
      }

      const response = await UsuariosService.getUsuarios(params)

      if (!response.rows.length) {
        toast.error("No hay datos para exportar", { id: "export" })
        return
      }

      const formattedData = response.rows.map(user => ({
        ID: user.id,
        Correo: user.correo,
        Nombre: user.nombre || "Sin nombre",
        RUT: user.rut || "Sin RUT",
        Teléfono: user.telefono || "Sin teléfono",
        Rol: user.rol || "Sin rol",
        Estado: user.status,
      }))

      if (type === "csv") {
        exportToCSV(formattedData, "usuarios.csv")
        toast.success("CSV exportado correctamente", { id: "export" })
      }

      if (type === "excel") {
        exportToExcel(formattedData, "usuarios.xlsx")
        toast.success("Excel exportado correctamente", { id: "export" })
      }

    } catch (error) {
      console.error("Error exporting usuarios:", error)
      toast.error("Error al exportar datos", { id: "export" })
    }
  }

  const ROLE_LABELS: Record<"user" | "admin" | "superuser", string> = {
    user: "Usuario",
    admin: "Administrador",
    superuser: "Super Usuario",
  }

  const actionButtons = [
    {
      label: "Nuevo Usuario",
      onClick: () => setOpenAdd(true),
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
        onRefresh={fetchUsuarios}
      />

      <div className="flex gap-4">
        <Card.Card className="flex-[2]">
          <Table.Table>
            <Table.TableHeader>
              <Table.TableRow>
                <Table.TableHead>ID</Table.TableHead>
                <Table.TableHead>Correo</Table.TableHead>
                <Table.TableHead>Nombre</Table.TableHead>
                <Table.TableHead>Rol</Table.TableHead>
                <Table.TableHead>Status</Table.TableHead>
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
              ) : usuarios.length === 0 ? (
                <Table.TableRow>
                  <Table.TableCell colSpan={6} className="text-center py-8">
                    No se encontraron usuarios
                  </Table.TableCell>
                </Table.TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <Table.TableRow key={usuario.id}>
                    <Table.TableCell>{usuario.id}</Table.TableCell>
                    <Table.TableCell className="font-medium">{usuario.correo}</Table.TableCell>
                    <Table.TableCell>{usuario.nombre || "Sin nombre"}</Table.TableCell>
                    <Table.TableCell>
                      {usuario.rol === "SUPER_USUARIO" ? "Super Usuario" : "Usuario"}
                    </Table.TableCell>
                    <Table.TableCell>
                      <BadgeStatus status={usuario.status === "ACTIVO" ? "active" : "inactive"}>
                        {usuario.status === "ACTIVO" ? "Activo" : "Inactivo"}
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
                            onClick={() => handleDetailsUsuario(usuario)}
                          >
                            <Icon.EyeIcon className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Dropdown.DropdownMenuItem>
                          <Dropdown.DropdownMenuItem
                            onClick={() => handleEditUsuario(usuario)}
                          >
                            <Icon.PencilIcon className="h-4 w-4 mr-2" />
                            Editar
                          </Dropdown.DropdownMenuItem>
                          <Dropdown.DropdownMenuSeparator />
                          {usuario.status === "ACTIVO" ? (
                            <Dropdown.DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleToggleStatus(usuario.id, usuario.status)}
                            >
                              <Icon.BanIcon className="h-4 w-4 mr-2" />
                              Desactivar
                            </Dropdown.DropdownMenuItem>
                          ) : (
                            <Dropdown.DropdownMenuItem
                              onClick={() => handleToggleStatus(usuario.id, usuario.status)}
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

        <Card.Card className="flex flex-col flex-[1]">
          <Card.CardHeader>
            <Card.CardTitle className="text-xl">Roles del Sistema</Card.CardTitle>
            <Card.CardDescription>
              Los usuarios pueden tener uno de estos roles:
            </Card.CardDescription>
          </Card.CardHeader>
          <Card.CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-lg">Super Usuario</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Acceso completo a todas las funcionalidades del sistema.
                  Puede gestionar usuarios, empresas, convenios y configuración.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-lg">Usuario</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Acceso limitado a funcionalidades específicas.
                  Generalmente para visualización y operaciones básicas.
                </p>
              </div>
            </div>
          </Card.CardContent>
        </Card.Card>
      </div>

      <ExportModal
        open={openExport}
        onOpenChange={setOpenExport}
        onExport={handleExport}
      />

      <AddUsuarioModal
        open={openAdd}
        onOpenChange={setOpenAdd}
        onSuccess={handleUsuarioAdded}
      />

      {/* <UpdateUsuarioModal
        open={openUpdate}
        onOpenChange={setOpenUpdate}
        usuario={selectedUsuario}
        onSuccess={handleUsuarioUpdated}
      /> */}

      <DetailsUsuarioModal
        open={openDetails}
        onOpenChange={setOpenDetails}
        usuario={selectedUsuario}
      />
    </div>
  )
}