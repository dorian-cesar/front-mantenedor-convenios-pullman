"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NAVIGATION } from "@/constants/navigation";
import { useEffect, useState } from "react";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function MobileSidebar({ open, onClose, onLogout }: MobileSidebarProps) {
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  const renderNavItems = (items: typeof NAVIGATION) =>
    items.map((item) => {
      const isActive = pathname === item.href;

      return (
        <Link
          key={item.id}
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
          <span>{item.title}</span>
        </Link>
      );
    });

  const getLogoPath = () => {
    if (!mounted) return "/logo-wit-dark.png";

    const isDarkTheme = currentTheme === "dark";

    const variant = isDarkTheme ? "light" : "dark";

    return `/logo-wit-${variant}.png`;
  };

  const getLogoAlt = () => {
    const themeName = currentTheme === "dark" ? "Oscuro" : "Claro";
    return `logo ${themeName}`;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-64 p-0 bg-background border-sidebar-border flex flex-col"
      >
        <SheetHeader className="flex h-16 items-center px-4 border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-3">
            <img
              src={getLogoPath()}
              alt={getLogoAlt()}
              className={cn(
                "object-contain transition-opacity duration-300 h-10"
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
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="flex flex-col gap-1">
            {renderNavItems(
              NAVIGATION.filter((item) => item.section === "main")
            )}
          </div>

          <div className="my-4 border-t border-sidebar-border" />

          <div className="flex flex-col gap-1">
            {renderNavItems(
              NAVIGATION.filter((item) => item.section === "secondary")
            )}
          </div>

          <div className="my-4 border-t border-sidebar-border" />

          <div className="flex flex-col gap-1">
            {renderNavItems(
              NAVIGATION.filter((item) => item.section === "tertiary")
            )}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}