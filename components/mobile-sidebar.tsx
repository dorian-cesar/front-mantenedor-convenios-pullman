"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NAVIGATION, NavItem } from "@/constants/navigation";
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

    const paddingLeft = depth === 0 ? "px-3" : "pl-11";

    if (hasChildren) {
      return (
        <Collapsible
          key={item.id}
          open={isOpen}
          onOpenChange={() => toggleMenu(item.id)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
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
                  "h-4 w-4 shrink-0 transition-transform",
                  isOpen ? "rotate-180" : ""
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            {item.children?.map(child => renderNavItem(child, depth + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href || "#"}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
          paddingLeft,
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
        <span>{item.title}</span>
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
              className="object-contain transition-opacity duration-300 h-10"
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