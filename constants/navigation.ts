import {
    LayoutDashboard,
    Ticket,
    Building2,
    Handshake,
    Percent,
    Users,
    IdCard,
    QrCode,
    Plug,
    Gift,
    HeartHandshake,
    BadgeCheck,
    GraduationCap,
} from "lucide-react"

export type NavItem = {
    id: string
    title: string
    href?: string
    icon?: React.ElementType
    description?: string
    group: string
    section: "main" | "secondary" | "tertiary" | "sub"
    children?: NavItem[]
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
        id: "api",
        title: "API Externa",
        href: "/dashboard/apis",
        icon: Plug,
        description: "endpoints · integraciones · terceros · externos · api · url",
        group: "Convenios y Beneficios",
        section: "secondary",
    },
    {
        id: "beneficios",
        title: "Beneficios",
        icon: Gift,
        description: "gestión de beneficios y convenios",
        group: "Convenios y Beneficios",
        section: "secondary",
        children: [
            {
                id: "mayores",
                title: "Adultos Mayores",
                href: "/dashboard/beneficios/adultos-mayores",
                icon: HeartHandshake,
                description: "beneficios · alianzas · adultos mayores · descuentos",
                group: "Convenios y Beneficios",
                section: "sub",
            },
            {
                id: "estudiantes",
                title: "Estudiantes",
                href: "/dashboard/beneficios/estudiantes",
                icon: GraduationCap,
                description: "beneficios · alianzas · estudiantes · descuentos",
                group: "Convenios y Beneficios",
                section: "sub",
            },
            {
                id: "frecuentes",
                title: "Usuarios Frecuentes",
                href: "/dashboard/beneficios/usuarios-frecuentes",
                icon: BadgeCheck,
                description: "beneficios · alianzas · usuarios frecuentes · descuentos",
                group: "Convenios y Beneficios",
                section: "sub",
            },
        ],
    },
    {
        id: "usuarios",
        title: "Usuarios",
        href: "/dashboard/usuarios",
        icon: Users,
        description: "usuarios · roles · accesos",
        group: "Seguridad",
        section: "tertiary",
    },
    {
        id: "pasajeros",
        title: "Pasajeros",
        href: "/dashboard/pasajeros",
        icon: IdCard,
        description: "pasajeros · clientes · personas · tipos de usuarios",
        group: "Operación",
        section: "tertiary",
    },
]
