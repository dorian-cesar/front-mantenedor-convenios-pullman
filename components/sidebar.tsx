"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Settings,
    FileText,
    Package,
    Mail,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const mainNavItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Analíticas",
        href: "/analytics",
        icon: BarChart3,
    },
    {
        title: "Usuarios",
        href: "/users",
        icon: Users,
    },
    {
        title: "Productos",
        href: "/products",
        icon: Package,
    },
    {
        title: "Documentos",
        href: "/documents",
        icon: FileText,
    },
    {
        title: "Mensajes",
        href: "/messages",
        icon: Mail,
        badge: 3,
    },
];

const secondaryNavItems = [
    {
        title: "Configuración",
        href: "/settings",
        icon: Settings,
    },
    {
        title: "Ayuda",
        href: "/help",
        icon: HelpCircle,
    },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
                    collapsed ? "w-[72px]" : "w-64"
                )}
            >
                <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary overflow-hidden">
                            <img
                                src="/logo-wit-light.png"
                                alt="logo-wit"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        {!collapsed && (
                            <span className="font-semibold text-lg text-sidebar-foreground">
                                WIT - admin
                            </span>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <div className="flex flex-col gap-1">
                        {mainNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            const NavContent = (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-primary"
                                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {!collapsed && (
                                        <>
                                            <span>{item.title}</span>
                                            {item.badge && (
                                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {collapsed && item.badge && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );

                            if (collapsed) {
                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>{NavContent}</TooltipTrigger>
                                        <TooltipContent side="right" className="flex items-center gap-2">
                                            {item.title}
                                            {item.badge && (
                                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return NavContent;
                        })}
                    </div>

                    <div className="my-4 border-t border-sidebar-border" />

                    <div className="flex flex-col gap-1">
                        {secondaryNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            const NavContent = (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-primary"
                                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {!collapsed && <span>{item.title}</span>}
                                </Link>
                            );

                            if (collapsed) {
                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>{NavContent}</TooltipTrigger>
                                        <TooltipContent side="right">{item.title}</TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return NavContent;
                        })}
                    </div>
                </nav>

                <div className="border-t border-sidebar-border p-3">
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                >
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Cerrar sesión</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                            <LogOut className="h-5 w-5" />
                            Cerrar sesión
                        </Button>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="absolute -right-3 top-5 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar hover:bg-sidebar-accent"
                >
                    {collapsed ? (
                        <ChevronRight className="h-3 w-3" />
                    ) : (
                        <ChevronLeft className="h-3 w-3" />
                    )}
                </Button>
            </aside>
        </TooltipProvider>
    );
}
