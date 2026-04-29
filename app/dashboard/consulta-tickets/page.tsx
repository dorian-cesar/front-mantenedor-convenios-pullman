"use client";

import { useState } from "react";
import { Search, Ticket, MapPin, Calendar, Clock, User, Armchair, Bus, FileWarning, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ConsultaTicketsPage() {
    const [pnrNumber, setPnrNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [ticketData, setTicketData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pnrNumber.trim()) return;

        setLoading(true);
        setError(null);
        setTicketData(null);

        try {
            const res = await fetch(`/api/boletos?pnr_number=${pnrNumber.trim()}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al buscar el boleto");
            }

            if (data.result && data.result.ticket_details && data.result.ticket_details.length > 0) {
                setTicketData(data.result.ticket_details[0]);
            } else {
                throw new Error("No se encontraron detalles para este boleto");
            }
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Ticket className="w-8 h-8 text-primary" />
                    Consulta de Tickets Kupos
                </h2>
            </div>

            <Card className="border-t-4 border-t-primary shadow-md">
                <CardHeader>
                    <CardTitle>Buscar Boleto</CardTitle>
                    <CardDescription>
                        Ingresa el número de PNR (ej. TS2604...) para ver los detalles del viaje.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <Input
                            placeholder="Número PNR del boleto..."
                            value={pnrNumber}
                            onChange={(e) => setPnrNumber(e.target.value)}
                            className="max-w-md bg-background/50"
                        />
                        <Button type="submit" disabled={loading || !pnrNumber.trim()}>
                            {loading ? (
                                <span className="animate-pulse flex items-center gap-2">Buscando...</span>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Buscar
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-l-4 border-l-destructive bg-destructive/10">
                    <CardContent className="flex items-center gap-4 pt-6">
                        <FileWarning className="w-8 h-8 text-destructive" />
                        <div>
                            <h3 className="font-semibold text-destructive">Error en la búsqueda</h3>
                            <p className="text-sm text-destructive/80">{error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {ticketData && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="md:col-span-2 lg:col-span-2 overflow-hidden border-border/50 relative">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge 
                                        className={`mb-2 text-white ${
                                            ticketData.ticket_status === "Confirmed" ? "bg-emerald-500 hover:bg-emerald-600" :
                                            ticketData.ticket_status === "Cancelled" ? "bg-red-500 hover:bg-red-600" :
                                            "bg-gray-500 hover:bg-gray-600"
                                        }`}
                                    >
                                        {ticketData.ticket_status}
                                    </Badge>
                                    <CardTitle className="text-2xl">Detalle del Viaje</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Bus className="w-4 h-4" /> {ticketData.travels} ({ticketData.service_number})
                                    </CardDescription>
                                </div>
                                <div className="text-right space-y-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">PNR Kupos</p>
                                        <div className="flex items-center justify-end gap-2">
                                            <p className="font-mono font-bold text-lg">{ticketData.pnr_number}</p>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6" 
                                                onClick={() => copyToClipboard(ticketData.pnr_number)}
                                            >
                                                {copiedText === ticketData.pnr_number ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
                                            </Button>
                                        </div>
                                    </div>
                                    {ticketData.operator_pnr && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">PNR Operador</p>
                                            <div className="flex items-center justify-end gap-2">
                                                <p className="font-mono font-bold text-md text-primary">{ticketData.operator_pnr}</p>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6" 
                                                    onClick={() => copyToClipboard(ticketData.operator_pnr)}
                                                >
                                                    {copiedText === ticketData.operator_pnr ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-6 mt-4 p-4 rounded-xl bg-secondary/20">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-emerald-500" /> Origen
                                    </p>
                                    <p className="text-xl font-bold">{ticketData.origin}</p>
                                    <p className="text-sm mt-1 text-muted-foreground">{ticketData.boarding_point_details?.landmark}</p>
                                </div>
                                <div className="border-l border-border pl-6">
                                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-rose-500" /> Destino
                                    </p>
                                    <p className="text-xl font-bold">{ticketData.destination}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="flex flex-col items-center p-3 rounded-lg border border-border/50 bg-card">
                                    <Calendar className="w-5 h-5 text-primary mb-2" />
                                    <p className="text-xs text-muted-foreground">Fecha Viaje</p>
                                    <p className="font-semibold">{ticketData.travel_date}</p>
                                </div>
                                <div className="flex flex-col items-center p-3 rounded-lg border border-border/50 bg-card">
                                    <Clock className="w-5 h-5 text-primary mb-2" />
                                    <p className="text-xs text-muted-foreground">Hora Salida</p>
                                    <p className="font-semibold">{ticketData.dep_time}</p>
                                </div>
                                <div className="flex flex-col items-center p-3 rounded-lg border border-border/50 bg-card">
                                    <Clock className="w-5 h-5 text-muted-foreground mb-2" />
                                    <p className="text-xs text-muted-foreground">Duración</p>
                                    <p className="font-semibold">{ticketData.duration}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col border-border/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Información del Pasajero</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                                <User className="w-8 h-8 p-1.5 rounded-full bg-primary/20 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Pasajero</p>
                                    <p className="font-semibold text-sm truncate max-w-[150px]" title={ticketData.passenger_details?.name}>
                                        {ticketData.passenger_details?.name || "Sin nombre"}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-card">
                                    <Armchair className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Asiento</p>
                                        <p className="font-bold">{ticketData.seat_numbers}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center p-3 rounded-lg border border-border/50 bg-card flex-col">
                                    <p className="text-xs text-muted-foreground">Valor Pagado</p>
                                    <p className="font-bold text-emerald-500">${ticketData.total_fare}</p>
                                </div>
                            </div>

                            {ticketData.booking_details?.qr_code && (
                                <div className="mt-auto pt-4 border-t border-border/50 flex flex-col items-center justify-center">
                                    <p className="text-xs text-muted-foreground mb-2">Código QR del Boleto</p>
                                    <img 
                                        src={ticketData.booking_details.qr_code} 
                                        alt="QR Code" 
                                        className="w-24 h-24 p-1 bg-white rounded-md border"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
