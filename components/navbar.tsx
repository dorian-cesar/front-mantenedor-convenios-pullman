"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/NavSearch"
import { ThemeToggle } from "./ThemeToggle";



interface NavbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
  user?: {
    id: number;
    correo: string;
    nombre: string | null;
    rol: string;
  } | null;
  onLogout: () => void;
}

export function Navbar({
  sidebarCollapsed,
  onMobileMenuToggle,
  user,
  onLogout
}: NavbarProps) {

  const getInitials = () => {
    if (!user?.nombre) return user?.correo?.charAt(0).toUpperCase() || "AD";

    const names = user.nombre.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  // Obtener nombre a mostrar
  const getDisplayName = () => {
    return user?.nombre || user?.correo?.split('@')[0] || "Usuario";
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-sm transition-all duration-300",
        sidebarCollapsed ? "left-[72px]" : "left-64",
        "max-lg:left-0"
      )}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-foreground"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="w-full">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* <Button variant="ghost" size="icon" className="md:hidden text-foreground">
            <Search className="h-5 w-5" />
            <span className="sr-only">Buscar</span>
          </Button> */}

          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-foreground">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                  4
                </Badge>
                <span className="sr-only">Notificaciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Notificaciones</span>
                  <Badge variant="secondary" className="text-xs">
                    4 nuevas
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-medium text-sm">Nuevo usuario registrado</span>
                </div>
                <span className="text-xs text-muted-foreground pl-4">
                  Hace 5 minutos
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-medium text-sm">Pedido completado #1234</span>
                </div>
                <span className="text-xs text-muted-foreground pl-4">
                  Hace 15 minutos
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-3" />
                  <span className="font-medium text-sm">Alerta de inventario bajo</span>
                </div>
                <span className="text-xs text-muted-foreground pl-4">
                  Hace 1 hora
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center text-primary cursor-pointer">
                Ver todas las notificaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 hover:bg-secondary"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">
                    {getDisplayName()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.correo || "admin@example.com"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                  <ThemeToggle />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={onLogout}
              >
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
