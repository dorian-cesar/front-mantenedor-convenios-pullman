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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

import DetailsBeneficiarioDinamicoModal from "@/components/modals/details-beneficiario-dinamico"
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

    const [summary, setSummary] = useState({ activo: 0, inactivo: 0, rechazado: 0 })
    const [selectedBeneficiario, setSelectedBeneficiario] = useState<Beneficiario | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
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
        CategoriasService.getCategorias({ limit: 1000 } as any).then(res => setCategorias(Array.isArray(res) ? res : [])).catch(console.error)
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

            // Resumen local
            setSummary({
                activo: rows.filter((b: any) => b.status === "ACTIVO").length,
                inactivo: rows.filter((b: any) => b.status === "INACTIVO").length,
                rechazado: rows.filter((b: any) => b.status === "RECHAZADO").length,
            })
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

    return (
        <div className="flex-1 space-y-6 p-8">
            <PageHeader
                title="Búsqueda Global de Beneficiarios"
                description="Busque y filtre beneficiarios a través de múltiples empresas y categorías."
            />

            <div className="grid gap-4 md:grid-cols-4">
                <Card.Card>
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-medium">Total Listados</Card.CardTitle>
                        <Icon.Users className="h-4 w-4 text-muted-foreground" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold">{beneficiarios.length}</div>
                    </Card.CardContent>
                </Card.Card>
                <Card.Card>
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-medium text-emerald-600">Activos</Card.CardTitle>
                        <Icon.CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold">{summary.activo}</div>
                    </Card.CardContent>
                </Card.Card>
                <Card.Card>
                    <Card.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Card.CardTitle className="text-sm font-medium text-amber-600">Inactivos</Card.CardTitle>
                        <Icon.PauseCircle className="h-4 w-4 text-amber-600" />
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="text-2xl font-bold">{summary.inactivo}</div>
                    </Card.CardContent>
                </Card.Card>
                <Card.Card>
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
                <div className="rounded-md border">
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
                                            #{beneficiario.id}
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <div className="font-medium">{beneficiario.convenio_nombre}</div>
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {categorias.find(c => c.id === beneficiario.categoria_id)?.nombre || "Sin Categoría"}
                                            </div>
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <div className="font-medium">{beneficiario.nombre}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatRut(beneficiario.rut)}
                                            </div>
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <div className="text-sm">
                                                {beneficiario.correo && (
                                                    <div className="flex items-center gap-2">
                                                        <Icon.Mail className="h-3 w-3" />
                                                        {beneficiario.correo}
                                                    </div>
                                                )}
                                                {beneficiario.telefono && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Icon.Phone className="h-3 w-3" />
                                                        {beneficiario.telefono}
                                                    </div>
                                                )}
                                            </div>
                                        </Table.TableCell>
                                        <Table.TableCell>
                                            <BadgeStatus status={beneficiario.status} />
                                        </Table.TableCell>
                                        <Table.TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedBeneficiario(beneficiario)
                                                    setShowDetailsModal(true)
                                                }}
                                                title="Ver Detalles"
                                            >
                                                <Icon.Eye className="h-4 w-4" />
                                            </Button>
                                        </Table.TableCell>
                                    </Table.TableRow>
                                ))
                            )}
                        </Table.TableBody>
                    </Table.Table>
                </div>
                <div className="p-4 border-t">
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        limit={pagination.limit}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                    />
                </div>
            </Card.Card>

            {selectedBeneficiario && (
                <DetailsBeneficiarioDinamicoModal
                    open={showDetailsModal}
                    onOpenChange={setShowDetailsModal}
                    beneficiario={selectedBeneficiario}
                />
            )}
        </div>
    )
}
