"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Armchair,
  CheckCheck,
  UserX,
  Ban,
  Hourglass,
  Trash2,
  Pencil,
  Check,
} from "lucide-react";

type Mesa = { id: string; nombre: string; zona: string | null; capacidad_min: number; capacidad_max: number };

type Reserva = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  num_personas: number;
  estado: string;
  mesa_id: string | null;
  notas: string | null;
  clientes: { nombre: string; email: string; telefono: string };
  mesas: { nombre: string; zona: string | null } | null;
  servicio: string | null;
};

const ETIQUETA_SERVICIO: Record<string, string> = { comida: "Comida", cena: "Cena" };

const ESTADOS = [
  "pendiente_confirmacion",
  "confirmada",
  "sentada",
  "completada",
  "no_show",
  "cancelada",
  "lista_espera",
] as const;

const ETIQUETAS_ESTADO: Record<string, string> = {
  pendiente_confirmacion: "Pendiente",
  confirmada: "Confirmada",
  sentada: "Sentada",
  completada: "Completada",
  no_show: "No presentado",
  cancelada: "Cancelada",
  lista_espera: "Lista de espera",
};

const ICONO_ESTADO: Record<string, typeof Clock> = {
  pendiente_confirmacion: Clock,
  confirmada: CheckCircle2,
  sentada: Armchair,
  completada: CheckCheck,
  no_show: UserX,
  cancelada: Ban,
  lista_espera: Hourglass,
};

const DOT_ESTADO: Record<string, string> = {
  pendiente_confirmacion: "bg-state-pending",
  confirmada: "bg-state-confirmed",
  sentada: "bg-state-seated",
  completada: "bg-state-done",
  no_show: "bg-state-noshow",
  cancelada: "bg-state-cancelled",
  lista_espera: "bg-state-waitlist",
};

const TEXTO_ESTADO: Record<string, string> = {
  pendiente_confirmacion: "text-state-pending",
  confirmada: "text-state-confirmed",
  sentada: "text-state-seated",
  completada: "text-state-done",
  no_show: "text-state-noshow",
  cancelada: "text-state-cancelled",
  lista_espera: "text-state-waitlist",
};

const HOVER_FONDO_ESTADO: Record<string, string> = {
  pendiente_confirmacion: "hover:bg-state-pending-bg",
  confirmada: "hover:bg-state-confirmed-bg",
  sentada: "hover:bg-state-seated-bg",
  completada: "hover:bg-state-done-bg",
  no_show: "hover:bg-state-noshow-bg",
  cancelada: "hover:bg-state-cancelled-bg",
  lista_espera: "hover:bg-state-waitlist-bg",
};

const BOTON_ESTADO_ACTIVO: Record<string, string> = {
  pendiente_confirmacion: "bg-state-pending text-white border-state-pending",
  confirmada: "bg-state-confirmed text-white border-state-confirmed",
  sentada: "bg-state-seated text-white border-state-seated",
  completada: "bg-state-done text-white border-state-done",
  no_show: "bg-state-noshow text-white border-state-noshow",
  cancelada: "bg-state-cancelled text-white border-state-cancelled",
  lista_espera: "bg-state-waitlist text-white border-state-waitlist",
};

function aISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}
function aDate(iso: string) {
  return new Date(iso + "T00:00:00");
}
function sumarDias(iso: string, n: number) {
  const d = aDate(iso);
  d.setDate(d.getDate() + n);
  return aISO(d);
}
function inicioSemana(iso: string) {
  const d = aDate(iso);
  const dow = d.getDay(); // 0=domingo..6=sábado
  const offset = dow === 0 ? 6 : dow - 1; // días desde el lunes
  d.setDate(d.getDate() - offset);
  return aISO(d);
}
function formatearFecha(iso: string) {
  const texto = aDate(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
function formatearFechaCorta(iso: string) {
  const texto = aDate(iso).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  return texto.replace(".", "").replace(/^\w/, (c) => c.toUpperCase());
}

// Separa "Barra 2" -> { prefijo: "Barra", numero: "2" }; si no encaja el patrón, todo va a numero.
function partirNombreMesa(nombre: string) {
  const m = nombre.match(/^(.*?)\s*(\d+)\s*$/);
  if (!m) return { prefijo: "", numero: nombre };
  return { prefijo: m[1].trim(), numero: m[2] };
}

export default function BetaPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fecha, setFecha] = useState(() => aISO(new Date()));
  const [vista, setVista] = useState<"dia" | "semana">("dia");
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [menuEstadoId, setMenuEstadoId] = useState<string | null>(null);
  const [menuEstadoPos, setMenuEstadoPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  function alternarMenuEstado(id: string, boton: HTMLElement) {
    if (menuEstadoId === id) {
      setMenuEstadoId(null);
      return;
    }
    const rect = boton.getBoundingClientRect();
    const ANCHO_MENU = 224;
    const ALTO_MENU_ESTIMADO = 320;
    const left = Math.min(rect.left, window.innerWidth - ANCHO_MENU - 8);
    const espacioAbajo = window.innerHeight - rect.bottom;
    if (espacioAbajo < ALTO_MENU_ESTIMADO && rect.top > espacioAbajo) {
      setMenuEstadoPos({ left, bottom: window.innerHeight - rect.top + 4 });
    } else {
      setMenuEstadoPos({ left, top: rect.bottom + 4 });
    }
    setMenuEstadoId(id);
  }

  useEffect(() => {
    if (!menuEstadoId) return;
    function cerrar() {
      setMenuEstadoId(null);
    }
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [menuEstadoId]);

  async function cargarTodo() {
    const [resReservas, resMesas] = await Promise.all([fetch("/api/reservas/listar"), fetch("/api/mesas")]);
    const dataReservas = await resReservas.json();
    const dataMesas = await resMesas.json();
    setReservas(dataReservas.reservas || []);
    setMesas(dataMesas.mesas || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuEstadoId(null);
        setSeleccionId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rango = useMemo(() => {
    if (vista === "dia") return { desde: fecha, hasta: fecha };
    const ini = inicioSemana(fecha);
    return { desde: ini, hasta: sumarDias(ini, 6) };
  }, [vista, fecha]);

  function navegar(direccion: 1 | -1) {
    setFecha((f) => sumarDias(f, direccion * (vista === "semana" ? 7 : 1)));
  }

  const etiquetaRango = useMemo(() => {
    if (vista === "dia") return formatearFecha(fecha);
    const d = aDate(rango.desde);
    const h = aDate(rango.hasta);
    const mismoMes = d.getMonth() === h.getMonth();
    const inicioTxt = d.toLocaleDateString("es-ES", { day: "numeric", month: mismoMes ? undefined : "short" });
    const finTxt = h.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    return `${inicioTxt} – ${finTxt}`;
  }, [vista, fecha, rango]);

  const reservasDelRango = useMemo(
    () =>
      reservas
        .filter((r) => r.fecha >= rango.desde && r.fecha <= rango.hasta)
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio)),
    [reservas, rango]
  );

  const gruposPorFecha = useMemo(() => {
    const mapa = new Map<string, Reserva[]>();
    for (const r of reservasDelRango) {
      const lista = mapa.get(r.fecha) || [];
      lista.push(r);
      mapa.set(r.fecha, lista);
    }
    return Array.from(mapa.entries());
  }, [reservasDelRango]);

  function agruparPorHora(lista: Reserva[]) {
    const mapa = new Map<string, Reserva[]>();
    for (const r of lista) {
      const hora = r.hora_inicio.slice(0, 5);
      const grupo = mapa.get(hora) || [];
      grupo.push(r);
      mapa.set(hora, grupo);
    }
    return Array.from(mapa.entries());
  }

  const seleccion = reservas.find((r) => r.id === seleccionId) || null;

  async function cambiarEstadoPorId(id: string, estado: string) {
    setGuardando(true);
    await fetch(`/api/reservas/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    await cargarTodo();
    setGuardando(false);
  }

  async function cambiarEstado(estado: string) {
    if (!seleccion) return;
    await cambiarEstadoPorId(seleccion.id, estado);
  }

  async function asignarMesa(mesaId: string) {
    if (!seleccion) return;
    setGuardando(true);
    await fetch(`/api/reservas/${seleccion.id}/mesa`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesa_id: mesaId }),
    });
    await cargarTodo();
    setGuardando(false);
  }

  async function eliminarReserva(id: string, nombreCliente?: string) {
    if (!confirm(`¿Eliminar la reserva de ${nombreCliente || "este cliente"}? Esta acción no se puede deshacer.`)) return;
    if (seleccionId === id) setSeleccionId(null);
    await fetch(`/api/reservas/${id}`, { method: "DELETE" });
    await cargarTodo();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl text-ink">Reservas</h1>
            <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-brand">
              Beta
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">Vista de lista con panel de detalle — en pruebas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg bg-surface-sunken p-1">
            {(["dia", "semana"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  vista === v ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {fecha !== aISO(new Date()) && (
            <button
              onClick={() => setFecha(aISO(new Date()))}
              className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-sunken"
            >
              Hoy
            </button>
          )}

          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => navegar(-1)}
              aria-label="Anterior"
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <ChevronLeft size={18} strokeWidth={1.75} />
            </button>
            <span className="min-w-[10rem] text-center text-sm font-medium capitalize text-ink">{etiquetaRango}</span>
            <button
              onClick={() => navegar(1)}
              aria-label="Siguiente"
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <ChevronRight size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        {cargando && (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-sunken" />
            ))}
          </div>
        )}

        {!cargando && gruposPorFecha.length === 0 && (
          <p className="p-10 text-center text-sm text-ink-muted">
            No hay reservas para {vista === "dia" ? "este día" : "esta semana"}.
          </p>
        )}

        {!cargando &&
          gruposPorFecha.map(([fechaGrupo, listaDia], idxFecha) => (
            <div key={fechaGrupo}>
              {vista === "semana" && (
                <div
                  className={`bg-surface px-4 py-2 text-sm font-bold text-ink ${idxFecha > 0 ? "border-t border-line" : ""}`}
                >
                  {formatearFechaCorta(fechaGrupo)}
                </div>
              )}

              {agruparPorHora(listaDia).map(([hora, lista]) => {
                const totalCovers = lista.reduce((acc, r) => acc + r.num_personas, 0);
                return (
                  <div key={hora}>
                    <div className="flex items-center justify-between bg-espresso-900 px-4 py-2.5 text-base font-bold text-white">
                      <span>
                        {hora} · {lista.length} reserva{lista.length === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={16} strokeWidth={1.75} />
                        {totalCovers}
                      </span>
                    </div>
                    <div className="divide-y divide-line">
                      {lista.map((r) => {
                        const IconoEstado = ICONO_ESTADO[r.estado] || Clock;
                        return (
                          <div
                            key={r.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSeleccionId((prev) => (prev === r.id ? null : r.id))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSeleccionId((prev) => (prev === r.id ? null : r.id));
                              }
                            }}
                            className={`group flex w-full cursor-pointer items-center gap-1.5 px-3 py-3.5 text-left transition-colors hover:bg-state-noshow lg:gap-3 lg:px-4 lg:py-4 ${
                              seleccionId === r.id ? "bg-brand-tint" : ""
                            }`}
                          >
                            {/* Estado: primero de la fila, pulsable para cambiarlo sin abrir el panel */}
                            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => alternarMenuEstado(r.id, e.currentTarget)}
                                title={`Estado: ${ETIQUETAS_ESTADO[r.estado] || r.estado} — pulsa para cambiarlo`}
                                className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors group-hover:hover:bg-white/20 lg:w-[150px] lg:px-2 lg:py-2 ${
                                  HOVER_FONDO_ESTADO[r.estado] || "hover:bg-surface-sunken"
                                } ${TEXTO_ESTADO[r.estado] || "text-ink-muted"} group-hover:text-white`}
                              >
                                <IconoEstado size={26} strokeWidth={2} className="shrink-0" />
                                <span className="hidden truncate text-base font-semibold lg:inline">
                                  {ETIQUETAS_ESTADO[r.estado] || r.estado}
                                </span>
                              </button>
                            </div>

                            {/* Móvil / tablet: compacto pero con fuentes grandes */}
                            <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
                              <span className="shrink-0 rounded-md bg-espresso-900 px-1.5 py-1 tabular-nums text-sm font-bold text-white">
                                {r.hora_inicio.slice(0, 5)}
                              </span>
                              <span className="flex-1 truncate text-base font-semibold text-ink group-hover:text-white">
                                {r.clientes?.nombre}
                              </span>
                              <span className="inline-flex shrink-0 items-center gap-0.5 text-sm text-ink-muted group-hover:text-white/85">
                                <Users size={15} strokeWidth={1.75} />
                                {r.num_personas}
                              </span>
                            </div>

                            {/* Escritorio: columnas de ancho fijo, siempre justificadas a la izquierda */}
                            <div className="hidden min-w-0 flex-1 grid-cols-[76px_minmax(350px,1fr)_132px_minmax(110px,1fr)] items-center lg:grid">
                              <span className="w-fit shrink-0 rounded-md bg-espresso-900 px-2.5 py-1 tabular-nums text-lg font-bold text-white">
                                {r.hora_inicio.slice(0, 5)}
                              </span>
                              <span className="truncate pr-3 text-xl font-bold text-ink group-hover:text-white">
                                {r.clientes?.nombre}
                              </span>
                              <span className="text-lg text-ink-muted group-hover:text-white/85">
                                <span className="text-ink-faint group-hover:text-white/50">| </span>
                                Personas:{" "}
                                <span className="font-semibold text-ink group-hover:text-white">{r.num_personas}</span>
                              </span>
                              <span className="truncate pr-3 text-lg text-ink-muted group-hover:text-white/85">
                                <span className="text-ink-faint group-hover:text-white/50">| </span>
                                <span className="font-semibold text-ink group-hover:text-white">
                                  {r.mesas?.nombre || "Sin asignar"}
                                </span>
                              </span>
                            </div>

                            {/* Acciones rápidas */}
                            <div
                              className="ml-auto flex shrink-0 items-center gap-1 pl-2 lg:ml-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={`tel:${r.clientes?.telefono}`}
                                title="Llamar"
                                className="hidden h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/5 hover:text-brand group-hover:text-white/90 group-hover:hover:bg-white/20 group-hover:hover:text-white sm:flex"
                              >
                                <Phone size={20} strokeWidth={1.75} />
                              </a>
                              <a
                                href={`mailto:${r.clientes?.email}`}
                                title="Enviar email"
                                className="hidden h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/5 hover:text-brand group-hover:text-white/90 group-hover:hover:bg-white/20 group-hover:hover:text-white sm:flex"
                              >
                                <Mail size={20} strokeWidth={1.75} />
                              </a>
                              <button
                                onClick={() => eliminarReserva(r.id, r.clientes?.nombre)}
                                title="Eliminar reserva"
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/5 hover:text-state-noshow group-hover:text-white/90 group-hover:hover:bg-white/20 group-hover:hover:text-white lg:h-10 lg:w-10"
                              >
                                <Trash2 size={20} strokeWidth={1.75} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
      </div>

      {menuEstadoId &&
        menuEstadoPos &&
        (() => {
          const reservaMenu = reservas.find((x) => x.id === menuEstadoId);
          if (!reservaMenu) return null;
          return createPortal(
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuEstadoId(null)} aria-hidden="true" />
              <div
                style={{ position: "fixed", left: menuEstadoPos.left, top: menuEstadoPos.top, bottom: menuEstadoPos.bottom }}
                className="z-40 w-56 rounded-lg border border-line bg-surface p-1.5 shadow-popover"
              >
                {ESTADOS.map((estado) => {
                  const Icono = ICONO_ESTADO[estado];
                  const activo = reservaMenu.estado === estado;
                  return (
                    <button
                      key={estado}
                      disabled={guardando}
                      onClick={() => {
                        setMenuEstadoId(null);
                        cambiarEstadoPorId(reservaMenu.id, estado);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors disabled:cursor-wait ${
                        activo ? "bg-surface-sunken text-ink" : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                      }`}
                    >
                      <Icono size={18} strokeWidth={2} className={TEXTO_ESTADO[estado] || "text-ink-muted"} />
                      {ETIQUETAS_ESTADO[estado]}
                      {activo && <Check size={14} strokeWidth={2.5} className="ml-auto text-ink-faint" />}
                    </button>
                  );
                })}
              </div>
            </>,
            document.body
          );
        })()}

      {seleccion && (
        <PanelDetalle
          reserva={seleccion}
          mesas={mesas}
          guardando={guardando}
          onCerrar={() => setSeleccionId(null)}
          onCambiarEstado={cambiarEstado}
          onAsignarMesa={asignarMesa}
          onNotasGuardadas={cargarTodo}
        />
      )}
    </div>
  );
}

function PanelDetalle({
  reserva: r,
  mesas,
  guardando,
  onCerrar,
  onCambiarEstado,
  onAsignarMesa,
  onNotasGuardadas,
}: {
  reserva: Reserva;
  mesas: Mesa[];
  guardando: boolean;
  onCerrar: () => void;
  onCambiarEstado: (estado: string) => void;
  onAsignarMesa: (mesaId: string) => void;
  onNotasGuardadas: () => void;
}) {
  const [notaValor, setNotaValor] = useState(r.notas || "");
  const [guardandoNota, setGuardandoNota] = useState(false);
  const notaCambiada = notaValor !== (r.notas || "");
  const panelRef = useRef<HTMLElement>(null);

  const [editando, setEditando] = useState(false);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [formEdicion, setFormEdicion] = useState({
    nombre: r.clientes?.nombre || "",
    email: r.clientes?.email || "",
    telefono: r.clientes?.telefono || "",
    num_personas: r.num_personas,
  });

  useEffect(() => {
    setNotaValor(r.notas || "");
  }, [r.id, r.notas]);

  useEffect(() => {
    setEditando(false);
    setFormEdicion({
      nombre: r.clientes?.nombre || "",
      email: r.clientes?.email || "",
      telefono: r.clientes?.telefono || "",
      num_personas: r.num_personas,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.id]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onCerrar();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [onCerrar]);

  async function guardarNota() {
    setGuardandoNota(true);
    await fetch(`/api/reservas/${r.id}/notas`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas: notaValor }),
    });
    setGuardandoNota(false);
    onNotasGuardadas();
  }

  async function guardarDatos() {
    setGuardandoDatos(true);
    await fetch(`/api/reservas/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formEdicion),
    });
    setGuardandoDatos(false);
    setEditando(false);
    onNotasGuardadas();
  }

  const { prefijo: mesaPrefijo, numero: mesaNumero } = r.mesas
    ? partirNombreMesa(r.mesas.nombre)
    : { prefijo: "", numero: "—" };

  return (
    <aside
      ref={panelRef}
      className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-line bg-surface shadow-popover sm:w-[420px]"
    >
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-brand text-white">
            <span className="text-[0.6rem] uppercase leading-none tracking-wide opacity-80">{mesaPrefijo || "Mesa"}</span>
            <span className="text-lg font-bold leading-tight">{mesaNumero}</span>
          </div>
          <div className="flex items-center gap-1">
            {!editando && (
              <button
                onClick={() => setEditando(true)}
                aria-label="Editar reserva"
                className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <Pencil size={18} strokeWidth={1.75} />
              </button>
            )}
            <button
              onClick={onCerrar}
              aria-label="Cerrar"
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="px-5 pt-3">
          {editando ? (
            <div className="space-y-2.5">
              <label className="block text-xs font-medium text-ink-muted">
                Nombre
                <input
                  value={formEdicion.nombre}
                  onChange={(e) => setFormEdicion({ ...formEdicion, nombre: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-ink-muted">
                Teléfono
                <input
                  value={formEdicion.telefono}
                  onChange={(e) => setFormEdicion({ ...formEdicion, telefono: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-ink-muted">
                Email
                <input
                  type="email"
                  value={formEdicion.email}
                  onChange={(e) => setFormEdicion({ ...formEdicion, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-ink-muted">
                Personas
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={formEdicion.num_personas}
                  onChange={(e) => setFormEdicion({ ...formEdicion, num_personas: Number(e.target.value) })}
                  className="mt-1 w-24 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={guardarDatos}
                  disabled={guardandoDatos}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  <Check size={14} strokeWidth={2} />
                  Guardar cambios
                </button>
                <button
                  onClick={() => setEditando(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-sunken"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-ink">{r.clientes?.nombre}</h2>
              <div className="mt-1 flex flex-col gap-1 text-sm text-ink-muted">
                <a href={`tel:${r.clientes?.telefono}`} className="inline-flex items-center gap-1.5 hover:text-brand hover:underline">
                  <Phone size={13} strokeWidth={1.75} />
                  {r.clientes?.telefono}
                </a>
                <a href={`mailto:${r.clientes?.email}`} className="inline-flex items-center gap-1.5 hover:text-brand hover:underline">
                  <Mail size={13} strokeWidth={1.75} />
                  {r.clientes?.email}
                </a>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                <span className={`h-2 w-2 rounded-full ${DOT_ESTADO[r.estado] || "bg-ink-faint"}`} />
                {r.mesas?.zona && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} strokeWidth={1.75} />
                    {r.mesas.zona}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users size={13} strokeWidth={1.75} />
                  {r.num_personas}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mx-5 mt-5 border-t border-line pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Reserva</h3>
          <div className="mt-2 space-y-1">
            <p className="text-lg font-bold text-ink">{formatearFecha(r.fecha)}</p>
            <p className="text-lg font-bold text-ink">
              {r.hora_inicio.slice(0, 5)}–{r.hora_fin.slice(0, 5)}
            </p>
            {r.servicio && <p className="text-lg font-bold text-ink">{ETIQUETA_SERVICIO[r.servicio] || r.servicio}</p>}
          </div>
        </div>

        <div className="mx-5 mt-4 border-t border-line pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Estado</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ESTADOS.map((estado) => {
              const Icono = ICONO_ESTADO[estado];
              const activo = r.estado === estado;
              return (
                <button
                  key={estado}
                  disabled={guardando}
                  onClick={() => onCambiarEstado(estado)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
                    activo ? BOTON_ESTADO_ACTIVO[estado] : "border-line text-ink-muted hover:bg-surface-sunken"
                  }`}
                >
                  <Icono size={12} strokeWidth={2.25} />
                  {ETIQUETAS_ESTADO[estado]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-5 mt-4 border-t border-line pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Mesa asignada</h3>
          <select
            value={r.mesa_id || ""}
            disabled={guardando}
            onChange={(e) => onAsignarMesa(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none disabled:cursor-wait"
          >
            <option value="">Sin mesa asignada</option>
            {mesas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} {m.zona ? `— ${m.zona}` : ""} (hasta {m.capacidad_max})
              </option>
            ))}
          </select>
        </div>

        <div className="mx-5 mt-4 border-t border-line pb-6 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Notas internas</h3>
          <textarea
            value={notaValor}
            onChange={(e) => setNotaValor(e.target.value)}
            rows={3}
            placeholder="Alergias, ocasión especial, preferencias..."
            className="mt-2 w-full rounded-lg border border-line bg-surface-warm px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
          {notaCambiada && (
            <div className="mt-1.5 flex gap-2">
              <button
                onClick={guardarNota}
                disabled={guardandoNota}
                className="rounded-lg bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                Guardar nota
              </button>
              <button
                onClick={() => setNotaValor(r.notas || "")}
                className="rounded-lg px-3 py-1 text-xs font-medium text-ink-muted hover:bg-surface-sunken"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
    </aside>
  );
}
