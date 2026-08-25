"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, LayoutGrid, Clock, CalendarRange, Map, Rows3, Menu, X } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Reservas", icon: CalendarCheck },
  { href: "/admin/beta", label: "Reservas", icon: Rows3, beta: true },
  { href: "/admin/plano", label: "Plano", icon: Map },
  { href: "/admin/mesas", label: "Mesas", icon: LayoutGrid },
  { href: "/admin/horarios", label: "Horarios", icon: Clock },
  { href: "/admin/temporadas", label: "Temporadas", icon: CalendarRange },
];

function esActivo(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-7">
        <p className="font-serif italic text-xl leading-tight text-white">La Mazaroca</p>
        <p className="mt-0.5 text-xs uppercase tracking-wider text-white/45">Panel de reservas</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon, beta }) => {
          const activo = esActivo(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={activo ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.925rem] transition-colors ${
                activo
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} className="shrink-0" />
              {label}
              {beta && (
                <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white/80">
                  Beta
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-white/40">Bodega La Mazaroca &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Sidebar de escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-espresso-900 md:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Barra superior + drawer en móvil */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-md p-1.5 text-ink hover:bg-surface-sunken"
        >
          <Menu size={22} strokeWidth={1.75} />
        </button>
        <p className="font-serif italic text-lg text-ink">La Mazaroca</p>
      </header>

      {menuAbierto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-espresso-950/50"
            onClick={() => setMenuAbierto(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-espresso-900 shadow-popover">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
                className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <SidebarContent pathname={pathname} onNavigate={() => setMenuAbierto(false)} />
          </div>
        </div>
      )}

      <main className="md:pl-64">
        <div
          className={
            pathname === "/admin/plano" || pathname === "/admin/beta"
              ? "px-5 py-8 md:px-8 md:py-8"
              : "mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-10"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}
