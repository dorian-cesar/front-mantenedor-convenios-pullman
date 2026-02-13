"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NAVIGATION, NavItem } from "@/constants/navigation";
import { useEffect, useState } from "react";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    onLogout: () => void;
}

export function Sidebar({ collapsed, onToggle, onLogout }: SidebarProps) {
    const pathname = usePathname();
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setMounted(true);

        // Auto-abrir menú si algún hijo está activo
        const initialOpenState: Record<string, boolean> = {};
        NAVIGATION.forEach(item => {
            if (item.children?.some(child => pathname === child.href)) {
                initialOpenState[item.id] = true;
            }
        });
        setOpenMenus(initialOpenState);
    }, [pathname]);

    if (!mounted) {
        return null;
    }

    const currentTheme = theme === "system" ? systemTheme : theme;

    const toggleMenu = (itemId: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const isChildActive = (children: NavItem[] = []) => {
        return children.some(child => pathname === child.href);
    };

    const renderNavItem = (item: NavItem, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isActive = item.href ? pathname === item.href : false;
        const isChildActiveFlag = isChildActive(item.children);
        const isOpen = openMenus[item.id];

        const paddingLeft = collapsed ? "px-3" : depth === 0 ? "px-3" : "pl-11";

        const ItemContent = (
            <div
                className={cn(
                    "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors w-full",
                    paddingLeft,
                    (isActive || isChildActiveFlag) && !hasChildren
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
            >
                {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                {!collapsed && (
                    <>
                        <span className="flex-1 text-left">{item.title}</span>
                        {hasChildren && (
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 shrink-0 transition-transform mr-2",
                                    isOpen ? "rotate-180" : ""
                                )}
                            />
                        )}
                    </>
                )}
            </div>
        );

        if (collapsed) {
            if (hasChildren) {
                return (
                    <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-start px-3 py-2.5 h-auto"
                                onClick={() => toggleMenu(item.id)}
                            >
                                {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                );
            }
            return (
                <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                        <Link
                            href={item.href || "#"}
                            className={cn(
                                "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-primary"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                        >
                            {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
            );
        }

        // Modo expandido
        if (hasChildren) {
            return (
                <Collapsible
                    key={item.id}
                    open={isOpen}
                    onOpenChange={() => toggleMenu(item.id)}
                >
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors w-full",
                                paddingLeft,
                                (isActive || isChildActiveFlag)
                                    ? "bg-sidebar-accent text-sidebar-primary"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                        >
                            {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                            <span className="flex-1 text-left">{item.title}</span>
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 shrink-0 transition-transform mr-2",
                                    isOpen ? "rotate-180" : ""
                                )}
                            />
                        </button>
                    </CollapsibleTrigger>


                    <CollapsibleContent className="mt-1 space-y-1">
                        {item.children?.map(child => renderNavItem(child, depth + 1))}
                    </CollapsibleContent>
                </Collapsible>
            );
        }

        // Item sin hijos
        return (
            <Link
                key={item.id}
                href={item.href || "#"}
                className={cn(
                    "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
                    paddingLeft,
                    isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
            >
                {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                {!collapsed && <span>{item.title}</span>}
            </Link>
        );
    };

    const renderNavItems = (items: typeof NAVIGATION) => {
        return items.map(item => renderNavItem(item));
    };

    const getLogoPath = () => {
        if (!mounted) return "/logo-wit-dark.png";

        const isDarkTheme = currentTheme === "dark";
        const variant = isDarkTheme ? "light" : "dark";
        const size = collapsed ? "mini-" : "";

        return `/logo-wit-${size}${variant}.png`;
    };

    const getLogoAlt = () => {
        if (collapsed) {
            return "logo";
        } else {
            const themeName = currentTheme === "dark" ? "Oscuro" : "Claro";
            return `logo ${themeName}`;
        }
    };

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
                    collapsed ? "w-[72px]" : "w-64"
                )}
            >
                <div className="flex h-16 items-center justify-center px-4 border-b border-sidebar-border">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <img
                            src={getLogoPath()}
                            alt={getLogoAlt()}
                            className={cn(
                                "object-contain transition-opacity duration-300",
                                collapsed ? "h-10 w-10" : "h-10"
                            )}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (currentTheme === "dark") {
                                    target.src = "/logo-wit-light.png";
                                } else {
                                    target.src = "/logo-wit-dark.png";
                                }
                            }}
                        />
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <div className="flex flex-col gap-1 px-3">
                        {renderNavItems(
                            NAVIGATION.filter((item) => item.section === "main")
                        )}
                    </div>

                    <div className="my-4 border-t border-sidebar-border" />

                    <div className="flex flex-col gap-1 px-3">
                        {renderNavItems(
                            NAVIGATION.filter((item) => item.section === "secondary")
                        )}
                    </div>

                    <div className="my-4 border-t border-sidebar-border" />

                    <div className="flex flex-col gap-1 px-3">
                        {renderNavItems(
                            NAVIGATION.filter((item) => item.section === "tertiary")
                        )}
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
                                    onClick={onLogout}
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
                            onClick={onLogout}
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