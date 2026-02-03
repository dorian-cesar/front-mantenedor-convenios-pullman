import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type RoleValue = string | number | boolean | null | undefined


type NormalizedRole = "user" | "admin" | "superuser"

const BADGE_STATUS_CLASSES: Record<string, string> = {
    user: "bg-blue-500/50 text-blue-900 dark:text-black hover:bg-blue-100",
    admin: "bg-red-500/50 text-red-900 dark:text-black hover:bg-red-100",
    superuser: "bg-yellow-500/50 text-yellow-900 dark:text-black hover:bg-yellow-100",
}

const ROLE_SYNONYMS: Record<NormalizedRole, string[]> = {
    user: [
        "user",
        "usuario",
    ],
    admin: [
        "admin",
        "administrador",
        "administrator",
    ],
    superuser: [
        "superuser",
        "superusuario",
        "super_user",
        "super-usuario",
    ],
}

function normalizeRole(value: RoleValue): NormalizedRole {
    if (!value) return "user"

    const normalizedInput = String(value)
        .toLowerCase()
        .replace(/[\s_-]/g, "")

    for (const [role, variants] of Object.entries(ROLE_SYNONYMS)) {
        if (
            variants.some(
                variant =>
                    variant.replace(/[\s_-]/g, "") === normalizedInput
            )
        ) {
            return role as NormalizedRole
        }
    }

    return "user"
}

interface BadgeRoleProps extends React.ComponentProps<typeof Badge> {
    status: RoleValue
    children: React.ReactNode
}

export function BadgeRole({
    status,
    children,
    className,
    variant = null, // Deshabilitamos las variantes por defecto
    ...props
}: BadgeRoleProps) {
    const normalized = normalizeRole(status)
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