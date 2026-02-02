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
import { Calendar } from "@/components/ui/calendar"
import { formatDateOnly } from "@/utils/helpers"
import { es } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import ExportModal from "@/components/modals/export";
import { format } from "date-fns"

const mockEventos = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    tipo_evento: ["Viaje", "Devolución", "Cambio de asiento"][i % 3],
    usuario: `Usuario ${(i % 10) + 1}`,
    pasajero: `Pasajero ${(i % 20) + 1}`,
    empresa: `Empresa ${(i % 15) + 1}`,
    ciudad_origen: ["Santiago", "Concepción", "Valparaíso", "La Serena"][i % 4],
    ciudad_destino: ["Santiago", "Concepción", "Valparaíso", "La Serena"][(i + 1) % 4],
    fecha_viaje: new Date(2025, i % 12, (i % 28) + 1).toISOString().split('T')[0],
    numero_asiento: `A${(i % 50) + 1}`,
    tarifa_base: `$${10000 + (i % 5) * 8000}`,
    monto_pagado: `$${8000 + (i % 4) * 6000}`,
    porcentaje_descuento: `${(i % 5) * 10}%`,
    status: i % 4 === 0 ? "cancelado" : i % 7 === 0 ? "pendiente" : "completado",
    fecha_evento: new Date(2025, i % 12, (i % 28) + 1, (i % 24), (i % 60)).toISOString(),
    convenio: i % 3 === 0 ? "Convenio " + (i % 8 + 1) : null,
    codigo_descuento: i % 4 === 0 ? "DESC" + (i % 20) : null
}))

