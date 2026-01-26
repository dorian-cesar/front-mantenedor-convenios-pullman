import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusValue = string | number | boolean | null | undefined

const BADGE_STATUS_CLASSES: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    inactive: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
}

function normalizeStatus(value: StatusValue): string {
    if (value === 1 || value === true || value === "active") return "active"
    if (value === 0 || value === false || value === "inactive") return "inactive"
    if (value === "pending") return "pending"
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