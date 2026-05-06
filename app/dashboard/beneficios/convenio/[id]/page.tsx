"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import { ConveniosService, type Convenio } from "@/services/convenio.service"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { formatRut } from "@/utils/helpers"
import { useAuth } from "@/hooks/useAuth"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import AddBeneficiarioDinamicoModal from "@/components/modals/add-beneficiario-dinamico"
import UpdateBeneficiarioDinamicoModal from "@/components/modals/update-beneficiario-dinamico"
import DetailsBeneficiarioDinamicoModal from "@/components/modals/details-beneficiario-dinamico"
import RechazarModal from "@/components/modals/rechazar"
import { BeneficiariosService, type Beneficiario } from "@/services/beneficiarios.service"

interface BeneficiariosResponse {
    totalItems: number
    rows: Beneficiario[]
    totalPages?: number
    currentPage?: number
}

export default function BeneficiariosConvenioPage() {
    const params = useParams()
    const router = useRouter()
    const convenioId = Number(params.id)
    const { user } = useAuth()

    const [convenio, setConvenio] = useState<Convenio | null>(null)
    const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [idFilter, setIdFilter] = useState("")
    const [rutFilter, setRutFilter] = useState("")
    const [emailFilter, setEmailFilter] = useState("")
    const [summary, setSummary] = useState({ activo: 0, inactivo: 0, rechazado: 0 })
    const [selectedBeneficiario, setSelectedBeneficiario] = useState<Beneficiario | null>(null)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showRechazarModal, setShowRechazarModal] = useState(false)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const normalizeString = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const debouncedSearch = useDebounce(searchValue, 300)

    // Fetch convenio details
    useEffect(() => {
        if (!convenioId) return
        ConveniosService.getConvenioById(convenioId)
            .then(setConvenio)
            .catch(() => toast.error("No se pudo cargar el convenio"))
    }, [convenioId])

    // Fetch beneficiarios
    const fetchBeneficiarios = async () => {
        if (!convenioId) return
        setIsLoading(true)
        try {
            const params: any = {
                convenio_id: convenioId,
                page: pagination.page,
                limit: pagination.limit,
                sortBy: "id",
                order: "DESC",
            }
            if (statusFilter) params.status = statusFilter
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
            if (idFilter.trim()) params.id = idFilter.trim()
            if (rutFilter.trim()) params.rut = rutFilter.trim()
            if (emailFilter.trim()) params.email = emailFilter.trim()

            const response = await api.get<any>("/beneficiarios", { params })
            const data = response.data

            setBeneficiarios(data.data || [])
            setPagination(prev => ({
                ...prev,
                total: data.total ?? 0,
                totalPages: data.pages || 1,
                hasPrevPage: (data.currentPage || 1) > 1,
                hasNextPage: (data.currentPage || 1) < (data.pages || 1),
            }))

            // Summary
            const [active, inactive, rejected] = await Promise.all([
                api.get<any>("/beneficiarios", { params: { convenio_id: convenioId, status: "ACTIVO", limit: 1 } }),
                api.get<any>("/beneficiarios", { params: { convenio_id: convenioId, status: "INACTIVO", limit: 1 } }),
                api.get<any>("/beneficiarios", { params: { convenio_id: convenioId, status: "RECHAZADO", limit: 1 } }),
            ])
            setSummary({
                activo: active.data.total ?? 0,
                inactivo: inactive.data.total ?? 0,
                rechazado: rejected.data.total ?? 0,
            })
        } catch {
            toast.error("No se pudieron cargar los beneficiarios")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchBeneficiarios()
    }, [convenioId, pagination.page, pagination.limit, debouncedSearch, statusFilter, idFilter, rutFilter, emailFilter])

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado`, { duration: 2000 })
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

    const filteredBeneficiarios = beneficiarios.filter(b => {
        if (!searchValue.trim()) return true;

        const cleanRutStr = (r: string) => r?.replace(/[^0-9kK]/g, "").toLowerCase() || "";
        const searchTerms = normalizeString(searchValue).split(/\s+/).filter(Boolean);

        const idString = b.id ? b.id.toString() : "";
        const nombreNorm = b.nombre ? normalizeString(b.nombre) : "";
        const rutClean = cleanRutStr(b.rut || "");
        const correoNorm = b.correo ? normalizeString(b.correo) : "";

        return searchTerms.every(term => {
            const termClean = cleanRutStr(term);
            return (
                idString.includes(term) ||
                nombreNorm.includes(term) ||
                (termClean !== "" && rutClean.includes(termClean)) ||
                correoNorm.includes(term)
            );
        });
    });

    const filters = (
        <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium whitespace-nowrap text-muted-foreground border-r pr-2 mr-1">Status:</span>
                    <Dropdown.DropdownMenu>
                        <Dropdown.DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 min-w-[120px] justify-between shadow-sm">
                                {statusFilter === "ACTIVO" ? "Activo" : statusFilter === "INACTIVO" ? "Inactivo" : statusFilter === "RECHAZADO" ? "Rechazado" : "Todos"}
                                <Icon.ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </Dropdown.DropdownMenuTrigger>
                        <Dropdown.DropdownMenuContent align="start">
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("")}>Todos</Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("ACTIVO")}>Activo</Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("INACTIVO")}>Inactivo</Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("RECHAZADO")}>Rechazado</Dropdown.DropdownMenuItem>
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground border-r pr-2">ID:</span>
                    <Input
                        placeholder="Buscar por ID..."
                        value={idFilter}
                        onChange={(e) => setIdFilter(e.target.value)}
                        className="h-9 w-[140px] shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground border-r pr-2">RUT:</span>
                    <Input
                        placeholder="12.345.678-9"
                        value={rutFilter}
                        onChange={(e) => setRutFilter(formatRut(e.target.value))}
                        className="h-9 w-[160px] shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground border-r pr-2">Email:</span>
                    <Input
                        placeholder="ejemplo@correo.com"
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value)}
                        className="h-9 w-[200px] shadow-sm"
                    />
                </div>

                {(statusFilter || idFilter || rutFilter || emailFilter) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setStatusFilter("")
                            setIdFilter("")
                            setRutFilter("")
                            setEmailFilter("")
                        }}
                        className="h-9 text-muted-foreground hover:text-foreground"
                    >
                        <Icon.X className="mr-2 h-4 w-4" />
                        Limpiar Filtros
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
                <BadgeStatus
                    status="active"
                    className={`h-9 px-4 text-sm font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-all border shadow-sm ${statusFilter === "ACTIVO" ? "ring-2 ring-primary ring-offset-2 border-primary" : "bg-green-50 text-green-700 border-green-200"}`}
                    onClick={() => setStatusFilter(statusFilter === "ACTIVO" ? "" : "ACTIVO")}
                >
                    <Icon.CheckCircle2 className="mr-2 h-4 w-4" />
                    Activos: {summary.activo}
                </BadgeStatus>
                <BadgeStatus
                    status="inactive"
                    className={`h-9 px-4 text-sm font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-all border shadow-sm ${statusFilter === "INACTIVO" ? "ring-2 ring-primary ring-offset-2 border-primary" : "bg-red-50 text-red-700 border-red-200"}`}
                    onClick={() => setStatusFilter(statusFilter === "INACTIVO" ? "" : "INACTIVO")}
                >
                    <Icon.XCircle className="mr-2 h-4 w-4" />
                    Inactivos: {summary.inactivo}
                </BadgeStatus>
                <BadgeStatus
                    status="inactive"
                    className={`h-9 px-4 text-sm font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-all border shadow-sm ${statusFilter === "RECHAZADO" ? "ring-2 ring-primary ring-offset-2 border-primary" : "bg-orange-50 text-orange-700 border-orange-200"}`}
                    onClick={() => setStatusFilter(statusFilter === "RECHAZADO" ? "" : "RECHAZADO")}
                >
                    <Icon.AlertCircle className="mr-2 h-4 w-4" />
                    Rechazados: {summary.rechazado}
                </BadgeStatus>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title={convenio ? convenio.nombre : "Beneficiarios"}
                description={
                    convenio
                        ? `Beneficiarios del convenio · ${convenio.empresa?.nombre || ""}`
                        : "Cargando convenio..."
                }
                actionButtons={[
                    {
                        label: "Nuevo Beneficiario",
                        icon: <Icon.Plus className="mr-2 h-4 w-4" />,
                        onClick: () => {
                            if (convenio) setShowAddModal(true)
                        }
                    }
                ]}
                showSearch={true}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onSearchClear={() => setSearchValue("")}
                filters={filters}
                showPagination={true}
                paginationComponent={
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                        hasPrevPage={pagination.hasPrevPage}
                        hasNextPage={pagination.hasNextPage}
                        className="w-full"
                        limit={pagination.limit}
                        onLimitChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))}
                    />
                }
                showRefreshButton={true}
                onRefresh={fetchBeneficiarios}
            />

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>RUT</Table.TableHead>
                            <Table.TableHead>Correo</Table.TableHead>
                            <Table.TableHead>Teléfono</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : filteredBeneficiarios.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No se encontraron beneficiarios que coincidan con la búsqueda
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredBeneficiarios.map((b) => (
                                <Table.TableRow key={b.id}>
                                    <Table.TableCell>
                                        <span className="font-mono text-[10px] text-muted-foreground">{b.id}</span>
                                    </Table.TableCell>
                                    <Table.TableCell className="font-medium text-sm">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span
                                                        className="cursor-pointer hover:text-primary transition-colors hover:underline underline-offset-4"
                                                        onClick={() => handleCopy(b.nombre, "Nombre")}
                                                    >
                                                        {b.nombre}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>Clic para copiar</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span
                                                        className="cursor-pointer hover:text-primary hover:underline underline-offset-4"
                                                        onClick={() => handleCopy(b.rut, "RUT")}
                                                    >
                                                        {formatRut(b.rut)}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>Clic para copiar RUT</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-sm text-muted-foreground">
                                        {b.correo || "-"}
                                    </Table.TableCell>
                                    <Table.TableCell className="text-sm text-muted-foreground">
                                        {b.telefono || "-"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={b.status === "ACTIVO" ? "active" : "inactive"}>
                                            {b.status === "ACTIVO" ? "Activo" : b.status === "RECHAZADO" ? "Rechazado" : "Inactivo"}
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
                                                 <Dropdown.DropdownMenuItem onClick={() => handleDetails(b)}>
                                                     <Icon.Eye className="mr-2 h-4 w-4" />
                                                     Ver detalles
                                                 </Dropdown.DropdownMenuItem>
                                                 <Dropdown.DropdownMenuItem onClick={() => handleEdit(b)}>
                                                     <Icon.Pencil className="mr-2 h-4 w-4" />
                                                     Editar
                                                 </Dropdown.DropdownMenuItem>
                                                 <Dropdown.DropdownMenuSeparator />
                                                 {b.status === "ACTIVO" ? (
                                                     <Dropdown.DropdownMenuItem 
                                                         variant="destructive"
                                                         onClick={() => handleToggleStatus(b.id, "ACTIVO")}
                                                     >
                                                         <Icon.Ban className="mr-2 h-4 w-4" />
                                                         Desactivar
                                                     </Dropdown.DropdownMenuItem>
                                                 ) : (
                                                     <>
                                                         <Dropdown.DropdownMenuItem onClick={() => handleToggleStatus(b.id, b.status)}>
                                                             <Icon.CheckCircle2 className="mr-2 h-4 w-4" />
                                                             Activar
                                                         </Dropdown.DropdownMenuItem>
                                                         {b.status !== "RECHAZADO" && (
                                                             <Dropdown.DropdownMenuItem 
                                                                 variant="destructive"
                                                                 onClick={() => handleRechazar(b)}
                                                             >
                                                                 <Icon.XCircle className="mr-2 h-4 w-4" />
                                                                 Rechazar
                                                             </Dropdown.DropdownMenuItem>
                                                         )}
                                                     </>
                                                 )}
                                                 {user?.rol === "SUPER_USUARIO" && (
                                                     <>
                                                         <Dropdown.DropdownMenuSeparator />
                                                         <Dropdown.DropdownMenuItem 
                                                             variant="destructive"
                                                             onClick={() => handleDelete(b.id)}
                                                         >
                                                             <Icon.Trash2 className="mr-2 h-4 w-4" />
                                                             Eliminar
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

            {convenio && (
                <AddBeneficiarioDinamicoModal 
                    open={showAddModal} 
                    onOpenChange={setShowAddModal} 
                    onSuccess={fetchBeneficiarios} 
                    convenio={convenio} 
                />
            )}

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
