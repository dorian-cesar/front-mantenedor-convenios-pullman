import {
    LayoutDashboard,
    Ticket,
    Building2,
    Handshake,
    Percent,
    Users,
    IdCard,
    QrCode,
} from "lucide-react"

export type NavItem = {
    id: string
    title: string
    href: string
    icon?: React.ElementType
    description?: string
    group: string
    section: "main" | "secondary"
}

export const NAVIGATION: NavItem[] = [
    {
        id: "dashboard",
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Resumen del sistema",
        group: "General",
        section: "main",
    },
    {
        id: "boletos",
        title: "Boletos",
        href: "/dashboard/eventos",
        icon: Ticket,
        description: "eventos · viajes · tickets · pasajes · ventas",
        group: "Operación",
        section: "main",
    },
    {
        id: "empresas",
        title: "Empresas",
        href: "/dashboard/empresas",
        icon: Building2,
        description: "empresas · compañias · organizaciones · clientes",
        group: "Empresas",
        section: "main",
    },
    {
        id: "convenios",
        title: "Convenios",
        href: "/dashboard/convenios",
        icon: Handshake,
        description: "convenios · beneficios · alianzas",
        group: "Convenios y Beneficios",
        section: "main",
    },
    {
        id: "descuentos",
        title: "Descuentos",
        href: "/dashboard/descuentos",
        icon: Percent,
        description: "codigos · descuentos · promociones · cupones",
        group: "Convenios y Beneficios",
        section: "main",
    },
    {
        id: "codigos",
        title: "Codigos de Descuento",
        href: "/dashboard/codigos",
        icon: QrCode,
        description: "codigos · descuentos · promociones · cupones",
        group: "Convenios y Beneficios",
        section: "main",
    },
    {
        id: "usuarios",
        title: "Usuarios y Roles",
        href: "/dashboard/usuarios",
        icon: Users,
        description: "usuarios · roles · accesos",
        group: "Seguridad",
        section: "secondary",
    },
    {
        id: "pasajeros",
        title: "Pasajeros",
        href: "/dashboard/pasajeros",
        icon: IdCard,
        description: "pasajeros · clientes · personas · tipos de usuarios",
        group: "Operación",
        section: "secondary",
    },
]
