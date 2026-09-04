"use client"

import { Button } from "@/components/ui/button"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import AddBannerModal from "@/components/modals/add-banner"
import UpdateBannerModal from "@/components/modals/update-banner"
import { BannersService, type Banner } from "@/services/banner.service"
import { ConfiguracionService } from "@/services/configuracion.service"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("")
    const [listFilter, setListFilter] = useState<string>("")
    const { user, initialized: authInitialized } = useAuth()
    
    // Configuration states
    const [countA, setCountA] = useState<string>("4")
    const [countB, setCountB] = useState<string>("4")
    const [isSavingConfig, setIsSavingConfig] = useState(false)

    const isReadOnlyRole = user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user" || user?.rol?.toUpperCase() === "SISTEMA";

    const fetchBanners = async () => {
        if (!authInitialized) return;
        
        setIsLoading(true)
        try {
            const data = await BannersService.getBanners()
            setBanners(data)
        } catch (error) {
            console.error('Error fetching banners:', error)
            toast.error("No se pudieron cargar los banners")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchConfig = async () => {
        try {
            const config = await ConfiguracionService.getParametros()
            setCountA(config.HERO_LISTA_A_COUNT || "4")
            setCountB(config.HERO_LISTA_B_COUNT || "4")
        } catch (error) {
            console.error('Error fetching config:', error)
        }
    }

    useEffect(() => {
        if (!authInitialized) return;
        fetchBanners()
        fetchConfig()
    }, [authInitialized])

    const handleSaveConfig = async () => {
        setIsSavingConfig(true)
        try {
            await ConfiguracionService.updateParametros(parseInt(countA), parseInt(countB))
            toast.success("Configuración de Hero guardada correctamente")
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error("Error al guardar la configuración")
        } finally {
            setIsSavingConfig(false)
        }
    }

    const handleToggleStatus = async (id: number, currentStatus: "ACTIVO" | "INACTIVO") => {
        try {
            await BannersService.toggleStatus(id, currentStatus)
            toast.success(
                currentStatus === "ACTIVO"
                    ? "Banner desactivado correctamente"
                    : "Banner activado correctamente"
            )
            fetchBanners()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar este banner?")) return;
        try {
            await BannersService.deleteBanner(id)
            toast.success("Banner eliminado correctamente")
            fetchBanners()
        } catch (error) {
            console.error('Error deleting banner:', error)
            toast.error("No se pudo eliminar el banner")
        }
    }

    const handleBannerAdded = () => {
        fetchBanners()
        setOpenAdd(false)
    }

    const handleEditBanner = (banner: Banner) => {
        setSelectedBanner(banner)
        setOpenUpdate(true)
    }

    const handleBannerUpdated = () => {
        fetchBanners()
    }

    const handleRefresh = () => {
        fetchBanners();
        fetchConfig();
    }

    const actionButtons = isReadOnlyRole ? [] : [
        {
            label: "Nuevo Banner",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    const filteredBanners = banners.filter(b => {
        if (statusFilter && b.status !== statusFilter) return false;
        if (listFilter && b.list_type !== listFilter) return false;
        return true;
    });

    const filters = (
        <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Lista:</span>
                <Dropdown.DropdownMenu>
                    <Dropdown.DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-between">
                            {listFilter === "A" ? "Lista A" : listFilter === "B" ? "Lista B" : "Todas"}
                            <Icon.ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </Dropdown.DropdownMenuTrigger>
                    <Dropdown.DropdownMenuContent align="start">
                        <Dropdown.DropdownMenuItem onClick={() => setListFilter("")}>Todas</Dropdown.DropdownMenuItem>
                        <Dropdown.DropdownMenuItem onClick={() => setListFilter("A")}>Lista A</Dropdown.DropdownMenuItem>
                        <Dropdown.DropdownMenuItem onClick={() => setListFilter("B")}>Lista B</Dropdown.DropdownMenuItem>
                    </Dropdown.DropdownMenuContent>
                </Dropdown.DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Dropdown.DropdownMenu>
                    <Dropdown.DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-between">
                            {statusFilter === "ACTIVO" ? "Activo" : statusFilter === "INACTIVO" ? "Inactivo" : "Todos"}
                            <Icon.ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </Dropdown.DropdownMenuTrigger>
                    <Dropdown.DropdownMenuContent align="start">
                        <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("")}>Todos</Dropdown.DropdownMenuItem>
                        <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("ACTIVO")}>Activo</Dropdown.DropdownMenuItem>
                        <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("INACTIVO")}>Inactivo</Dropdown.DropdownMenuItem>
                    </Dropdown.DropdownMenuContent>
                </Dropdown.DropdownMenu>
            </div>
            {(statusFilter || listFilter) && (
                <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(""); setListFilter(""); }} className="h-9">
                    <Icon.X className="mr-2 h-4 w-4" /> Limpiar
                </Button>
            )}
        </div>
    )

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Banners Hero"
                description="Gestión de banners para el Hero principal. Configura las listas A (Fijos) y B (Aleatorios)."
                actionButtons={actionButtons}
                filters={filters}
                showRefreshButton={true}
                onRefresh={handleRefresh}
            />

            {!isReadOnlyRole && (
                <Card.Card className="p-4 bg-muted/30">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-1">
                            <Label htmlFor="countA">Mostrar N de Lista A</Label>
                            <Input 
                                id="countA" 
                                type="number" 
                                value={countA} 
                                onChange={(e) => setCountA(e.target.value)} 
                                className="w-32 bg-background"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="countB">Mostrar N de Lista B</Label>
                            <Input 
                                id="countB" 
                                type="number" 
                                value={countB} 
                                onChange={(e) => setCountB(e.target.value)} 
                                className="w-32 bg-background"
                            />
                        </div>
                        <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
                            {isSavingConfig ? <Icon.Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> : <Icon.SaveIcon className="h-4 w-4 mr-2" />}
                            Guardar Configuración
                        </Button>
                        <div className="text-sm text-muted-foreground ml-auto md:max-w-xs">
                            * Lista A muestra los primeros N banners activos según su orden. Lista B muestra N banners al azar.
                        </div>
                    </div>
                </Card.Card>
            )}

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Imagen</Table.TableHead>
                            <Table.TableHead>Lista</Table.TableHead>
                            <Table.TableHead>Orden</Table.TableHead>
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
                        ) : filteredBanners.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={6} className="text-center py-8">
                                    No se encontraron banners
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredBanners.map((banner) => (
                                <Table.TableRow key={banner.id}>
                                    <Table.TableCell>{banner.id}</Table.TableCell>
                                    <Table.TableCell>
                                        <div className="w-24 h-12 bg-muted rounded overflow-hidden flex items-center justify-center relative">
                                            <img src={process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') + banner.image_url : banner.image_url} alt="Banner" className="max-w-full max-h-full object-cover" />
                                        </div>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <span className="font-semibold">{banner.list_type}</span>
                                    </Table.TableCell>
                                    <Table.TableCell>{banner.list_type === 'A' ? banner.order : '-'}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={banner.status === "ACTIVO" ? "active" : "inactive"}>
                                            {banner.status === "ACTIVO" ? "Activo" : "Inactivo"}
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
                                                {!isReadOnlyRole && (
                                                    <>
                                                        <Dropdown.DropdownMenuItem onClick={() => handleEditBanner(banner)}>
                                                            <Icon.PencilIcon className="h-4 w-4 mr-2" /> Editar
                                                        </Dropdown.DropdownMenuItem>
                                                        <Dropdown.DropdownMenuSeparator />
                                                        {banner.status === "ACTIVO" ? (
                                                            <Dropdown.DropdownMenuItem variant="destructive" onClick={() => handleToggleStatus(banner.id, banner.status)}>
                                                                <Icon.BanIcon className="h-4 w-4 mr-2" /> Desactivar
                                                            </Dropdown.DropdownMenuItem>
                                                        ) : (
                                                            <Dropdown.DropdownMenuItem onClick={() => handleToggleStatus(banner.id, banner.status)}>
                                                                <Icon.CheckIcon className="h-4 w-4 mr-2" /> Activar
                                                            </Dropdown.DropdownMenuItem>
                                                        )}
                                                        <Dropdown.DropdownMenuItem variant="destructive" onClick={() => handleDelete(banner.id)}>
                                                            <Icon.Trash2Icon className="h-4 w-4 mr-2" /> Eliminar
                                                        </Dropdown.DropdownMenuItem>
                                                    </>
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

            <AddBannerModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleBannerAdded}
            />

            <UpdateBannerModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                banner={selectedBanner}
                onSuccess={handleBannerUpdated}
            />
        </div>
    )
}
