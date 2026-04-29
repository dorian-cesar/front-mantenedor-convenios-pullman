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
    ShieldUser,
    Swords,
    BookUser,
    FileDown
} from "lucide-react"

export type UserRole = "SUPER_USUARIO" | "USUARIO" | "SISTEMA"

export type NavItem = {
    id: string
    title: string
    href?: string
    icon?: React.ElementType
    description?: string
    group: string
    section: "main" | "secondary" | "tertiary" | "sub"
    children?: NavItem[]
    roles?: UserRole[]
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
        roles: ["SUPER_USUARIO"]
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
        id: "consulta-tickets",
        title: "Consulta Tickets Kupos",
        href: "/dashboard/consulta-tickets",
        icon: QrCode,
        description: "consulta · tickets · boletos · kupos · pnr",
        group: "Operación",
        section: "main",
        roles: ["SUPER_USUARIO", "USUARIO", "SISTEMA"]
    },
    {
        id: "empresas",
        title: "Empresas",
        href: "/dashboard/empresas",
        icon: Building2,
        description: "empresas · compañias · organizaciones · clientes",
        group: "Empresas",
        section: "main",
        roles: ["SUPER_USUARIO", "USUARIO", "SISTEMA"]
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
        id: "tablas-clientes-corporativos",
        title: "Clientes Corporativos",
        href: "/dashboard/tablas-clientes-corporativos",
        icon: Building2,
        description: "nóminas · empresas · tablas dinámicas · grupos",
        group: "Empresas",
        section: "main",
        roles: ["SUPER_USUARIO"]
    },
    {
        id: "api",
        title: "API Externa",
        href: "/dashboard/apis",
        icon: Plug,
        description: "endpoints · integraciones · terceros · externos · api · url",
        group: "Convenios y Beneficios",
        section: "secondary",
        roles: ["SUPER_USUARIO"]
    },
    {
        id: "api-registro",
        title: "API Registro",
        href: "/dashboard/apis-registro",
        icon: BookUser,
        description: "registro · beneficiarios · api · beneficios · inscripción",
        group: "Convenios y Beneficios",
        section: "secondary",
        roles: ["SUPER_USUARIO"]
    },
    {
        id: "beneficios",
        title: "Beneficios",
        icon: Gift,
        description: "gestión de beneficios y convenios",
        group: "Convenios y Beneficios",
        section: "secondary",
        roles: ["SUPER_USUARIO", "SISTEMA"],
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
                title: "Pasajeros Frecuentes",
                href: "/dashboard/beneficios/usuarios-frecuentes",
                icon: BadgeCheck,
                description: "beneficios · alianzas · usuarios frecuentes · descuentos",
                group: "Convenios y Beneficios",
                section: "sub",
            },
            {
                id: "carabineros",
                title: "Carabineros",
                href: "/dashboard/beneficios/carabineros",
                icon: ShieldUser,
                description: "beneficios · alianzas · carabineros · descuentos",
                group: "Convenios y Beneficios",
                section: "sub",
            },
            {
                id: "fach",
                title: "Armada de Chile",
                href: "/dashboard/beneficios/fach",
                icon: Swords,
                description: "beneficios · alianzas · armada · descuentos",
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
        roles: ["SUPER_USUARIO"],
    },
    {
        id: "pasajeros",
        title: "Pasajeros",
        href: "/dashboard/pasajeros",
        icon: IdCard,
        description: "pasajeros · clientes · personas · tipos de usuarios",
        group: "Operación",
        section: "tertiary",
        roles: ["SUPER_USUARIO", "SISTEMA"]
    },
    {
        id: "exportaciones",
        title: "Exportaciones",
        href: "/dashboard/exportaciones",
        icon: FileDown,
        description: "exportar datos · descargar · beneficiarios",
        group: "Reportes",
        section: "tertiary",
        roles: ["SUPER_USUARIO"]
    },
]
