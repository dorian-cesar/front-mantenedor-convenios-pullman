"use client"

import * as Dialog from "@/components/ui/dialog"
import { Convenio } from "@/services/convenio.service"
import { formatDateOnly, formatNumber } from "@/utils/helpers"

interface DetailsConvenioModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    convenio: Convenio | null
}

export default function DetailsConvenioModal({
    open,
    onOpenChange,
    convenio,
}: DetailsConvenioModalProps) {
    if (!convenio) return null

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-2xl">
                <Dialog.DialogHeader>
                    <Dialog.DialogTitle>Detalles del Convenio</Dialog.DialogTitle>
                    <Dialog.DialogDescription>
                        Información detallada del convenio <strong>{convenio.nombre}</strong>
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="grid gap-4 grid-cols-2 mt-4">
                    <div>
                        <p className="text-sm font-medium leading-none">ID</p>
                        <p className="text-sm text-muted-foreground">{convenio.id}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Nombre</p>
                        <p className="text-sm text-muted-foreground">{convenio.nombre}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Empresa</p>
                        <p className="text-sm text-muted-foreground">
                            {convenio.empresa?.nombre || "Sin empresa asignada"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">RUT Empresa</p>
                        <p className="text-sm text-muted-foreground">{convenio.empresa?.rut || "N/A"}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Estado</p>
                        <p className="text-sm text-muted-foreground">{convenio.status}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Fecha de creación</p>
                        <p className="text-sm text-muted-foreground">
                            {convenio.createdAt ? formatDateOnly(convenio.createdAt) : "N/A"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Tipo de Consulta</p>
                        <p className="text-sm text-muted-foreground">
                            {convenio.tipo_consulta === "CODIGO_DESCUENTO"
                                ? "Código de descuento"
                                : convenio.tipo_consulta === "API_EXTERNA"
                                    ? "API Externa"
                                    : "Sin consulta"}
                        </p>
                    </div>

                    {convenio.tipo_consulta === "CODIGO_DESCUENTO" && (
                        <>
                            <div>
                                <p className="text-sm font-medium leading-none">Código</p>
                                <p className="text-sm text-gray-500">{convenio.codigo || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium leading-none">Porcentaje</p>
                                <p className="text-sm text-gray-500">
                                    {convenio.porcentaje_descuento !== undefined
                                        ? `${formatNumber(convenio.porcentaje_descuento)}%`
                                        : "N/A"}
                                </p>
                            </div>
                        </>
                    )}

                    {convenio.tipo_consulta === "API_EXTERNA" && (
                        <div>
                            <p className="text-sm font-medium leading-none">API ID</p>
                            <p className="text-sm text-gray-500">{convenio.api_consulta_id || "N/A"}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-sm font-medium leading-none">Endpoint</p>
                        <p className="text-sm text-muted-foreground">{convenio.endpoint || "N/A"}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Tope Monto Ventas</p>
                        <p className="text-sm text-muted-foreground">
                            {convenio.tope_monto_ventas ? formatNumber(convenio.tope_monto_ventas) : "Sin tope"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Tope Cantidad Tickets</p>
                        <p className="text-sm text-muted-foreground">
                            {convenio.tope_cantidad_tickets ? formatNumber(convenio.tope_cantidad_tickets) : "Sin tope"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Limitar por Stock</p>
                        <p className="text-sm text-muted-foreground">
                            {convenio.limitar_por_stock === null || convenio.limitar_por_stock === undefined
                                ? "N/A"
                                : convenio.limitar_por_stock
                                    ? "Sí"
                                    : "No"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Limitar por Monto</p>
                        <p className="text-sm text-muted-foreground">
                            {convenio.limitar_por_monto === null || convenio.limitar_por_monto === undefined
                                ? "N/A"
                                : convenio.limitar_por_monto
                                    ? "Sí"
                                    : "No"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium leading-none">Fecha de término</p>
                        <p className="text-sm text-muted-foreground">
                            {convenio.fecha_termino ? formatDateOnly(convenio.fecha_termino) : "N/A"}
                        </p>
                    </div>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    )
}
