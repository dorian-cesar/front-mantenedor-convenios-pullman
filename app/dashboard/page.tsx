"use client";
import { PageHeader } from "@/components/dashboard/page-header"
import * as Card from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import ExportModal from "@/components/modals/export";
import { useState, useEffect } from "react";
import { ArrowDownToLine, Plus, Upload, FileText, Users, Send, Download, DollarSign, Undo2, Percent, IdCard, ChartColumn, Activity } from "lucide-react";
import { EmpresasService, type Empresa } from "@/services/empresa.service"
import { KpiService, type Resumen, type GetResumenParams } from "@/services/kpi.service";
import { toast } from "sonner"
import { AuthService, CurrentUser } from "@/services/auth.service"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

const actions = [
    { icon: Plus, label: "Nuevo proyecto", variant: "default" as const },
    { icon: Upload, label: "Subir archivo", variant: "secondary" as const },
    { icon: FileText, label: "Crear informe", variant: "secondary" as const },
    { icon: Users, label: "Invitar usuario", variant: "secondary" as const },
    { icon: Send, label: "Enviar mensaje", variant: "secondary" as const },
    { icon: Download, label: "Exportar datos", variant: "secondary" as const },
];

const selectOptions = [
    { value: "diario", label: "Diario" },
    { value: "semanal", label: "Semanal" },
    { value: "mensual", label: "Mensual" },
    { value: "trimestral", label: "Trimestral" },
    { value: "semestral", label: "Semestral" },
    { value: "anual", label: "Anual" },
    { value: "quinquenal", label: "Quinquenal" },
]

const chartConfig = {
    ventas: {
        label: "Ventas",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig


export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [openExport, setOpenExport] = useState(false);
    const [resumen, setResumen] = useState<Resumen[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [granularidad, setGranularidad] = useState<"diario" | "semanal" | "mensual" | "trimestral" | "semestral" | "anual" | "quinquenal">("diario")
    const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
    const [user, setUser] = useState<CurrentUser | null>(null)
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    const fetchResumen = async () => {
        setIsLoading(true)
        try {
            const params: GetResumenParams = {
                granularidad,
                fecha_inicio: dateRange?.from
                    ? format(dateRange.from, "yyyy-MM-dd")
                    : undefined,
                fecha_fin: dateRange?.to
                    ? format(dateRange.to, "yyyy-MM-dd")
                    : undefined,
            }

            const response = await KpiService.getResumen(params)
            setResumen(response.rows)
        } catch (error) {
            console.error('Error fetching resumen:', error)
            toast.error("No se pudo obtener el resumen")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchEmpresas = async () => {
        try {
            const response = await EmpresasService.getEmpresas({
                status: "ACTIVO"
            })
            setEmpresas(response.rows)
        } catch (error) {
            console.error('Error fetching empresas:', error)
        }
    }


    useEffect(() => {
        fetchResumen()
        fetchEmpresas()
    }, [granularidad, selectedEmpresa, dateRange])

    useEffect(() => {
        setUser(AuthService.getCurrentUser())
    }, [])

    const handleRefresh = () => {
        fetchResumen()
    }

    const handleExport = async (type: "csv" | "excel") => {
        console.log("Exportando", type)
    }

    const chartData = resumen.map(item => ({
        periodo: item.periodo,
        ventas: Number(item.total_ventas),
    }))


    const actionButtons = [
        {
            label: "Exportar",
            onClick: () => setOpenExport(true),
            variant: "outline" as const,
            icon: <ArrowDownToLine />
        }
    ];

    return (
        <div className="flex flex-col justify-center space-y-4">

            <PageHeader
                title="Dashboard"
                description="Resumen de la actividad."
                actionButtons={actionButtons}
                showRefreshButton={true}
                onRefresh={handleRefresh}
            />
            <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[140px] gap-4">

                <Card.Card className="md:col-span-3 row-span-1">
                    <Card.CardHeader>
                        <Card.CardTitle>Ventas</Card.CardTitle>
                        <Card.CardAction><DollarSign className="h-4 w-4 text-muted-foreground" /></Card.CardAction>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <p>123456789</p>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card className="md:col-span-3 row-span-1">
                    <Card.CardHeader>
                        <Card.CardTitle>Devoluciones</Card.CardTitle>
                        <Card.CardAction><Undo2 className="h-4 w-4 text-muted-foreground" /></Card.CardAction>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <p>123456789</p>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card className="md:col-span-3 row-span-1">
                    <Card.CardHeader>
                        <Card.CardTitle>Descuentos</Card.CardTitle>
                        <Card.CardAction><Percent className="h-4 w-4 text-muted-foreground" /></Card.CardAction>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <p>123456789</p>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card className="md:col-span-3 row-span-1">
                    <Card.CardHeader>
                        <Card.CardTitle>Pasajeros</Card.CardTitle>
                        <Card.CardAction><IdCard className="h-4 w-4 text-muted-foreground" /></Card.CardAction>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <p>123456789</p>
                    </Card.CardContent>
                </Card.Card>

                <Card.Card className="md:col-span-8 row-span-2 flex">
                    <Card.CardHeader>
                        <Card.CardTitle>Resumen de Ventas</Card.CardTitle>
                        <Card.CardAction>
                            <div className="flex items-center justify-center gap-2">
                                {/* <ChartColumn className="h-4 w-4 text-muted-foreground" /> */}
                                <Select
                                    value={granularidad}
                                    onValueChange={(value) => setGranularidad(value as typeof granularidad)}
                                >
                                    <SelectTrigger className="h-8" size="sm">
                                        <SelectValue placeholder="Items" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectGroup>
                                            {selectOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                                                        {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "dd MMM yyyy", { locale: es })
                                                )
                                            ) : (
                                                <span>Fechas</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-auto p-0" align="end">
                                        <Calendar
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                            locale={es}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </Card.CardAction>
                    </Card.CardHeader>
                    <Card.CardContent className="flex flex-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center w-full">
                                Cargando...
                            </div>
                        ) : resumen.length === 0 ? (
                            <div className="flex items-center justify-center w-full text-muted-foreground">
                                Sin datos para el período seleccionado
                            </div>
                        ) : (
                            <ChartContainer config={chartConfig}>
                                <AreaChart
                                    accessibilityLayer
                                    data={chartData}
                                    margin={{ left: 12, right: 12 }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="periodo"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dot" hideLabel />}
                                    />
                                    <Area
                                        dataKey="ventas"
                                        type="linear"
                                        fill="var(--color-ventas)"
                                        fillOpacity={0.35}
                                        stroke="var(--color-ventas)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </Card.CardContent>
                    
                </Card.Card>

                <Card.Card className="md:col-span-4 row-span-2">
                    <Card.CardHeader>
                        <Card.CardTitle className="text-card-foreground">Acciones rápidas</Card.CardTitle>
                    </Card.CardHeader>
                    <Card.CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {actions.map((action) => (
                                <Button
                                    key={action.label}
                                    variant={action.variant}
                                    className="h-auto flex-col gap-2 py-4"
                                >
                                    <action.icon className="h-5 w-5" />
                                    <span className="text-xs font-medium">{action.label}</span>
                                </Button>
                            ))}
                        </div>
                    </Card.CardContent>
                </Card.Card>
            </div>

            {/* <ExportModal
                open={openExport}
                onOpenChange={setOpenExport}
            /> */}
        </div>
    );
}
