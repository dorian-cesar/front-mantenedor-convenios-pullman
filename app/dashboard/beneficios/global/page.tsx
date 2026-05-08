"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { formatRut } from "@/utils/helpers"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import * as Dropdown from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

import UpdateBeneficiarioDinamicoModal from "@/components/modals/update-beneficiario-dinamico"
import DetailsBeneficiarioDinamicoModal from "@/components/modals/details-beneficiario-dinamico"
import RechazarModal from "@/components/modals/rechazar"
import { BeneficiariosService, type Beneficiario } from "@/services/beneficiarios.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { CategoriasService, type Categoria } from "@/services/categoria.service"

export default function BusquedaGlobalBeneficiariosPage() {
    const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Filtros
    const [searchValue, setSearchValue] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [idFilter, setIdFilter] = useState("")
    const [rutFilter, setRutFilter] = useState("")
    const [emailFilter, setEmailFilter] = useState("")

    // Listas para los combos
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])

    // Filtros Seleccionados (Array de IDs)
    const [selectedEmpresas, setSelectedEmpresas] = useState<number[]>([])
    const [selectedCategorias, setSelectedCategorias] = useState<number[]>([])
    const [openEmpresaPopover, setOpenEmpresaPopover] = useState(false)
    const [openCategoriaPopover, setOpenCategoriaPopover] = useState(false)

    const [summary, setSummary] = useState({ activo: 0, inactivo: 0, rechazado: 0, total: 0 })
    const [selectedBeneficiario, setSelectedBeneficiario] = useState<Beneficiario | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showRechazarModal, setShowRechazarModal] = useState(false)
    const { user } = useAuth()
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 300)
    const debouncedId = useDebounce(idFilter, 400)
    const debouncedRut = useDebounce(rutFilter, 400)
    const debouncedEmail = useDebounce(emailFilter, 400)

    useEffect(() => {
        // Cargar empresas y categorías al montar
        EmpresasService.getEmpresas({ limit: 1000 }).then(res => setEmpresas(res.rows || [])).catch(console.error)
        CategoriasService.getCategorias().then(res => setCategorias(Array.isArray(res) ? res : [])).catch(console.error)
    }, [])

    const fetchBeneficiarios = async () => {
        setIsLoading(true)
        try {
            const params: any = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: "id",
                order: "DESC",
            }

            if (selectedEmpresas.length > 0) params.empresa_id = selectedEmpresas.join(",")
            if (selectedCategorias.length > 0) params.categoria_id = selectedCategorias.join(",")
            if (statusFilter) params.status = statusFilter
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
            if (debouncedId.trim()) params.id = debouncedId.trim()
            if (debouncedRut.trim()) params.rut = debouncedRut.trim()
            if (debouncedEmail.trim()) params.correo = debouncedEmail.trim()

            const response = await BeneficiariosService.getBeneficiarios(params)
            const rows = response.data || []
            setBeneficiarios(rows)
            setPagination(prev => ({
                ...prev,
                total: response.total || 0,
                totalPages: response.pages || 0,
                hasNextPage: pagination.page < (response.pages || 0),
                hasPrevPage: pagination.page > 1,
            }))

            // Resumen desde el backend (global para los filtros seleccionados)
            if (response.summary) {
                setSummary(response.summary)
            } else {
                // Fallback de seguridad si el backend no envía el summary
                setSummary({
                    activo: response.total || 0,
                    inactivo: 0,
                    rechazado: 0,
                    total: response.total || 0
                })
            }
        } catch (error) {
            console.error("Error loading beneficiarios:", error)
            toast.error("No se pudieron cargar los beneficiarios")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchBeneficiarios()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        pagination.page,
        pagination.limit,
        statusFilter,
        debouncedSearch,
        debouncedId,
        debouncedRut,
        debouncedEmail,
        selectedEmpresas,
        selectedCategorias
    ])

    const handlePageChange = (newPage: number) => setPagination(prev => ({ ...prev, page: newPage }))
    const handleLimitChange = (newLimit: number) => setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))

    const toggleEmpresa = (id: number) => {
        setSelectedEmpresas(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
        setPagination(p => ({ ...p, page: 1 }))
    }

    const toggleCategoria = (id: number) => {
        setSelectedCategorias(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
        setPagination(p => ({ ...p, page: 1 }))
    }

    const clearFilters = () => {
        setSearchValue("")
        setStatusFilter("")
        setIdFilter("")
        setRutFilter("")
        setEmailFilter("")
        setSelectedEmpresas([])
        setSelectedCategorias([])
        setPagination(p => ({ ...p, page: 1 }))
    }

    const handleEdit = (b: Beneficiario) => {
        setSelectedBeneficiario(b)
        setShowUpdateModal(true)
    }

    const handleDetails = (b: Beneficiario) => {
        setSelectedBeneficiario(b)
        setShowDetailsModal(true)
    }

    const handleRechazar = (b: Beneficiario) => {
        setSelectedBeneficiario(b)
        setShowRechazarModal(true)
    }

    const handleToggleStatus = async (id: number, currentStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO") => {
        try {
            await BeneficiariosService.toggleStatus(id, currentStatus)
            toast.success(
                currentStatus === "ACTIVO" 
                    ? "Beneficiario desactivado (se notificará por correo)" 
                    : "Beneficiario activado (se notificará por correo)"
            )
            fetchBeneficiarios()
        } catch {
            toast.error("No se pudo cambiar el estado")
        }
    }

    const handleConfirmRechazo = async (motivo: string) => {
        if (!selectedBeneficiario) return
        try {
            await BeneficiariosService.rechazarBeneficiario(selectedBeneficiario.id, { 
                razon_rechazo: motivo, 
                status: "RECHAZADO" 
            })
            toast.success("Beneficiario rechazado (se notificará por correo)")
            setShowRechazarModal(false)
            fetchBeneficiarios()
        } catch {
            toast.error("No se pudo rechazar al beneficiario")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar este beneficiario? Esta acción no se puede deshacer.")) return
        try {
            await BeneficiariosService.deleteBeneficiario(id)
            toast.success("Beneficiario eliminado")
            fetchBeneficiarios()
        } catch {
            toast.error("No se pudo eliminar el beneficiario")
        }
    }

    const handleCopy = (text: string | undefined | null, label: string) => {
        if (!text) return
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`${label} copiado al portapapeles`)
        })
    }

    return (
        <div className="flex-1 space-y-6 p-8">
            <PageHeader
                title="Búsqueda Global de Beneficiarios"
                description="Busque y filtre beneficiarios a través de múltiples empresas y categorías."
            />

            <div className="grid gap-4 md:grid-cols-4">
                <Card.Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary"
                    onClick={() => { setStatusFilter(""); setPagination(p => ({ ...p, page: 1 })) }}
                >
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-medium">Total Listados</Card.CardTitle>
                        <Icon.Users className="h-4 w-4 text-muted-foreground" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold">{summary.total || pagination.total}</div>
                    </Card.CardContent>
                </Card.Card>
                <Card.Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-emerald-600"
                    onClick={() => { setStatusFilter("ACTIVO"); setPagination(p => ({ ...p, page: 1 })) }}
                >
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-medium text-emerald-600">Activos</Card.CardTitle>
                        <Icon.CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold">{summary.activo}</div>
                    </Card.CardContent>
                </Card.Card>
                <Card.Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-amber-600"
                    onClick={() => { setStatusFilter("INACTIVO"); setPagination(p => ({ ...p, page: 1 })) }}
                >
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-medium text-amber-600">Inactivos</Card.CardTitle>
                        <Icon.PauseCircle className="h-4 w-4 text-amber-600" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold">{summary.inactivo}</div>
                    </Card.CardContent>
                </Card.Card>
                <Card.Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-red-600"
                    onClick={() => { setStatusFilter("RECHAZADO"); setPagination(p => ({ ...p, page: 1 })) }}
                >
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-medium text-red-600">Rechazados</Card.CardTitle>
                        <Icon.XCircle className="h-4 w-4 text-red-600" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold">{summary.rechazado}</div>
                    </Card.CardContent>
                </Card.Card>
            </div>

            <Card.Card>
                <Card.CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Filtros Globales</h3>
                            {(searchValue || statusFilter || idFilter || rutFilter || emailFilter || selectedEmpresas.length > 0 || selectedCategorias.length > 0) && (
                                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                                    <Icon.X className="h-4 w-4 mr-2" />
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* Selector Múltiple Empresas */}
                            <Popover open={openEmpresaPopover} onOpenChange={setOpenEmpresaPopover}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {selectedEmpresas.length > 0 
                                            ? `${selectedEmpresas.length} Empresas` 
                                            : "Todas las Empresas"}
                                        <Icon.ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar empresa..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron empresas.</CommandEmpty>
                                            <CommandGroup>
                                                {empresas.map((emp) => (
                                                    <CommandItem key={emp.id} onSelect={() => toggleEmpresa(emp.id)}>
                                                        <div className={cn(
                                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                            selectedEmpresas.includes(emp.id) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                        )}>
                                                            <Icon.Check className={cn("h-4 w-4")} />
                                                        </div>
                                                        {emp.nombre}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* Selector Múltiple Categorías */}
                            <Popover open={openCategoriaPopover} onOpenChange={setOpenCategoriaPopover}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {selectedCategorias.length > 0 
                                            ? `${selectedCategorias.length} Categorías` 
                                            : "Todas las Categorías"}
                                        <Icon.ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar categoría..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                                            <CommandGroup>
                                                {categorias.map((cat) => (
                                                    <CommandItem key={cat.id} onSelect={() => toggleCategoria(cat.id)}>
                                                        <div className={cn(
                                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                            selectedCategorias.includes(cat.id) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                        )}>
                                                            <Icon.Check className={cn("h-4 w-4")} />
                                                        </div>
                                                        {cat.nombre}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination(p => ({ ...p, page: 1 })) }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los Estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Todos los estados</SelectItem>
                                    <SelectItem value="ACTIVO">Activos</SelectItem>
                                    <SelectItem value="INACTIVO">Inactivos</SelectItem>
                                    <SelectItem value="RECHAZADO">Rechazados</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="ID Beneficiario"
                                value={idFilter}
                                onChange={(e) => { setIdFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                            />
                        </div>

                        {/* Fila de búsquedas de texto */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                            <div className="relative">
                                <Icon.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre..."
                                    className="pl-8"
                                    value={searchValue}
                                    onChange={(e) => { setSearchValue(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                                />
                            </div>
                            <div className="relative">
                                <Icon.UserCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por RUT..."
                                    className="pl-8"
                                    value={rutFilter}
                                    onChange={(e) => { setRutFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                                />
                            </div>
                            <div className="relative md:col-span-2">
                                <Icon.Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por correo electrónico..."
                                    className="pl-8"
                                    value={emailFilter}
                                    onChange={(e) => { setEmailFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                                />
                            </div>
                        </div>
                    </div>
                </Card.CardContent>
            </Card.Card>

            <Card.Card>
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resultados</h3>
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        limit={pagination.limit}
                        hasPrevPage={pagination.hasPrevPage}
                        hasNextPage={pagination.hasNextPage}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                    />
                </div>
                <div className="rounded-md border-x">
                    <Table.Table>
                        <Table.TableHeader>
                            <Table.TableRow>
                                <Table.TableHead>ID</Table.TableHead>
                                <Table.TableHead>Convenio</Table.TableHead>
                                <Table.TableHead>Categoría</Table.TableHead>
                                <Table.TableHead>Beneficiario</Table.TableHead>
                                <Table.TableHead>Contacto</Table.TableHead>
                                <Table.TableHead>Estado</Table.TableHead>
                                <Table.TableHead className="text-right">Acciones</Table.TableHead>
                            </Table.TableRow>
                        </Table.TableHeader>
                        <Table.TableBody>
                            {isLoading ? (
                                <Table.TableRow>
                                    <Table.TableCell colSpan={7} className="h-24 text-center">
                                        <div className="flex items-center justify-center">
                                            <Icon.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    </Table.TableCell>
                                </Table.TableRow>
                            ) : beneficiarios.length === 0 ? (
                                <Table.TableRow>
                                    <Table.TableCell colSpan={7} className="h-24 text-center">
                                        No se encontraron beneficiarios.
                                    </Table.TableCell>
                                </Table.TableRow>
                            ) : (
                                beneficiarios.map((beneficiario: any) => (
                                    <Table.TableRow key={beneficiario.id}>
                                        <Table.TableCell className="font-medium text-muted-foreground">
                                            <span
                                                className="cursor-pointer hover:text-foreground transition-colors"
                                                title="Copiar ID"
                                                onClick={() => handleCopy(String(beneficiario.id), "ID")}
                                            >
                                                #{beneficiario.id}
                                            </span>
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <div className="font-medium">{beneficiario.convenio_nombre}</div>
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {beneficiario.categoria_nombre || "Sin Categoría"}
                                            </div>
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <div
                                                className="font-medium cursor-pointer hover:text-primary transition-colors group flex items-center gap-1"
                                                onClick={() => handleCopy(beneficiario.nombre, "Nombre")}
                                                title="Copiar nombre"
                                            >
                                                {beneficiario.nombre}
                                                <Icon.Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                            </div>
                                            <div
                                                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors group flex items-center gap-1"
                                                onClick={() => handleCopy(beneficiario.rut, "RUT")}
                                                title="Copiar RUT"
                                            >
                                                {formatRut(beneficiario.rut)}
                                                <Icon.Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                            </div>
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <div className="text-sm">
                                                {beneficiario.correo && (
                                                    <div
                                                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors group"
                                                        onClick={() => handleCopy(beneficiario.correo, "Correo")}
                                                        title="Copiar correo"
                                                    >
                                                        <Icon.Mail className="h-3 w-3" />
                                                        {beneficiario.correo}
                                                        <Icon.Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                                    </div>
                                                )}
                                                {beneficiario.telefono && (
                                                    <div
                                                        className="flex items-center gap-1 mt-1 cursor-pointer hover:text-primary transition-colors group"
                                                        onClick={() => handleCopy(beneficiario.telefono, "Teléfono")}
                                                        title="Copiar teléfono"
                                                    >
                                                        <Icon.Phone className="h-3 w-3" />
                                                        {beneficiario.telefono}
                                                        <Icon.Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                                    </div>
                                                )}
                                            </div>
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <BadgeStatus status={beneficiario.status}>
                                                {beneficiario.status === "ACTIVO" ? "Activo" : beneficiario.status === "RECHAZADO" ? "Rechazado" : "Inactivo"}
                                            </BadgeStatus>
                                        </Table.TableCell>
                                        <Table.TableCell className="text-right">
                                            <Dropdown.DropdownMenu>
                                                <Dropdown.DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Icon.MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </Dropdown.DropdownMenuTrigger>
                                                <Dropdown.DropdownMenuContent align="end">
                                                    <Dropdown.DropdownMenuItem onClick={() => handleDetails(beneficiario)}>
                                                        <Icon.Eye className="mr-2 h-4 w-4" />
                                                        Ver detalles
                                                    </Dropdown.DropdownMenuItem>
                                                    <Dropdown.DropdownMenuItem onClick={() => handleEdit(beneficiario)}>
                                                        <Icon.Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </Dropdown.DropdownMenuItem>
                                                    <Dropdown.DropdownMenuSeparator />
                                                    {beneficiario.status === "ACTIVO" ? (
                                                        <Dropdown.DropdownMenuItem 
                                                            variant="destructive"
                                                            onClick={() => handleToggleStatus(beneficiario.id, "ACTIVO")}
                                                        >
                                                            <Icon.Ban className="mr-2 h-4 w-4" />
                                                            Desactivar
                                                        </Dropdown.DropdownMenuItem>
                                                    ) : (
                                                        <>
                                                            <Dropdown.DropdownMenuItem onClick={() => handleToggleStatus(beneficiario.id, beneficiario.status)}>
                                                                <Icon.CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Activar
                                                            </Dropdown.DropdownMenuItem>
                                                            {beneficiario.status !== "RECHAZADO" && (
                                                                <Dropdown.DropdownMenuItem 
                                                                    variant="destructive"
                                                                    onClick={() => handleRechazar(beneficiario)}
                                                                >
                                                                    <Icon.XCircle className="mr-2 h-4 w-4" />
                                                                    Rechazar
                                                                </Dropdown.DropdownMenuItem>
                                                            )}
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
                </div>

            </Card.Card>

            {selectedBeneficiario && (
                <UpdateBeneficiarioDinamicoModal 
                    open={showUpdateModal} 
                    onOpenChange={setShowUpdateModal} 
                    onSuccess={fetchBeneficiarios} 
                    beneficiario={selectedBeneficiario} 
                />
            )}

            {selectedBeneficiario && (
                <DetailsBeneficiarioDinamicoModal
                    open={showDetailsModal}
                    onOpenChange={setShowDetailsModal}
                    beneficiario={selectedBeneficiario}
                    onToggleStatus={handleToggleStatus}
                    onRechazar={handleRechazar}
                />
            )}

            {selectedBeneficiario && (
                <RechazarModal 
                    open={showRechazarModal} 
                    onOpenChange={setShowRechazarModal} 
                    onSubmit={handleConfirmRechazo} 
                />
            )}
        </div>
    )
}
