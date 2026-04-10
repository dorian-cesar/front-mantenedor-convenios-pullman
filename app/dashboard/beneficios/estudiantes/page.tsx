"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as Dropdown from "@/components/ui/dropdown-menu"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState } from "react"
import useSWR from "swr"
import { PageHeader } from "@/components/dashboard/page-header"
import { Pagination } from "@/components/dashboard/Pagination"
import ExportModal from "@/components/modals/export"
import AddEstudianteModal from "@/components/modals/add-estudiante"
import UpdateEstudianteModal from "@/components/modals/update-estudiante"
import DetailsEstudianteModal from "@/components/modals/details-estudiante"
import RechazarModal from "@/components/modals/rechazar"
import { EstudiantesService, type Estudiante, type GetEstudiantesParams } from "@/services/estudiante.service"
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


import { useConvenios } from "@/hooks/use-convenios"
import { useAuth } from "@/hooks/useAuth"

export default function EstudiantesPage() {
    const [summary, setSummary] = useState({ activo: 0, inactivo: 0, rechazado: 0 })
    const [searchValue, setSearchValue] = useState("")
    const [openExport, setOpenExport] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDetails, setOpenDetails] = useState(false)
    const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null)
    const [openRechazar, setOpenRechazar] = useState(false)
    const [idFilter, setIdFilter] = useState("")
    const [rutFilter, setRutFilter] = useState("")
    const [emailFilter, setEmailFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("")
    const { convenioMap } = useConvenios()
    const { user } = useAuth()

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
    })

    const debouncedSearch = useDebounce(searchValue, 300)
    const normalizeString = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const debouncedId = useDebounce(idFilter, 500)
    const debouncedRut = useDebounce(rutFilter, 500)
    const debouncedEmail = useDebounce(emailFilter, 500)

    const fetcher = async () => {
        const params: GetEstudiantesParams = {
            page: pagination.page,
            limit: pagination.limit,
            status: (statusFilter as any) || undefined
        }

        const searchTerm = debouncedSearch.trim()
        if (searchTerm) {
            params.search = searchTerm
        }

        if (debouncedId.trim()) params.id = debouncedId.trim()
        if (debouncedRut.trim()) params.rut = debouncedRut.trim().replace(/\./g, '')
        if (debouncedEmail.trim()) params.correo = debouncedEmail.trim()

        return EstudiantesService.getEstudiantes(params)
    }

    const fetchSummary = async () => {
        try {
            const params: any = {}
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
            if (debouncedId.trim()) params.id = debouncedId.trim()
            if (debouncedRut.trim()) params.rut = debouncedRut.trim().replace(/\./g, '')
            if (debouncedEmail.trim()) params.correo = debouncedEmail.trim()

            const [activeRes, inactiveRes, rejectedRes] = await Promise.all([
                EstudiantesService.getEstudiantes({ ...params, status: 'ACTIVO', limit: 1 }),
                EstudiantesService.getEstudiantes({ ...params, status: 'INACTIVO', limit: 1 }),
                EstudiantesService.getEstudiantes({ ...params, status: 'RECHAZADO', limit: 1 })
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

    const { data: response, error, isLoading, mutate } = useSWR(
        ['beneficiarios', 'estudiantes', pagination.page, pagination.limit, debouncedSearch, debouncedId, debouncedRut, debouncedEmail, statusFilter],
        async () => {
            const res = await fetcher();
            fetchSummary();
            return res;
        },
        { keepPreviousData: true }
    )

    const estudiantes: Estudiante[] = (response?.rows || (response as any)?.data || (Array.isArray(response) ? response : [])) ?? [];
    
    const totalItems = Number(response?.totalItems ?? (response as any)?.total ?? (response as any)?.totalItems ?? estudiantes.length);
    const totalPages = response?.totalPages ? Number(response.totalPages) : (response as any)?.pages ? Number((response as any).pages) : Math.ceil(totalItems / pagination.limit) || 1;
    const currentPage = Number(response?.currentPage ?? (response as any)?.page ?? pagination.page);
    const hasPrevPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;

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
        currentStatus: "ACTIVO" | "INACTIVO" | "RECHAZADO"
    ) => {
        try {
            await EstudiantesService.toggleStatus(id, currentStatus)

            toast.success(
                currentStatus === "ACTIVO"
                    ? "Estudiante desactivado correctamente"
                    : "Estudiante activado correctamente"
            )

            mutate()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error("No se pudo actualizar el estado")
        }
    }

    const handleEstudanteRechazado = async (
        id: number,
        razon_rechazo: string
    ) => {
        try {
            await EstudiantesService.rechazarEstudiante(id, { razon_rechazo, status: "RECHAZADO" })
            toast.success("Se rechazo la solicitud exitosamente")
            mutate()
            setOpenRechazar(false)
        } catch (error) {
            console.error('Error rechazando solicitud:', error)
            toast.error("No se pudo rechazar la solicitud")
        }
    }

    const handleRechazar = async (estudiante: Estudiante) => {
        setSelectedEstudiante(estudiante)
        setOpenRechazar(true)
    }

    const handleEstudianteAdded = () => {
        mutate()
        setOpenAdd(false)
    }

    const handleEditEstudiante = async (estudiante: Estudiante) => {
        try {
            const usuario = await EstudiantesService.getEstudianteById(estudiante.id)
            setSelectedEstudiante(usuario)
            setOpenUpdate(true)
        } catch (error) {
            console.error('Error fetching estudiante details:', error)
            toast.error("No se pudieron cargar los detalles del estudiante")
        }
    }

    const handleEstudianteUpdated = () => {
        mutate()
        setOpenUpdate(false)
    }

    const handleDetailsEstudiante = async (estudiante: Estudiante) => {
        try {
            const usuario = await EstudiantesService.getEstudianteById(estudiante.id)
            console.log("DIAGNOSTIC - Estudiante Object:", usuario);
            if (usuario.imagenes) console.log("DIAGNOSTIC - Imagenes Keys:", Object.keys(usuario.imagenes));
            setSelectedEstudiante(usuario)
            setOpenDetails(true)
        } catch (error) {
            console.error('Error fetching estudiante details:', error)
            toast.error("No se pudieron cargar los detalles del estudiante")
        }
    }

    const handleRefresh = () => {
        mutate();
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

            const params: GetEstudiantesParams = {
            }

            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim()
            }

            const response = await EstudiantesService.getEstudiantes(params)
            
            const rows = response.rows || (response as any).data || (Array.isArray(response) ? response : []);

            if (!rows.length) {
                toast.error("No hay datos para exportar", { id: "export" })
                return
            }

            const formattedData = rows.map(est => ({
                ID: est.id,
                Nombre: est.nombre,
                RUT: formatRut(est.rut),
                Teléfono: est.telefono,
                Correo: est.correo,
                Estado: est.status,
                Creado: new Date(est.createdAt || "").toLocaleDateString(),
                Actualizado: new Date(est.updatedAt || "").toLocaleDateString(),
            }))

            if (type === "csv") {
                exportToCSV(formattedData, "estudiantes.csv")
                toast.success("CSV exportado correctamente", { id: "export" })
            }

            if (type === "excel") {
                exportToExcel(formattedData, "estudiantes.xlsx")
                toast.success("Excel exportado correctamente", { id: "export" })
            }

        } catch (error) {
            console.error("Error exporting estudiantes:", error)
            toast.error("Error al exportar datos", { id: "export" })
        }
    }

    const actionButtons = user?.rol === "USUARIO" ? [] : [
        {
            label: "Nuevo Estudiante",
            onClick: () => setOpenAdd(true),
            icon: <Icon.PlusIcon className="h-4 w-4" />
        },
    ]

    // Client-side filtering for immediate feedback
    const filteredEstudiantes = estudiantes.filter(estudiante => {
        if (!searchValue.trim() && !idFilter.trim() && !rutFilter.trim() && !emailFilter.trim()) return true;

        const cleanRut = (r: string) => r?.replace(/[^0-9kK]/g, "").toLowerCase() || "";

        const searchTerms = normalizeString(searchValue).split(/\s+/).filter(Boolean);
        const searchClean = cleanRut(searchValue);

        const estId = estudiante.id?.toString() || "";
        const estNombre = estudiante.nombre ? normalizeString(estudiante.nombre) : "";
        const estRutClean = cleanRut(estudiante.rut || "");
        const estEmail = estudiante.correo ? normalizeString(estudiante.correo) : "";
        const estConvenio = estudiante.convenio?.nombre ? normalizeString(estudiante.convenio.nombre) : "";
        const estTelefono = estudiante.telefono || "";

        const matchesGlobal = searchValue.trim() === "" || searchTerms.every(term => {
            const termClean = cleanRut(term);
            return (
                estId.includes(term) ||
                estNombre.includes(term) ||
                (termClean !== "" && estRutClean.includes(termClean)) ||
                estEmail.includes(term) ||
                estConvenio.includes(term) ||
                estTelefono.includes(term)
            );
        });

        const idLower = idFilter.toLowerCase();
        const rutFilterClean = cleanRut(rutFilter);
        const emailLower = emailFilter.toLowerCase();

        return (
            matchesGlobal &&
            (idFilter.trim() === "" || estId.includes(idLower)) &&
            (rutFilter.trim() === "" || estRutClean.includes(rutFilterClean)) &&
            (emailFilter.trim() === "" || estEmail.includes(emailLower))
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
                title="Estudiantes"
                description="Listado de estudiantes beneficiarios del sistema."
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
                onSearchChange={(value) => setSearchValue(value)}
                onSearchClear={() => setSearchValue("")}
                filters={filters}
                showPagination={true}
                paginationComponent={
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        onPageChange={handlePageChange}
                        hasPrevPage={hasPrevPage}
                        hasNextPage={hasNextPage}
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
                            <Table.TableHead>Teléfono</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={9} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Icon.Loader2Icon className="h-6 w-6 animate-spin" />
                                    </div>
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : filteredEstudiantes.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={8} className="text-center py-8">
                                    No se encontraron estudiantes
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            filteredEstudiantes.map((estudiante) => (
                                <Table.TableRow key={estudiante.id}>
                                    <Table.TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span 
                                                        className="font-mono text-[10px] text-muted-foreground cursor-pointer hover:text-primary transition-colors hover:underline underline-offset-2"
                                                        onClick={() => handleCopyToClipboard(estudiante.id.toString(), "ID")}
                                                    >
                                                        {estudiante.id}
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
                                                        onClick={() => handleCopyToClipboard(estudiante.nombre, "Nombre")}
                                                    >
                                                        {estudiante.nombre}
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
                                                        onClick={() => handleCopyToClipboard(estudiante.rut, "RUT")}
                                                        title="Clic para copiar RUT"
                                                    >
                                                        {formatRut(estudiante.rut)}
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
                                                        onClick={() => handleCopyToClipboard(estudiante.correo || "", "Email")}
                                                    >
                                                        {estudiante.correo}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">Clic para copiar Email</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-xs text-muted-foreground">{estudiante.telefono}</Table.TableCell>
                                    <Table.TableCell>
                                        {estudiante.convenio?.nombre || (estudiante.convenio_id ? convenioMap[estudiante.convenio_id] : null) || "Sin convenio"}
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={estudiante.status === "ACTIVO" ? "active" : "inactive"}>
                                            {estudiante.status === "ACTIVO" ? "Activo" : estudiante.status === "INACTIVO" ? "Inactivo" : "Rechazado"}
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
                                                    onClick={() => handleDetailsEstudiante(estudiante)}
                                                >
                                                    <Icon.EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver detalles
                                                </Dropdown.DropdownMenuItem>

                                                <Dropdown.DropdownMenuItem
                                                    onClick={() => handleEditEstudiante(estudiante)}
                                                >
                                                    <Icon.PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Dropdown.DropdownMenuItem>
                                                {estudiante.status === "ACTIVO" ? (
                                                    <>
                                                        <Dropdown.DropdownMenuSeparator />
                                                        <Dropdown.DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() => handleToggleStatus(estudiante.id, estudiante.status)}
                                                        >
                                                            <Icon.BanIcon className="h-4 w-4 mr-2" />
                                                            Desactivar
                                                        </Dropdown.DropdownMenuItem>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Dropdown.DropdownMenuItem
                                                            onClick={() => handleToggleStatus(estudiante.id, estudiante.status)}
                                                        >
                                                            <Icon.CheckIcon className="h-4 w-4 mr-2" />
                                                            Activar
                                                        </Dropdown.DropdownMenuItem>
                                                        {estudiante.status !== "RECHAZADO" && (
                                                            <Dropdown.DropdownMenuItem
                                                                variant="destructive"
                                                                onClick={() => handleRechazar(estudiante)}
                                                            >
                                                                <Icon.BanIcon className="h-4 w-4 mr-2" />
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
            </Card.Card>

            <ExportModal
                open={openExport}
                onOpenChange={setOpenExport}
                onExport={handleExport}
            />

            <AddEstudianteModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onSuccess={handleEstudianteAdded}
            />

            <UpdateEstudianteModal
                open={openUpdate}
                onOpenChange={setOpenUpdate}
                estudiante={selectedEstudiante}
                onSuccess={handleEstudianteUpdated}
            />

            <DetailsEstudianteModal
                open={openDetails}
                onOpenChange={setOpenDetails}
                estudiante={selectedEstudiante}
                onToggleStatus={handleToggleStatus}
                onRechazar={handleRechazar}
            />

            <RechazarModal
                open={openRechazar}
                onOpenChange={setOpenRechazar}
                onSubmit={(motivo) => handleEstudanteRechazado(selectedEstudiante?.id || 0, motivo)}
            />

        </div>
    )
}
