import {
    LayoutDashboard,
    Ticket,
    Building2,
    Handshake,
    Percent,
    Users,
    IdCard,
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
        href: "/test",
        icon: LayoutDashboard,
        description: "Resumen del sistema",
        group: "General",
        section: "main",
    },
    {
        id: "boletos",
        title: "Boletos",
        href: "/test/eventos",
        icon: Ticket,
        description: "eventos · viajes · tickets · pasajes · ventas",
        group: "Operación",
        section: "main",
    },
    {
        id: "empresas",
        title: "Empresas",
        href: "/test/empresas",
        icon: Building2,
        description: "empresas · compañias · organizaciones · clientes",
        group: "Empresas",
        section: "main",
    },
    {
        id: "convenios",
        title: "Convenios",
        href: "/test/convenios",
        icon: Handshake,
        description: "convenios · beneficios · alianzas",
        group: "Convenios y Beneficios",
        section: "main",
    },
    {
        id: "descuentos",
        title: "Descuentos",
        href: "/test/descuentos",
        icon: Percent,
        description: "descuentos · promociones · cupones",
        group: "Convenios y Beneficios",
        section: "main",
    },
    {
        id: "usuarios",
        title: "Usuarios y Roles",
        href: "/test/usuarios",
        icon: Users,
        description: "usuarios · roles · accesos",
        group: "Seguridad",
        section: "secondary",
    },
    {
        id: "pasajeros",
        title: "Pasajeros",
        href: "/test/pasajeros",
        icon: IdCard,
        description: "pasajeros · clientes",
        group: "Operación",
        section: "secondary",
    },
]
