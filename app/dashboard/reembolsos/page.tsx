"use client"

import { Button } from "@/components/ui/button"
import * as Table from "@/components/ui/table"
import * as Icon from "lucide-react"
import { BadgeStatus } from "@/components/ui/badge-status"
import * as Card from "@/components/ui/card"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/dashboard/Pagination"
import { formatNumber, formatDateTime, formatRut } from "@/utils/helpers"
import { Input } from "@/components/ui/input"
import { ReembolsoService, type Reembolso } from "@/services/reembolso.service"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/hooks/useAuth"
import AddReembolsoModal from "@/components/modals/add-reembolso"

const CopyableCell = ({ text, children }: { text: string, children: React.ReactNode }) => (
    <div 
        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 -m-1 rounded transition-colors group flex items-center justify-between gap-1 w-full"
        onClick={() => {
            if (!text || text === "-") return;
            navigator.clipboard.writeText(text);
            toast.success("Copiado: " + text);
        }}
        title="Clic para copiar"
    >
        <span className="truncate">{children}</span>
        {text && text !== "-" && (
            <Icon.Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 flex-shrink-0" />
        )}
    </div>
)

export default function ReembolsosPage() {
    const [reembolsos, setReembolsos] = useState<Reembolso[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openAddModal, setOpenAddModal] = useState(false)
    const { user, initialized: authInitialized } = useAuth()
    
    // Role protection: Only SISTEMA and SUPER_USUARIO
    const hasAccess = user?.rol?.toUpperCase() === "SISTEMA" || user?.rol?.toUpperCase() === "SUPER_USUARIO"
    
    const [isSyncing, setIsSyncing] = useState(false)

    const handleSyncStatus = async () => {
        setIsSyncing(true)
        const toastId = toast.loading("Sincronizando estados con Monday...")
        try {
            const res = await ReembolsoService.syncStatuses()
            toast.success(res.message, { id: toastId })
            // @ts-ignore
            fetchReembolsos() // Refrescar la tabla
        } catch (error) {
            toast.error("Error al sincronizar estados", { id: toastId })
        } finally {
            setIsSyncing(false)
        }
    }

    const [searchValue, setSearchValue] = useState("")
    const [rutFilter, setRutFilter] = useState("")
    const [pnrFilter, setPnrFilter] = useState("")
    const [estadoFilter, setEstadoFilter] = useState<string | null>(null)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    })

    const debouncedSearch = useDebounce(searchValue, 500)
    const debouncedRut = useDebounce(rutFilter, 500)
    const debouncedPnr = useDebounce(pnrFilter, 500)

    const fetchReembolsos = async (isSilent = false) => {
        if (!authInitialized || !hasAccess) return
        
        if (!isSilent) setIsLoading(true)
        try {
            const response = await ReembolsoService.getReembolsos({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch,
                rut: debouncedRut,
                pnr: debouncedPnr,
                estado: estadoFilter || undefined
            })
            setReembolsos(response.rows)
            setPagination(prev => ({
                ...prev,
                total: response.total,
                totalPages: response.totalPages
            }))
        } catch (error) {
            console.error('Error fetching reembolsos:', error)
            if (!isSilent) toast.error("No se pudieron cargar los reembolsos")
        } finally {
            if (!isSilent) setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReembolsos()
        
        // Auto-refresco cada 20 segundos (silencioso, solo actualiza la lista local)
        const interval = setInterval(() => {
            fetchReembolsos(true)
        }, 20000)

        return () => clearInterval(interval)
    }, [
        pagination.page,
        pagination.limit,
        debouncedSearch,
        debouncedRut,
        debouncedPnr,
        estadoFilter,
        authInitialized
    ])

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const handleLimitChange = (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
    }

    if (authInitialized && !hasAccess) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-4">
                    <Icon.ShieldAlert className="h-16 w-16 text-red-500 mx-auto" />
                    <h1 className="text-2xl font-bold">Acceso Denegado</h1>
                    <p className="text-muted-foreground">No tienes permisos para acceder a este módulo.</p>
                </div>
            </div>
        )
    }

    const actionButtons = [
        {
            label: "Sincronizar Estados",
            onClick: handleSyncStatus,
            variant: "outline" as const,
            icon: <Icon.RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />,
            disabled: isSyncing
        },
        {
            label: "Nueva Solicitud",
            onClick: () => setOpenAddModal(true),
            variant: "default" as const,
            icon: <Icon.Plus className="h-4 w-4" />
        }
    ]

    const filters = (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">RUT:</span>
                    <Input
                        placeholder="Buscar RUT..."
                        value={rutFilter}
                        onChange={(e) => setRutFilter(e.target.value)}
                        className="h-9 w-[150px]"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">PNR:</span>
                    <Input
                        placeholder="Buscar PNR..."
                        value={pnrFilter}
                        onChange={(e) => setPnrFilter(e.target.value)}
                        className="h-9 w-[150px]"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Estado:</span>
                    <select 
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={estadoFilter || ""}
                        onChange={(e) => setEstadoFilter(e.target.value || null)}
                    >
                        <option value="">Todos</option>
                        <option value="Pending">Pendiente</option>
                        <option value="DatosBancarios">Datos Bancarios</option>
                        <option value="Completado">Completado</option>
                        <option value="Pagado">Pagado</option>
                    </select>
                </div>
                
                <div className="ml-auto">
                    <Badge variant="secondary" className="h-9 px-4">
                        Total: {pagination.total} registros
                    </Badge>
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col space-y-4">
            <PageHeader
                title="Reembolso Administración Interna"
                description="Gestión de solicitudes de devolución y reembolso de boletos."
                actionButtons={actionButtons}
                showSearch={true}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onSearchClear={() => setSearchValue("")}
                onRefresh={fetchReembolsos}
                showRefreshButton={true}
                showPagination={true}
                paginationComponent={
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        onPageChange={handlePageChange}
                        limit={pagination.limit}
                        onLimitChange={handleLimitChange}
                        hasPrevPage={pagination.page > 1}
                        hasNextPage={pagination.page < pagination.totalPages}
                    />
                }
                filters={filters}
            />

            <div className="rounded-md border bg-card">
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Nro Reserva</Table.TableHead>
                            <Table.TableHead>Origen</Table.TableHead>
                            <Table.TableHead>Destino</Table.TableHead>
                            <Table.TableHead>Categoría</Table.TableHead>
                            <Table.TableHead>Asiento</Table.TableHead>
                            <Table.TableHead>Operador</Table.TableHead>
                            <Table.TableHead>Fecha Salida</Table.TableHead>
                            <Table.TableHead>Fecha Cancelación</Table.TableHead>
                            <Table.TableHead>Monto</Table.TableHead>
                            <Table.TableHead>Beneficiario</Table.TableHead>
                            <Table.TableHead>Correo</Table.TableHead>
                            <Table.TableHead>Nº Documento</Table.TableHead>
                            <Table.TableHead>Banco / Cuenta</Table.TableHead>
                            <Table.TableHead>Tipo Cuenta</Table.TableHead>
                            <Table.TableHead>Estado</Table.TableHead>
                            <Table.TableHead>ID Elemento</Table.TableHead>
                            <Table.TableHead>Gestionado por</Table.TableHead>
                            <Table.TableHead className="text-right">Acciones</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                        {isLoading ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={17} className="h-24 text-center">
                                    Cargando datos...
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : reembolsos.length === 0 ? (
                            <Table.TableRow>
                                <Table.TableCell colSpan={17} className="h-24 text-center text-muted-foreground">
                                    No se encontraron solicitudes de reembolso.
                                </Table.TableCell>
                            </Table.TableRow>
                        ) : (
                            reembolsos.map((item) => (
                                <Table.TableRow key={item.id}>
                                    <Table.TableCell className="font-mono text-xs text-slate-500 text-center">{item.id}</Table.TableCell>
                                    <Table.TableCell className="font-mono text-xs font-bold">
                                        <CopyableCell text={item.pnr}>{item.pnr}</CopyableCell>
                                    </Table.TableCell>
                                    <Table.TableCell className="text-[10px] uppercase font-medium">{item.origen || '-'}</Table.TableCell>
                                    <Table.TableCell className="text-[10px] uppercase font-medium">{item.destino || '-'}</Table.TableCell>
                                    <Table.TableCell>
                                        <Badge variant="outline" className={item.categoria === 'ANULACION' ? 'border-orange-500 text-orange-600' : 'border-blue-500 text-blue-600'}>
                                            {item.categoria}
                                        </Badge>
                                    </Table.TableCell>
                                    <Table.TableCell>{item.numero_asiento}</Table.TableCell>
                                    <Table.TableCell>{item.operador}</Table.TableCell>
                                    <Table.TableCell>{item.fecha_salida ? item.fecha_salida.split('T')[0] : '-'}</Table.TableCell>
                                    <Table.TableCell>{item.fecha_cancelacion}</Table.TableCell>
                                    <Table.TableCell className="font-bold">
                                        <CopyableCell text={item.monto.toString()}>
                                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(item.monto)}
                                        </CopyableCell>
                                    </Table.TableCell>
                                    <Table.TableCell className="max-w-[150px] truncate" title={item.nombre_beneficiario}>
                                        <CopyableCell text={item.nombre_beneficiario || ''}>
                                            <span className="text-primary font-semibold uppercase text-[10px]">
                                                {item.nombre_beneficiario || <span className="text-muted-foreground italic font-normal lowercase">Pendiente</span>}
                                            </span>
                                        </CopyableCell>
                                    </Table.TableCell>
                                    <Table.TableCell className="max-w-[150px] truncate" title={item.correo}>
                                        <CopyableCell text={item.correo || ''}>
                                            {item.correo || <span className="text-xs text-muted-foreground italic">Pendiente</span>}
                                        </CopyableCell>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        <CopyableCell text={item.rut || ''}>
                                            {item.rut ? formatRut(item.rut) : <span className="text-xs text-muted-foreground italic">Pendiente</span>}
                                        </CopyableCell>
                                    </Table.TableCell>
                                    <Table.TableCell>
                                        {item.banco ? (
                                            <div className="flex flex-col gap-1">
                                                <CopyableCell text={item.banco}>
                                                    <span className="font-medium text-xs">{item.banco}</span>
                                                </CopyableCell>
                                                <CopyableCell text={item.numero_cuenta || ''}>
                                                    <span className="text-[10px] text-muted-foreground">{item.numero_cuenta}</span>
                                                </CopyableCell>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Sin datos</span>
                                        )}
                                    </Table.TableCell>
                                    <Table.TableCell className="text-[10px]">{item.tipo_cuenta || "-"}</Table.TableCell>
                                    <Table.TableCell>
                                        <BadgeStatus status={item.estado.toLowerCase()}>
                                            {item.estado}
                                        </BadgeStatus>
                                    </Table.TableCell>
                                    <Table.TableCell className="font-mono text-[10px] text-slate-400">
                                        {item.monday_item_id || '-'}
                                    </Table.TableCell>
                                    <Table.TableCell className="text-[10px] font-medium text-slate-500 uppercase">
                                        {item.usuario_creador?.nombre || item.created_by || 'system'}
                                    </Table.TableCell>
                                    <Table.TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Copiar link de formulario"
                                            onClick={() => {
                                                const url = `${window.location.origin}/reembolso/completar/${item.token}`
                                                navigator.clipboard.writeText(url)
                                                toast.success("Link copiado al portapapeles")
                                            }}
                                        >
                                            <Icon.Link className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Enviar link por Email"
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={async () => {
                                                if (!item.id) return;
                                                const promise = ReembolsoService.sendEmail(item.id);
                                                toast.promise(promise, {
                                                    loading: 'Enviando correo...',
                                                    success: 'Correo enviado correctamente',
                                                    error: (err) => err.response?.data?.message || 'Error al enviar el correo'
                                                });
                                            }}
                                        >
                                            <Icon.Mail className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Sincronizar con Monday"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={async () => {
                                                if (!item.id) return;
                                                const promise = ReembolsoService.syncMonday(item.id);
                                                toast.promise(promise, {
                                                    loading: 'Sincronizando con Monday...',
                                                    success: (data) => `Sincronizado: ID Monday ${data.mondayItemId}`,
                                                    error: 'Error al sincronizar con Monday'
                                                });
                                            }}
                                            disabled={!item.estado || item.estado.toLowerCase() !== 'datosbancarios'}
                                        >
                                            <Icon.Share2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Reiniciar solicitud (Limpiar datos y reabrir link)"
                                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                            onClick={async () => {
                                                if (!item.id) return;
                                                if (confirm('¿Estás seguro de reiniciar esta solicitud? Se borrarán los datos bancarios y el link público volverá a estar habilitado.')) {
                                                    try {
                                                        await ReembolsoService.resetReembolso(item.id);
                                                        toast.success("Solicitud reiniciada correctamente");
                                                        fetchReembolsos();
                                                    } catch (error) {
                                                        toast.error("Error al reiniciar la solicitud");
                                                    }
                                                }
                                            }}
                                            disabled={item.estado?.toLowerCase() === 'pagado'}
                                        >
                                            <Icon.RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </Table.TableCell>
                                </Table.TableRow>
                            ))
                        )}
                    </Table.TableBody>
                </Table.Table>
            </div>

            <AddReembolsoModal 
                open={openAddModal} 
                onOpenChange={setOpenAddModal} 
                onSuccess={fetchReembolsos}
            />
        </div>
    )
}
