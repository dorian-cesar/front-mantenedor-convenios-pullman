"use client";

import { Bell, Search, Menu, UserCheck } from "lucide-react";
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
    empresa_id?: number | null;
    empresaId?: number | null;
    id_empresa?: number | null;
    empresa?: { id: number; nombre?: string } | null;
  } | null;
  onLogout: () => void;
}

export function Navbar({
  sidebarCollapsed,
  onMobileMenuToggle,
  user,
  onLogout
}: NavbarProps) {
  
  const findEmpresaId = (obj: any): any => {
      if (!obj) return null;

      const standard = obj.empresa_id || obj.empresaId || obj.id_empresa || obj.empresa?.id || obj.user?.empresa_id || obj.user?.id_empresa;
      if (standard) return standard;
      
      for (const key in obj) {
          const val = obj[key];
          const keyLower = key.toLowerCase();
          
          if (keyLower.includes('empresa') || keyLower.includes('emp_id')) {
              if (typeof val === 'number') return val;
              if (typeof val === 'string' && /^\d+$/.test(val)) return parseInt(val, 10);
          }
          
          if (typeof val === 'object' && val !== null) {
              const nested = findEmpresaId(val);
              if (nested) return nested;
          }
      }
      return null;
  };

  const finalEmpresaId = findEmpresaId(user);
  
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
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary border border-border rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-wider shadow-sm">
               <span className="w-1.5 h-1.5 rounded-full bg-primary" />
               ROL: {user?.rol || "S/R"}
               {user?.rol !== "SUPER_USUARIO" && (
                 <>
                   <span className="mx-1 opacity-20">|</span>
                   ID EMPRESA: {finalEmpresaId || "0"}
                 </>
               )}
            </span>
          </div>


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
