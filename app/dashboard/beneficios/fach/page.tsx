"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import ExportModal from "@/components/modals/export"
import AddFachModal from "@/components/modals/add-fach"
import UpdateFachModal from "@/components/modals/update-fach"
import DetailsFachModal from "@/components/modals/details-fach"

import { FachService, type Fach, type GetFachParams } from "@/services/fach.service"
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { formatRut } from "@/utils/helpers"
import { exportToCSV } from "@/utils/exportCSV"
import { exportToExcel } from "@/utils/exportXLSX"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/useAuth"
import { useConvenios } from "@/hooks/use-convenios"

export default function FachPage() {
    const [searchValue, setSearchValue] = useState("")
    const [fachList, setFachList] = useState<Fach[]>([])
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedFach, setSelectedFach] = useState<Fach | null>(null)
    const [idFilter, setIdFilter] = useState("")
    const [rutFilter, setRutFilter] = useState("")
    const [emailFilter, setEmailFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("")
    const { convenioMap } = useConvenios()
    const { user } = useAuth()
    const [summary, setSummary] = useState({ activo: 0, inactivo: 0, rechazado: 0 })

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    const debouncedSearch = useDebounce(searchValue, 300)
    const normalizeString = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const debouncedId = useDebounce(idFilter, 500)
    const debouncedRut = useDebounce(rutFilter, 500)
    const debouncedEmail = useDebounce(emailFilter, 500)

    const fetchEmpresas = async () => {
        try {
            const response = await EmpresasService.getEmpresas({ limit: 100 })
            setEmpresas(response.rows)
        } catch (error) {
            console.error('Error fetching empresas:', error)
        }
    }

    const fetchSummary = async () => {
        try {
            const params: any = {}
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
            if (debouncedId.trim()) params.id = debouncedId.trim()
            if (debouncedRut.trim()) params.rut = debouncedRut.trim().replace(/\./g, '')
            if (debouncedEmail.trim()) params.correo = debouncedEmail.trim()

            const [activeRes, inactiveRes, rejectedRes] = await Promise.all([
                FachService.getFach({ ...params, status: 'ACTIVO', limit: 1 }),
                FachService.getFach({ ...params, status: 'INACTIVO', limit: 1 }),
                FachService.getFach({ ...params, status: 'RECHAZADO', limit: 1 })
            ]);

            setSummary({
                activo: Number(activeRes?.totalItems ?? (activeRes as any)?.total ?? 0),
                inactivo: Number(inactiveRes?.totalItems ?? (inactiveRes as any)?.total ?? 0),
                rechazado: Number(rejectedRes?.totalItems ?? (rejectedRes as any)?.total ?? 0)
            });
        } catch (error) {
            console.error('Error fetching summary:', error)
        }
    }

    const fetchFach = async () => {
        setIsLoading(true)
        try {
            const params: GetFachParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: 'id',
                order: 'DESC',
            }

            if (statusFilter) {
                params.status = statusFilter as any
            }

            const searchTerm = debouncedSearch.trim()
            if (searchTerm) {
                params.search = searchTerm
            }

            if (debouncedId.trim()) params.id = debouncedId.trim()
            if (debouncedRut.trim()) params.rut = debouncedRut.trim().replace(/\./g, '')
            if (debouncedEmail.trim()) params.correo = debouncedEmail.trim()

            const response = await FachService.getFach(params)

            setFachList(response.rows || (response as any).data || [])

            setPagination(prev => ({
                ...prev,
                total: response.totalItems ?? (response as any).total ?? 0,
                totalPages: response.totalPages || (response as any).pages || 1,
                hasPrevPage: (response.currentPage || (response as any).currentPage || 1) > 1,
                hasNextPage: (response.currentPage || (response as any).currentPage || 1) < (response.totalPages || (response as any).pages || 1)
            }))

            // Actualizar resumen
            fetchSummary()
        } catch (error) {
            console.error('Error fetching fach:', error)
            toast.error("No se pudieron cargar los registros")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmpresas()
    }, [])

    useEffect(() => {
        fetchFach()
    }, [pagination.page, pagination.limit, debouncedSearch, debouncedId, debouncedRut, debouncedEmail, statusFilter])

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

    const handleToggleStatus = async (
        id: number,
        currentStatus: "ACTIVO" | "INACTIVO"
    ) => {
        try {
            await FachService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Registro desactivado correctamente"
                    : "Registro activado correctamente"
            )

            fetchFach()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleFachAdded = () => {
        fetchFach()
        setOpenAdd(false)
    }

    const handleEditFach = async (fach: Fach) => {
        try {
            const fullData = await FachService.getFachById(fach.id)
            setSelectedFach(fullData)
            setOpenUpdate(true)
        } catch (error) {
            console.error('Error fetching fach for edit:', error)
            toast.error("No se pudo cargar el registro para editar")
        }
    }

    const handleFachUpdated = () => {
        fetchFach()
        setOpenUpdate(false)
    }

    const handleDetailsFach = async (fach: Fach) => {
        try {
            const fullData = await FachService.getFachById(fach.id)
            setSelectedFach(fullData)
            setOpenDetails(true)
        } catch (error) {
            console.error('Error fetching fach details:', error)
            toast.error("No se pudieron cargar los detalles del registro")
        }
    }

    const handleRefresh = () => {
        fetchFach();
    }

    const handleCopyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} ${text} copiado al portapapeles`, {
            icon: <Icon.Copy className="h-4 w-4" />,
            duration: 2000
        })
    }

    const handleExport = async (type: "csv" | "excel") => {
        try {
            toast.loading("Preparando exportación...", { id: "export" })

            const params: GetFachParams = {
                sortBy: "id",
                order: "DESC",
            }

            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim()
            }

            const response = await FachService.getFach(params)

            if (!response.rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = response.rows.map(fach => ({
                Nombre: fach.nombre_completo,
                Empresa: fach.empresa.nombre,
                Estado: fach.status,
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "fach.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "fach.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }
        } catch (error) {
            console.error('Error exporting fach:', error)
            toast.error("No se pudo exportar los registros")
        }
    }

    const actionButtons = user?.rol === "USUARIO" ? [] : [
        {
            label: "Nuevo Fach",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    // Client-side filtering for immediate feedback
    const filteredFach = fachList.filter(f => {
        if (!searchValue.trim() && !idFilter.trim() && !rutFilter.trim() && !emailFilter.trim()) return true;

        const cleanRut = (r: string) => r?.replace(/[^0-9kK]/g, "").toLowerCase() || "";
        const searchTerms = normalizeString(searchValue).split(/\s+/).filter(Boolean);
        
        const fId = f.id?.toString() || ""
        const fRutClean = cleanRut(f.rut || "")
        const fRutRaw = normalizeString(f.rut || "")
        const fEmail = normalizeString(f.correo || "")
        const fNombre = normalizeString(f.nombre_completo || (f as any).nombre || "")
        const fStatus = f.status === "ACTIVO" ? "activo" : f.status === "INACTIVO" ? "inactivo" : ""
        const fConvenio = normalizeString(f.convenio?.nombre || "")
        const fEmpresaNombre = normalizeString(f.empresa?.nombre || "")
        const fEmpresaRutClean = cleanRut(f.empresa?.rut_empresa || "")
        const fEmpresaRutRaw = normalizeString(f.empresa?.rut_empresa || "")

        const matchesGlobal = searchTerms.length === 0 || searchTerms.every(term => {
            const termClean = cleanRut(term);
            return (
                fId.includes(term) ||
                fNombre.includes(term) ||
                fRutRaw.includes(term) ||
                (termClean !== "" && fRutClean.includes(termClean)) ||
                fEmail.includes(term) ||
                fStatus.includes(term) ||
                fConvenio.includes(term) ||
                fEmpresaNombre.includes(term) ||
                fEmpresaRutRaw.includes(term) ||
                (termClean !== "" && fEmpresaRutClean.includes(termClean))
            );
        });

        const idLower = idFilter.trim().toLowerCase();
        const rutFilterClean = cleanRut(rutFilter);
        const emailLower = emailFilter.trim().toLowerCase();

        return (
            matchesGlobal &&
            (idFilter.trim() === "" || fId.includes(idLower)) &&
            (rutFilter.trim() === "" || fRutClean.includes(rutFilterClean)) &&
            (emailFilter.trim() === "" || fEmail.includes(emailLower))
        );
    });


    const filters = (
        <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-32">
                    <Input
                        placeholder="ID"
                        value={idFilter}
                        onChange={(e) => setIdFilter(e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="w-full sm:w-40">
                    <Input
                        placeholder="RUT"
                        value={rutFilter}
                        onChange={(e) => setRutFilter(e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="w-full sm:w-56">
                    <Input
                        placeholder="Email"
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value)}
                        className="h-9"
                    />
                </div>
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
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("")}>
                                Todos
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("ACTIVO")}>
                                Activo
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("INACTIVO")}>
                                Inactivo
                            </Dropdown.DropdownMenuItem>
                            <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("RECHAZADO")}>
                                Rechazado
                            </Dropdown.DropdownMenuItem>
                        </Dropdown.DropdownMenuContent>
                    </Dropdown.DropdownMenu>
                </div>

                {(statusFilter || idFilter || rutFilter || emailFilter) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setStatusFilter("");
                            setIdFilter("");
                            setRutFilter("");
                            setEmailFilter("");
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
                    className={`h-9 px-4 text-sm font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-all border shadow-sm ${statusFilter === 'ACTIVO' ? 'ring-2 ring-primary ring-offset-2 border-primary bg-green-100' : 'bg-green-50 text-green-700 border-green-200'}`}
                    onClick={() => setStatusFilter(statusFilter === 'ACTIVO' ? '' : 'ACTIVO')}
                >
                    <Icon.CheckCircle2 className="mr-2 h-4 w-4" />
                    Activos: {summary.activo}
                </BadgeStatus>
                <BadgeStatus 
                    status="inactive" 
                    className={`h-9 px-4 text-sm font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-all border shadow-sm ${statusFilter === 'INACTIVO' ? 'ring-2 ring-primary ring-offset-2 border-primary bg-red-100' : 'bg-red-50 text-red-700 border-red-200'}`}
                    onClick={() => setStatusFilter(statusFilter === 'INACTIVO' ? '' : 'INACTIVO')}
                >
                    <Icon.XCircle className="mr-2 h-4 w-4" />
                    Inactivos: {summary.inactivo}
                </BadgeStatus>
                <BadgeStatus 
                    status="inactive" 
                    className={`h-9 px-4 text-sm font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-all border shadow-sm ${statusFilter === 'RECHAZADO' ? 'ring-2 ring-primary ring-offset-2 border-primary bg-orange-100' : 'bg-orange-50 text-orange-700 border-orange-200'}`}
                    onClick={() => setStatusFilter(statusFilter === 'RECHAZADO' ? '' : 'RECHAZADO')}
                >
                    <Icon.AlertCircle className="mr-2 h-4 w-4" />
                    Rechazados: {summary.rechazado}
                </BadgeStatus>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Armada de Chile"
                description="Listado de personal de la Armada de Chile beneficiarios del sistema."
                actionButtons={actionButtons}
                actionMenu={{
                    title: "Opciones",
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
                filters={filters}
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
            />
            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nombre</Table.TableHead>
                            <Table.TableHead>RUT</Table.TableHead>
                            <Table.TableHead>Correo</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
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
                        ) : filteredFach.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={8} className="text-center py-8">
                                    No se encontraron registros de la Armada de Chile
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredFach.map((fach, index) => (
                                <Table.TableRow key={`${fach.id}-${index}`}>
                                    <Table.TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span 
                                                        className="font-mono text-[10px] text-muted-foreground cursor-pointer hover:text-primary transition-colors hover:underline underline-offset-2"
                                                        onClick={() => handleCopyToClipboard(fach.id.toString(), "ID")}
                                                    >
                                                        {fach.id}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">Clic para copiar ID</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Table.TableCell>
                                    <Table.TableCell className="font-medium text-sm">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span 
                                                        className="cursor-pointer hover:text-primary transition-colors hover:underline underline-offset-4 active:scale-95 transition-transform"
                                                        onClick={() => handleCopyToClipboard(fach.nombre_completo, "Nombre")}
                                                    >
                                                        {fach.nombre_completo}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">Clic para copiar Nombre</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span 
                                                        className="cursor-pointer hover:text-primary transition-colors decoration-dotted underline-offset-4 hover:underline active:scale-95 transition-transform"
                                                        onClick={() => handleCopyToClipboard(fach.rut, "RUT")}
                                                        title="Clic para copiar RUT"
                                                    >
                                                        {formatRut(fach.rut)}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">Clic para copiar RUT</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span 
                                                        className="cursor-pointer hover:text-primary transition-colors hover:underline underline-offset-4 active:scale-95 transition-transform truncate max-w-[150px] inline-block"
                                                        onClick={() => handleCopyToClipboard(fach.correo || "", "Email")}
                                                    >
                                                        {fach.correo || "-"}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">Clic para copiar Email</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-xs text-muted-foreground">{fach.empresa.nombre}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={fach.status === "ACTIVO" ? "active" : "inactive"}>
                                            {fach.status === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell>{fach.convenio?.nombre || "-"}</Table.TableCell>
                                    <Table.TableCell className="text-right">
                                        <Dropdown.DropdownMenu>
                                            <Dropdown.DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <Icon.MoreHorizontalIcon />
                                                </Button>
                                            </Dropdown.DropdownMenuTrigger>
                                            <Dropdown.DropdownMenuContent align="end">
                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleDetailsFach(fach)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>

                                                {user?.rol !== "SISTEMA" && (
                                                    <Dropdown.DropdownMenuItem
                                                        onClick={() => handleEditFach(fach)}
                                                    >
                                                        <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </Dropdown.DropdownMenuItem>
                                                )}
                                                 {user?.rol !== "SISTEMA" && (
                                                     <>
                                                         {fach.status === "ACTIVO" ? (
                                                             <Dropdown.DropdownMenuItem
                                                                 variant="destructive"
                                                                 onClick={() => handleToggleStatus(fach.id, fach.status)}
                                                             >
                                                                 <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                                 Desactivar
                                                             </Dropdown.DropdownMenuItem>
                                                         ) : (
                                                             <Dropdown.DropdownMenuItem
                                                                 onClick={() => handleToggleStatus(fach.id, fach.status)}
                                                             >
                                                                 <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                                                 Activar
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
            </Card.Card>

            <ExportModal
                open={openExport}
                onOpenChange={setOpenExport}
                onExport={handleExport}
            />

            <AddFachModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleFachAdded}
                empresas={empresas}
            />

            <UpdateFachModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                fach={selectedFach}
                onSuccess={handleFachUpdated}
                empresas={empresas}
            />

            <DetailsFachModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                fach={selectedFach}
                onToggleStatus={handleToggleStatus}
            />
        </div>
    )
}