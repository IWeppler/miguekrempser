"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  Sprout,
  History,
  PanelLeft,
  Map,
} from "lucide-react";
import { Button } from "@/shared/ui/button";

const menuItems = [
  { name: "Panel", href: "/", icon: LayoutDashboard },
  { name: "Stock", href: "/stock", icon: Package },
  { name: "Movimientos", href: "/movimientos", icon: History },
  { name: "Finanzas", href: "/finanzas", icon: FileText },
  { name: "Lotes", href: "/lotes", icon: Map },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "hidden md:flex flex-col h-full border-r transition-all duration-300",
        "bg-sidebar border-sidebar-border",
        isCollapsed ? "w-[70px]" : "w-64",
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div
          className={cn(
            "flex items-center w-full",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          {/* LOGO */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-bold text-sidebar-primary overflow-hidden whitespace-nowrap transition-all">
              <Sprout className="h-6 w-6 shrink-0" />
              <span>AgroGestión</span>
            </div>
          )}

          {/* TOGGLE BUTTON */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <PanelLeft
              className={cn(
                "h-5 w-5 transition-all",
                isCollapsed && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      {/* 2. NAVEGACIÓN */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative group",

                    // ESTADOS SEMÁNTICOS:
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary shadow-sm border border-sidebar-border border-l-4 border-l-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",

                    isCollapsed && "justify-center px-2",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive
                        ? "text-sidebar-primary"
                        : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                    )}
                  />

                  {/* Texto: Solo visible si no está colapsado */}
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden transition-all">
                      {item.name}
                    </span>
                  )}

                  {/* Tooltip flotante para modo colapsado */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border shadow-md">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
