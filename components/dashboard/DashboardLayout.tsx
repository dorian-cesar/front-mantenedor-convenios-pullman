"use client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: React.ReactNode;
    user?: {
        id: number;
        correo: string;
        nombre: string | null;
        rol: string;
        empresa_id?: number | null;
        empresaId?: number | null;
        id_empresa?: number | null;
        empresa?: { id: number; nombre?: string } | null;
    } | null;
    onLogout: () => void;
}

export function DashboardLayout({
    children,
    user,
    onLogout
}: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [sidebarWidth, setSidebarWidth] = React.useState(256);

    React.useEffect(() => {
        const savedWidth = localStorage.getItem("sidebarWidth");
        if (savedWidth) {
            const width = parseInt(savedWidth, 10);
            if (width >= 160 && width <= 480) {
                setSidebarWidth(width);
            }
        }
    }, []);

    const handleLogout = () => {
        onLogout();
    };

    const handleWidthChange = (newWidth: number) => {
        setSidebarWidth(newWidth);
        localStorage.setItem("sidebarWidth", newWidth.toString());
    };

    return (
        <main className="min-h-screen">
            <div className="hidden lg:block">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    onLogout={handleLogout}
                    width={sidebarWidth}
                    onWidthChange={handleWidthChange}
                />
            </div>

            <MobileSidebar
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
            />

            <Navbar
                sidebarCollapsed={sidebarCollapsed}
                sidebarWidth={sidebarWidth}
                onMobileMenuToggle={() => setMobileMenuOpen(true)}
                user={user}
                onLogout={handleLogout}
            />

            <div
                className={cn(
                    "pt-16 min-h-screen transition-all duration-300",
                    "max-lg:pl-0"
                )}
                style={{ 
                    paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 
                        ? (sidebarCollapsed ? "72px" : `${sidebarWidth}px`) 
                        : "0px" 
                }}
            >
                <div className="p-4 lg:p-6">{children}</div>
            </div>
        </main>
    );
}
