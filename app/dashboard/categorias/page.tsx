"use client"

import { Button } from "@/components/ui/button"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { CategoriasService, type Categoria } from "@/services/categoria.service"
import { toast } from "sonner"
import AddCategoriaModal from "@/components/modals/add-categoria"
import UpdateCategoriaModal from "@/components/modals/update-categoria"
import { useAuth } from "@/hooks/useAuth"

export default function CategoriasPage() {
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null)
    const [empresas, setEmpresas] = useState<any[]>([])
    const { user } = useAuth()

    const isAdmin = user?.rol?.toUpperCase() === "SUPER_USUARIO" || user?.rol?.toUpperCase() === "SOPORTE";
    const isReadOnlyRole = user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user" || user?.rol?.toUpperCase() === "SISTEMA";

    const fetchCategorias = async () => {
        setIsLoading(true)
        try {
            // Use user.empresa_id if available (for regular users)
            const empresaId = user?.empresa_id || user?.id_empresa;
            const data = await CategoriasService.getCategorias(empresaId)
            setCategorias(data)
        } catch (error) {
            console.error('Error fetching categorias:', error)
            toast.error("No se pudieron cargar las categorías")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchEmpresas = async () => {
        if (!isAdmin) return;
        try {
            const { EmpresasService } = await import("@/services/empresa.service")
            const res = await EmpresasService.getEmpresas({ limit: 1000, status: 'ACTIVO' })
            setEmpresas(res.rows || [])
        } catch (error) {
            console.error("Error fetching empresas:", error)
        }
    }

    useEffect(() => {
        fetchCategorias()
        fetchEmpresas()
    }, [user?.id])

    const handleEdit = (categoria: Categoria) => {
        setSelectedCategoria(categoria)
        setOpenUpdate(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar esta categoría? Solo podrá hacerlo si no tiene convenios asociados.")) return

        try {
            await CategoriasService.deleteCategoria(id)
            toast.success("Categoría eliminada correctamente")
            fetchCategorias()
        } catch (error: any) {
            console.error('Error deleting:', error)
            const message = error.response?.data?.message || "No se pudo eliminar la categoría"
            toast.error(message)
        }
    }

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Categorías de Convenios"
                description="Gestione las categorías para organizar sus convenios."
                actionButtons={isReadOnlyRole ? [] : [
                    {
                        label: "Nueva Categoría",
                        onClick: () => setOpenAdd(true),
                        icon: <Icon.PlusIcon className="h-4 w-4" />
                    },
                ]}
                showSearch={false}
                showRefreshButton={true}
                onRefresh={fetchCategorias}
            />

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>Descripción</Table.TableHead>
                            <Table.TableHead>Fecha Creación</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={5} className="text-center py-8">
                                    <Icon.Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : categorias.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={5} className="text-center py-8">
                                    No hay categorías registradas
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            categorias.map((cat) => (
                                <Table.TableRow key={cat.id}>
                                    <Table.TableCell>{cat.id}</Table.TableCell>
                                    <Table.TableCell className="font-medium">{cat.nombre}</Table.TableCell>
                                    <Table.TableCell className="text-muted-foreground">
                                        {cat.descripcion || "-"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : "N/A"}
                                    </Table.TableCell>
                                    <Table.TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(cat)}
                                                disabled={isReadOnlyRole}
                                            >
                                                <Icon.Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(cat.id)}
                                                disabled={isReadOnlyRole}
                                            >
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

            <AddCategoriaModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                empresas={empresas}
                onSuccess={() => {
                    setOpenAdd(false)
                    fetchCategorias()
                }}
            />

            <UpdateCategoriaModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                categoria={selectedCategoria}
                onSuccess={() => {
                    setOpenUpdate(false)
                    fetchCategorias()
                }}
            />
        </div>
    )
}
