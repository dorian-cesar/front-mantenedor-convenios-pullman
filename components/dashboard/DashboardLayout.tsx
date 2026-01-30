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

    const handleLogout = () => {
        onLogout();
    };

    return (
        <main className="min-h-screen">
            <div className="hidden lg:block">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    onLogout={handleLogout}
                />
            </div>

            <MobileSidebar
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
            />

            <Navbar
                sidebarCollapsed={sidebarCollapsed}
                onMobileMenuToggle={() => setMobileMenuOpen(true)}
                user={user}
                onLogout={handleLogout}
            />

            <div
                className={cn(
                    "pt-16 min-h-screen transition-all duration-300",
                    sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
                )}
            >
                <div className="p-4 lg:p-6">{children}</div>
            </div>
        </main>
    );
}
