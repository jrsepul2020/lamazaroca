"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarX2,
  Search,
  Users,
  Phone,
  Mail,
  UtensilsCrossed,
  Moon,
  Clock,
  CheckCircle2,
  Armchair,
  CheckCheck,
  UserX,
  Ban,
  Hourglass,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
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

const ESTILO_ESTADO: Record<string, string> = {
  pendiente_confirmacion: "bg-state-pending text-white",
  confirmada: "bg-state-confirmed text-white",
  sentada: "bg-state-seated text-white",
  completada: "bg-state-done text-white",
  no_show: "bg-state-noshow text-white",
  cancelada: "bg-state-cancelled text-white",
  lista_espera: "bg-state-waitlist text-white",
};

const BORDE_ESTADO: Record<string, string> = {
  pendiente_confirmacion: "border-state-pending",
  confirmada: "border-state-confirmed",
  sentada: "border-state-seated",
  completada: "border-state-done",
  no_show: "border-state-noshow",
  cancelada: "border-state-cancelled",
  lista_espera: "border-state-waitlist",
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

const COLUMNAS = "grid-cols-[88px_96px_1fr_64px_150px_auto]";

function formatearFecha(fecha: string) {
  const d = new Date(fecha + "T00:00:00");
  const texto = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// --- Utilidades de fecha (todo en horario local, formato ISO YYYY-MM-DD) ---
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
function sumarMeses(iso: string, n: number) {
  const d = aDate(iso);
  d.setMonth(d.getMonth() + n, 1);
  return aISO(d);
}
function inicioSemana(iso: string) {
  const d = aDate(iso);
  const dow = d.getDay(); // 0=domingo..6=sábado
  const offset = dow === 0 ? 6 : dow - 1; // días desde el lunes
  d.setDate(d.getDate() - offset);
  return aISO(d);
}
function inicioMes(iso: string) {
  const d = aDate(iso);
  d.setDate(1);
  return aISO(d);
}
function finMes(iso: string) {
  const d = aDate(iso);
  d.setMonth(d.getMonth() + 1, 0); // día 0 del mes siguiente = último día de este mes
  return aISO(d);
}
function formatearFechaCorta(iso: string) {
  const texto = aDate(iso).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  return texto.replace(".", "").replace(/^\w/, (c) => c.toUpperCase());
}

function EstadoBadge({ estado }: { estado: string }) {
  const Icono = ICONO_ESTADO[estado];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        ESTILO_ESTADO[estado] || "bg-surface-sunken text-ink-muted"
      }`}
    >
      {Icono && <Icono size={12} strokeWidth={2.25} />}
      {ETIQUETAS_ESTADO[estado] || estado}
    </span>
  );
}

// Separa "Barra 2" -> { prefijo: "Barra", numero: "2" }; si no encaja el patrón, todo va a numero.
function partirNombreMesa(nombre: string) {
  const m = nombre.match(/^(.*?)\s*(\d+)\s*$/);
  if (!m) return { prefijo: "", numero: nombre };
  return { prefijo: m[1].trim(), numero: m[2] };
}

function NotasControl({ id, notas, onGuardado }: { id: string; notas: string | null; onGuardado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState(notas || "");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    await fetch(`/api/reservas/${id}/notas`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas: valor }),
    });
    setGuardando(false);
    setAbierto(false);
    onGuardado();
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        title={notas ? "Ver / editar nota" : "Añadir nota"}
        className={`inline-flex items-center justify-center rounded-md p-1 transition-colors ${
          notas ? "text-brand hover:bg-brand-tint" : "text-ink-faint hover:bg-surface-sunken hover:text-ink-muted"
        }`}
      >
        <MessageSquare size={14} strokeWidth={1.75} fill={notas ? "currentColor" : "none"} fillOpacity={notas ? 0.15 : 0} />
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} aria-hidden="true" />
          <div className="absolute left-0 top-full z-20 mt-1.5 w-72 rounded-lg border border-line bg-surface p-3 text-left shadow-popover">
            <textarea
              autoFocus
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              rows={3}
              placeholder="Nota interna (alergias, ocasión especial...)"
              className="w-full rounded-lg border border-line bg-surface-warm px-2.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
            />
            <div className="mt-1.5 flex gap-2">
              <button
                onClick={guardar}
                disabled={guardando}
                className="rounded-lg bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setValor(notas || "");
                  setAbierto(false);
                }}
                className="rounded-lg px-3 py-1 text-xs font-medium text-ink-muted hover:bg-surface-sunken"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </span>
  );
}

export default function AdminPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroServicio, setFiltroServicio] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState<string | null>(null);

  const hoy = useMemo(() => aISO(new Date()), []);
  const [vista, setVista] = useState<"dia" | "semana" | "mes">("semana");
  const [fechaAncla, setFechaAncla] = useState(hoy);
  const sliderRef = useRef<HTMLDivElement>(null);

  async function cargarTodo() {
    setCargando(true);
    const [resReservas, resMesas] = await Promise.all([
      fetch("/api/reservas/listar"),
      fetch("/api/mesas"),
    ]);
    const dataReservas = await resReservas.json();
    const dataMesas = await resMesas.json();
    setReservas(dataReservas.reservas || []);
    setMesas(dataMesas.mesas || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cambiarEstado(id: string, estado: string) {
    setGuardando(id);
    await fetch(`/api/reservas/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    await cargarTodo();
    setGuardando(null);
  }

  async function asignarMesa(id: string, mesa_id: string) {
    setGuardando(id);
    await fetch(`/api/reservas/${id}/mesa`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesa_id }),
    });
    await cargarTodo();
    setGuardando(null);
  }

  const rango = useMemo(() => {
    if (vista === "dia") return { desde: fechaAncla, hasta: fechaAncla };
    if (vista === "semana") {
      const ini = inicioSemana(fechaAncla);
      return { desde: ini, hasta: sumarDias(ini, 6) };
    }
    return { desde: inicioMes(fechaAncla), hasta: finMes(fechaAncla) };
  }, [vista, fechaAncla]);

  function navegar(direccion: 1 | -1) {
    setFechaAncla((f) => {
      if (vista === "dia") return sumarDias(f, direccion);
      if (vista === "semana") return sumarDias(f, direccion * 7);
      return sumarMeses(f, direccion);
    });
  }

  const etiquetaRango = useMemo(() => {
    if (vista === "dia") return formatearFecha(fechaAncla);
    if (vista === "semana") {
      const d = aDate(rango.desde);
      const h = aDate(rango.hasta);
      const mismoMes = d.getMonth() === h.getMonth();
      const inicioTxt = d.toLocaleDateString("es-ES", { day: "numeric", month: mismoMes ? undefined : "short" });
      const finTxt = h.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
      return `${inicioTxt} – ${finTxt}`;
    }
    const texto = aDate(fechaAncla).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }, [vista, fechaAncla, rango]);

  const ventanaSlider = useMemo(() => {
    const dias: string[] = [];
    for (let i = -14; i <= 90; i++) dias.push(sumarDias(hoy, i));
    return dias;
  }, [hoy]);

  const fechasConReservas = useMemo(() => new Set(reservas.map((r) => r.fecha)), [reservas]);

  useEffect(() => {
    if (vista !== "dia" || !sliderRef.current) return;
    const chip = sliderRef.current.querySelector<HTMLElement>(`[data-fecha="${fechaAncla}"]`);
    chip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [vista, fechaAncla]);

  const reservasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return reservas.filter((r) => {
      if (r.fecha < rango.desde || r.fecha > rango.hasta) return false;
      if (filtroServicio !== "todos" && r.servicio !== filtroServicio) return false;
      if (filtroEstado !== "todos" && r.estado !== filtroEstado) return false;
      if (termino && !r.clientes?.nombre?.toLowerCase().includes(termino)) return false;
      return true;
    });
  }, [reservas, rango, filtroServicio, filtroEstado, busqueda]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Reserva[]>();
    for (const r of reservasFiltradas) {
      const lista = mapa.get(r.fecha) || [];
      lista.push(r);
      mapa.set(r.fecha, lista);
    }
    return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [reservasFiltradas]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Reservas</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {reservasFiltradas.length} de {reservas.length} reserva{reservas.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-surface-sunken p-1">
          {(["dia", "semana", "mes"] as const).map((v) => (
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

        <div className="inline-flex items-center gap-1">
          <button
            onClick={() => navegar(-1)}
            aria-label="Anterior"
            className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <ChevronLeft size={18} strokeWidth={1.75} />
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium capitalize text-ink">{etiquetaRango}</span>
          <button
            onClick={() => navegar(1)}
            aria-label="Siguiente"
            className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <ChevronRight size={18} strokeWidth={1.75} />
          </button>
          {fechaAncla !== hoy && (
            <button
              onClick={() => setFechaAncla(hoy)}
              className="ml-1 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-sunken"
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {vista === "dia" && (
        <div ref={sliderRef} className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ventanaSlider.map((fechaISO) => {
            const d = aDate(fechaISO);
            const seleccionado = fechaISO === fechaAncla;
            const tieneReservas = fechasConReservas.has(fechaISO);
            return (
              <button
                key={fechaISO}
                data-fecha={fechaISO}
                onClick={() => setFechaAncla(fechaISO)}
                className={`flex shrink-0 flex-col items-center rounded-lg px-3 py-1.5 transition-colors ${
                  seleccionado ? "bg-brand text-white" : "bg-surface-sunken text-ink-muted hover:bg-line"
                }`}
              >
                <span className="text-[0.65rem] uppercase tracking-wide opacity-80">
                  {d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "")}
                </span>
                <span className="text-sm font-semibold leading-tight">{d.getDate()}</span>
                <span className={`mt-0.5 h-1 w-1 rounded-full ${tieneReservas ? (seleccionado ? "bg-white" : "bg-brand") : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex gap-1.5 border-b border-line">
        {[
          { valor: "todos", etiqueta: "Todo el día", icon: null },
          { valor: "comida", etiqueta: "Comida", icon: UtensilsCrossed },
          { valor: "cena", etiqueta: "Cena", icon: Moon },
        ].map(({ valor, etiqueta, icon: Icon }) => (
          <button
            key={valor}
            onClick={() => setFiltroServicio(valor)}
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              filtroServicio === valor
                ? "border-brand text-brand"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {Icon && <Icon size={15} strokeWidth={1.75} />}
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFiltroEstado("todos")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filtroEstado === "todos" ? "bg-brand text-white" : "bg-surface-sunken text-ink-muted hover:bg-line"
            }`}
          >
            Todos
          </button>
          {ESTADOS.map((estado) => {
            const Icono = ICONO_ESTADO[estado];
            return (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtroEstado === estado ? "bg-brand text-white" : "bg-surface-sunken text-ink-muted hover:bg-line"
                }`}
              >
                <Icono size={12} strokeWidth={2} />
                {ETIQUETAS_ESTADO[estado]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {cargando && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-sunken" />
            ))}
          </div>
        )}

        {!cargando && grupos.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
            <CalendarX2 size={28} strokeWidth={1.5} className="text-ink-faint" />
            <p className="text-sm text-ink-muted">
              {reservas.length === 0 ? "Todavía no hay reservas." : "Ninguna reserva coincide con el filtro."}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {grupos.map(([fecha, lista]) => {
            const dividirServicio = vista === "dia" && filtroServicio === "todos";

            if (dividirServicio) {
              const comida = lista.filter((r) => r.servicio === "comida");
              const cena = lista.filter((r) => r.servicio === "cena");
              const otras = lista.filter((r) => r.servicio !== "comida" && r.servicio !== "cena");
              return (
                <div key={fecha} className="space-y-6">
                  {comida.length > 0 && (
                    <div>
                      <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                        <UtensilsCrossed size={14} strokeWidth={1.75} />
                        Comida
                      </h3>
                      <BloqueReservas
                        lista={comida}
                        mesas={mesas}
                        guardando={guardando}
                        mostrarFecha={false}
                        onCambiarEstado={cambiarEstado}
                        onAsignarMesa={asignarMesa}
                        onNotasGuardadas={cargarTodo}
                      />
                    </div>
                  )}
                  {cena.length > 0 && (
                    <div>
                      <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                        <Moon size={14} strokeWidth={1.75} />
                        Cena
                      </h3>
                      <BloqueReservas
                        lista={cena}
                        mesas={mesas}
                        guardando={guardando}
                        mostrarFecha={false}
                        onCambiarEstado={cambiarEstado}
                        onAsignarMesa={asignarMesa}
                        onNotasGuardadas={cargarTodo}
                      />
                    </div>
                  )}
                  {otras.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-ink">Otras</h3>
                      <BloqueReservas
                        lista={otras}
                        mesas={mesas}
                        guardando={guardando}
                        mostrarFecha={false}
                        onCambiarEstado={cambiarEstado}
                        onAsignarMesa={asignarMesa}
                        onNotasGuardadas={cargarTodo}
                      />
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={fecha}>
                <BloqueReservas
                  lista={lista}
                  mesas={mesas}
                  guardando={guardando}
                  mostrarFecha={vista !== "dia"}
                  onCambiarEstado={cambiarEstado}
                  onAsignarMesa={asignarMesa}
                  onNotasGuardadas={cargarTodo}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BloqueReservas({
  lista,
  mesas,
  guardando,
  mostrarFecha,
  onCambiarEstado,
  onAsignarMesa,
  onNotasGuardadas,
}: {
  lista: Reserva[];
  mesas: Mesa[];
  guardando: string | null;
  mostrarFecha: boolean;
  onCambiarEstado: (id: string, estado: string) => void;
  onAsignarMesa: (id: string, mesaId: string) => void;
  onNotasGuardadas: () => void;
}) {
  return (
    <>
      {/* Escritorio: tabla densa */}
      <div className="hidden lg:block">
        <div
          className={`grid ${COLUMNAS} items-center gap-x-4 border-l-4 border-transparent py-1 pl-3.5 pr-3 text-xs font-medium uppercase tracking-wide text-ink-faint`}
        >
          <span>Mesa</span>
          <span>Hora</span>
          <span>Cliente</span>
          <span>Pax</span>
          <span>Estado</span>
          <span className="sr-only">Acciones</span>
        </div>
        <div className="space-y-2">
          {lista.map((r) => (
            <FilaReserva
              key={r.id}
              reserva={r}
              mesas={mesas}
              guardando={guardando === r.id}
              mostrarFecha={mostrarFecha}
              onCambiarEstado={(estado) => onCambiarEstado(r.id, estado)}
              onAsignarMesa={(mesaId) => onAsignarMesa(r.id, mesaId)}
              onNotasGuardadas={onNotasGuardadas}
            />
          ))}
        </div>
      </div>

      {/* Móvil / tablet: tarjetas */}
      <div className="space-y-3 lg:hidden">
        {lista.map((r) => (
          <TarjetaReserva
            key={r.id}
            reserva={r}
            mesas={mesas}
            guardando={guardando === r.id}
            mostrarFecha={mostrarFecha}
            onCambiarEstado={(estado) => onCambiarEstado(r.id, estado)}
            onAsignarMesa={(mesaId) => onAsignarMesa(r.id, mesaId)}
            onNotasGuardadas={onNotasGuardadas}
          />
        ))}
      </div>
    </>
  );
}

type PropsFila = {
  reserva: Reserva;
  mesas: Mesa[];
  guardando: boolean;
  mostrarFecha: boolean;
  onCambiarEstado: (estado: string) => void;
  onAsignarMesa: (mesaId: string) => void;
  onNotasGuardadas: () => void;
};

function FilaReserva({ reserva: r, mesas, guardando, mostrarFecha, onCambiarEstado, onAsignarMesa, onNotasGuardadas }: PropsFila) {
  return (
    <div
      className={`rounded-r-lg border-l-4 bg-surface shadow-card transition-opacity ${
        BORDE_ESTADO[r.estado] || "border-line-strong"
      } ${guardando ? "opacity-60" : ""}`}
    >
      <div className={`grid ${COLUMNAS} items-center gap-x-4 py-2.5 pl-3.5 pr-3`}>
        {r.mesas ? (
          (() => {
            const { prefijo, numero } = partirNombreMesa(r.mesas!.nombre);
            return (
              <div className="flex flex-col leading-none" title={r.mesas!.nombre}>
                {prefijo && <span className="text-[0.65rem] uppercase tracking-wide text-ink-faint">{prefijo}</span>}
                <span className="text-lg font-bold text-ink">{numero}</span>
              </div>
            );
          })()
        ) : (
          <span className="text-ink-faint">—</span>
        )}

        <div className="flex flex-col leading-none">
          {mostrarFecha && (
            <span className="text-[0.65rem] uppercase tracking-wide text-ink-faint">{formatearFechaCorta(r.fecha)}</span>
          )}
          <span className="tabular-nums text-base font-bold text-ink">{r.hora_inicio?.slice(0, 5)}</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-medium text-ink">{r.clientes?.nombre}</span>
            <NotasControl id={r.id} notas={r.notas} onGuardado={onNotasGuardadas} />
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
            <a href={`mailto:${r.clientes?.email}`} className="inline-flex items-center gap-1 hover:text-brand hover:underline">
              <Mail size={12} strokeWidth={1.75} />
              {r.clientes?.email}
            </a>
            <a href={`tel:${r.clientes?.telefono}`} className="inline-flex items-center gap-1 hover:text-brand hover:underline">
              <Phone size={12} strokeWidth={1.75} />
              {r.clientes?.telefono}
            </a>
            {r.mesas?.zona && <span>{r.mesas.zona}</span>}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
          <Users size={14} strokeWidth={1.75} />
          {r.num_personas}
        </span>

        <EstadoBadge estado={r.estado} />

        <div className="flex flex-col gap-1.5">
          <select
            value={r.mesa_id || ""}
            disabled={guardando}
            onChange={(e) => onAsignarMesa(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-brand focus:outline-none disabled:cursor-wait"
          >
            <option value="">Sin mesa</option>
            {mesas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.capacidad_max})
              </option>
            ))}
          </select>
          <select
            value={r.estado}
            disabled={guardando}
            onChange={(e) => onCambiarEstado(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-brand focus:outline-none disabled:cursor-wait"
          >
            {Object.entries(ETIQUETAS_ESTADO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function TarjetaReserva({ reserva: r, mesas, guardando, mostrarFecha, onCambiarEstado, onAsignarMesa, onNotasGuardadas }: PropsFila) {
  return (
    <div
      className={`rounded-r-xl border-l-4 bg-surface p-4 shadow-card transition-opacity ${
        BORDE_ESTADO[r.estado] || "border-line-strong"
      } ${guardando ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink">{r.clientes?.nombre}</p>
            <EstadoBadge estado={r.estado} />
            <NotasControl id={r.id} notas={r.notas} onGuardado={onNotasGuardadas} />
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            <a href={`mailto:${r.clientes?.email}`} className="inline-flex items-center gap-1.5 hover:text-brand hover:underline">
              <Mail size={14} strokeWidth={1.75} />
              {r.clientes?.email}
            </a>
            <a href={`tel:${r.clientes?.telefono}`} className="inline-flex items-center gap-1.5 hover:text-brand hover:underline">
              <Phone size={14} strokeWidth={1.75} />
              {r.clientes?.telefono}
            </a>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink">
            {mostrarFecha && (
              <>
                <span className="font-medium text-ink">{formatearFechaCorta(r.fecha)}</span>
                <span className="text-ink-faint">·</span>
              </>
            )}
            <span>{r.servicio ? ETIQUETA_SERVICIO[r.servicio] || r.servicio : "Sin servicio"}</span>
            <span className="text-ink-faint">·</span>
            <span className="tabular-nums text-base font-bold">
              {r.hora_inicio?.slice(0, 5)}–{r.hora_fin?.slice(0, 5)}
            </span>
            <span className="text-ink-faint">·</span>
            <span className="inline-flex items-center gap-1">
              <Users size={14} strokeWidth={1.75} />
              {r.num_personas}
            </span>
            {r.mesas && (
              <>
                <span className="text-ink-faint">·</span>
                <span className="text-ink-muted">
                  {r.mesas.nombre}
                  {r.mesas.zona ? ` (${r.mesas.zona})` : ""}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={r.mesa_id || ""}
            disabled={guardando}
            onChange={(e) => onAsignarMesa(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none disabled:cursor-wait"
          >
            <option value="">Sin mesa asignada</option>
            {mesas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} (hasta {m.capacidad_max})
              </option>
            ))}
          </select>

          <select
            value={r.estado}
            disabled={guardando}
            onChange={(e) => onCambiarEstado(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none disabled:cursor-wait"
          >
            {Object.entries(ETIQUETAS_ESTADO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