export default function EventosPage() {
    const [openExport, setOpenExport] = useState(false);
    const [searchValue, setSearchValue] = useState("")
    const [eventos, setEventos] = useState(mockEventos)
    const [filteredEventos, setFilteredEventos] = useState(mockEventos)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    })

    useEffect(() => {
        let filtered = [...eventos]

        if (searchValue.trim()) {
            const search = searchValue.toLowerCase()
            filtered = filtered.filter(e =>
                e.usuario.toLowerCase().includes(search) ||
                e.pasajero.toLowerCase().includes(search) ||
                e.convenio?.toLowerCase().includes(search) ||
                e.codigo_descuento?.toLowerCase().includes(search)
            )
        }

        if (statusFilter) {
            filtered = filtered.filter(e => e.status === statusFilter)
        }

        if (dateRange?.from || dateRange?.to) {
            filtered = filtered.filter(e => {
                const eventoDay = toDayKey(new Date(e.fecha_evento))

                const fromDay = dateRange.from
                    ? toDayKey(dateRange.from)
                    : null

                const toDay = dateRange.to
                    ? toDayKey(dateRange.to)
                    : null

                if (fromDay && eventoDay < fromDay) return false
                if (toDay && eventoDay > toDay) return false

                return true
            })
        }

        setFilteredEventos(filtered)
        setPagination(prev => ({ ...prev, page: 1 }))
    }, [searchValue, statusFilter, dateRange, eventos])

    useEffect(() => {
        const total = filteredEventos.length
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
    }, [filteredEventos, pagination.page, pagination.limit])


    const toDayKey = (date: Date) =>
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

    const getCurrentPageEventos = () => {
        const startIndex = (pagination.page - 1) * pagination.limit
        const endIndex = startIndex + pagination.limit
        return filteredEventos.slice(startIndex, endIndex)
    }

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const actionButtons = [
        {
            label: "Exportar",
            onClick: () => setOpenExport(true),
            variant: "outline" as const,
            icon: <Icon.ArrowDownToLine />
        }
    ]

    return (
        <div className="flex flex-col justify-center space-y-4">
            <PageHeader
                title="Eventos"
                description="Historial de todos los eventos del sistema."
                actionButtons={actionButtons}
                showSearch={true}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onSearchClear={() => setSearchValue("")}
                showPagination={true}
                filters={
                    <div className="flex gap-2 flex-wrap">
                        <Dropdown.DropdownMenu>
                            <Dropdown.DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Icon.Filter className="h-4 w-4" />
                                    {statusFilter ? `Estado: ${statusFilter}` : "Estado"}
                                </Button>
                            </Dropdown.DropdownMenuTrigger>

                            <Dropdown.DropdownMenuContent align="start">
                                <Dropdown.DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                    Todos
                                </Dropdown.DropdownMenuItem>
                                <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("completado")}>
                                    Completado
                                </Dropdown.DropdownMenuItem>
                                <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("pendiente")}>
                                    Pendiente
                                </Dropdown.DropdownMenuItem>
                                <Dropdown.DropdownMenuItem onClick={() => setStatusFilter("cancelado")}>
                                    Cancelado
                                </Dropdown.DropdownMenuItem>
                            </Dropdown.DropdownMenuContent>
                        </Dropdown.DropdownMenu>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Icon.Calendar className="h-4 w-4" />
                                    {dateRange?.from
                                        ? dateRange.to
                                            ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                                            : format(dateRange.from, "dd/MM/yyyy")
                                        : "Fecha evento"}
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent align="start" className="p-0">
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={es}
                                    classNames={{
                                        cell: "p-1",
                                        day: "h-8 w-8 p-0",
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        {(statusFilter || dateRange) && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setStatusFilter(null)
                                    setDateRange(undefined)
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                }
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

            <Card.Card>
                <Table.Table>
                    <Table.TableHeader>
                        <Table.TableRow>
                            <Table.TableHead>ID</Table.TableHead>
                            <Table.TableHead>Tipo Evento</Table.TableHead>
                            <Table.TableHead>Usuario</Table.TableHead>
                            <Table.TableHead>Pasajero</Table.TableHead>
                            <Table.TableHead>Empresa</Table.TableHead>
                            <Table.TableHead>Ciudad Origen</Table.TableHead>
                            <Table.TableHead>Ciudad Destino</Table.TableHead>
                            <Table.TableHead>Fecha Viaje</Table.TableHead>
                            <Table.TableHead>Número Asiento</Table.TableHead>
                            <Table.TableHead>Tarifa Base</Table.TableHead>
                            <Table.TableHead>Monto Pagado</Table.TableHead>
                            <Table.TableHead>Descuento</Table.TableHead>
                            <Table.TableHead>Status</Table.TableHead>
                            <Table.TableHead>Fecha Evento</Table.TableHead>
                            <Table.TableHead>Convenio</Table.TableHead>
                            <Table.TableHead>Codigo Descuento</Table.TableHead>
                        </Table.TableRow>
                    </Table.TableHeader>

                    <Table.TableBody>
                        {getCurrentPageEventos().map((eventos) => (
                            <Table.TableRow key={eventos.id}>
                                <Table.TableCell>{eventos.id}</Table.TableCell>
                                <Table.TableCell>{eventos.tipo_evento}</Table.TableCell>
                                <Table.TableCell>{eventos.usuario}</Table.TableCell>
                                <Table.TableCell>{eventos.pasajero}</Table.TableCell>
                                <Table.TableCell>{eventos.empresa}</Table.TableCell>
                                <Table.TableCell>{eventos.ciudad_origen}</Table.TableCell>
                                <Table.TableCell>{eventos.ciudad_destino}</Table.TableCell>
                                <Table.TableCell>{eventos.fecha_viaje}</Table.TableCell>
                                <Table.TableCell>{eventos.numero_asiento}</Table.TableCell>
                                <Table.TableCell>{eventos.tarifa_base}</Table.TableCell>
                                <Table.TableCell>{eventos.monto_pagado}</Table.TableCell>
                                <Table.TableCell>{eventos.porcentaje_descuento}</Table.TableCell>
                                <Table.TableCell><BadgeStatus status={eventos.status}>{eventos.status}</BadgeStatus></Table.TableCell>
                                <Table.TableCell>{formatDateOnly(eventos.fecha_evento)}</Table.TableCell>
                                <Table.TableCell>{eventos.convenio ?? "no definido"}</Table.TableCell>
                                <Table.TableCell>{eventos.codigo_descuento ?? "no definido"}</Table.TableCell>
                            </Table.TableRow>
                        ))}
                    </Table.TableBody>
                </Table.Table>
            </Card.Card>

            {/* <ExportModal
                open={openExport}
                onOpenChange={setOpenExport}
            /> */}
        </div>
    )
}