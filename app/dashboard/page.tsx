"use client";
import { PageHeader } from "@/components/dashboard/page-header"
import * as Card from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import ExportModal from "@/components/modals/export";
import { useState, useEffect } from "react";
import { ArrowDownToLine, Plus, Upload, FileText, Users, Send, Download, DollarSign, Undo2, Percent, IdCard, ChartColumn, Activity } from "lucide-react";

const actions = [
    { icon: Plus, label: "Nuevo proyecto", variant: "default" as const },
    { icon: Upload, label: "Subir archivo", variant: "secondary" as const },
    { icon: FileText, label: "Crear informe", variant: "secondary" as const },
    { icon: Users, label: "Invitar usuario", variant: "secondary" as const },
    { icon: Send, label: "Enviar mensaje", variant: "secondary" as const },
    { icon: Download, label: "Exportar datos", variant: "secondary" as const },
];

export default function DashboardPage() {
    const [openExport, setOpenExport] = useState(false);


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
            >
            </PageHeader>
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
                        <Card.CardAction><ChartColumn className="h-4 w-4 text-muted-foreground" /></Card.CardAction>
                    </Card.CardHeader>
                    <Card.CardContent className="flex flex-1">
                        <div className="h-full w-full flex items-center justify-center rounded-lg bg-secondary/30 border border-dashed border-border">
                            <div className="text-center space-y-2">
                                <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Área para gráfico de ventas
                                </p>
                            </div>
                        </div>
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
