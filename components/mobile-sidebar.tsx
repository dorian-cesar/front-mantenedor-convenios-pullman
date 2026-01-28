"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { NAVIGATION } from "@/constants/navigation";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-64 p-0 bg-background border-sidebar-border flex flex-col"
      >
        {/* HEADER */}
        <SheetHeader className="flex h-16 items-center px-4 border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">
              AdminPanel
            </span>
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
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
