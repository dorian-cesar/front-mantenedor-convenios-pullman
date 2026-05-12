import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusValue = string | number | boolean | null | undefined

const BADGE_STATUS_CLASSES: Record<string, string> = {
    active: "bg-green-500/50 text-green-900 dark:text-black hover:bg-green-100",
    inactive: "bg-red-500/50 text-red-900 dark:text-black hover:bg-red-100",
    pending: "bg-yellow-500/50 text-yellow-900 dark:text-black hover:bg-yellow-100",
    expirado: "bg-slate-500/50 text-slate-900 dark:text-black hover:bg-slate-100",
}

function normalizeStatus(value: StatusValue): string {
    const v = String(value).toLowerCase();
    if (v === "1" || v === "true" || v === "active" || v === "activo" || v === "completado" || v === "confirmado" || v === "success") return "active"
    if (v === "0" || v === "false" || v === "inactive" || v === "inactivo" || v === "cancelado" || v === "anulado" || v === "failed") return "inactive"
    if (v === "pending" || v === "rechazado" || v === "error_confirmacion" || v === "revisar") return "pending"
    if (v === "expirado") return "expirado"
    return "pending"
}

interface BadgeStatusProps extends React.ComponentProps<typeof Badge> {
    status: StatusValue
    children: React.ReactNode
}

export function BadgeStatus({
    status,
    children,
    className,
    variant = null, // Deshabilitamos las variantes por defecto
    ...props
}: BadgeStatusProps) {
    const normalized = normalizeStatus(status)
    const statusClasses = BADGE_STATUS_CLASSES[normalized] ?? "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100"

    return (
        <Badge
            className={cn(statusClasses, className)}
            variant={variant}
            {...props}
        >
            {children}
        </Badge>
    )
}