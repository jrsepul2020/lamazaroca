"use client";

import { useEffect, useMemo, useState } from "react";
import { Monitor, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

type Mesa = { id: string; nombre: string; zona: string | null; capacidad_min: number; capacidad_max: number };

type Reserva = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  mesa_id: string | null;
  clientes: { nombre: string } | null;
};

const ESTADOS_OCUPAN = ["pendiente_confirmacion", "confirmada", "sentada", "completada"];

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
function horaHHMM(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
}
function formatearFecha(iso: string) {
  const texto = aDate(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function PlanoPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ahora, setAhora] = useState(() => new Date());
  const [fecha, setFecha] = useState(() => aISO(new Date()));

  async function cargar() {
    const [resMesas, resReservas] = await Promise.all([fetch("/api/mesas"), fetch("/api/reservas/listar")]);
    const dataMesas = await resMesas.json();
    const dataReservas = await resReservas.json();
    setMesas(dataMesas.mesas || []);
    setReservas(dataReservas.reservas || []);
    setCargando(false);
    setAhora(new Date());
  }

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 60000);
    return () => clearInterval(t);
  }, []);

  const hoyISO = aISO(ahora);
  const esHoy = fecha === hoyISO;
  const horaActual = horaHHMM(ahora);

  const porMesa = useMemo(() => {
    const mapa = new Map<string, Reserva[]>();
    for (const r of reservas) {
      if (r.fecha !== fecha || !r.mesa_id || !ESTADOS_OCUPAN.includes(r.estado)) continue;
      const lista = mapa.get(r.mesa_id) || [];
      lista.push(r);
      mapa.set(r.mesa_id, lista);
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    return mapa;
  }, [reservas, fecha]);

  const zonas = useMemo(() => {
    const mapa = new Map<string, Mesa[]>();
    for (const m of mesas) {
      const zona = m.zona || "Sin zona";
      const lista = mapa.get(zona) || [];
      lista.push(m);
      mapa.set(zona, lista);
    }
    return Array.from(mapa.entries());
  }, [mesas]);

  return (
    <div>
      {/* Aviso solo-móvil */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-20 text-center lg:hidden">
        <Monitor size={28} strokeWidth={1.5} className="text-ink-faint" />
        <p className="max-w-xs text-sm text-ink-muted">
          El plano de mesas está pensado para pantallas grandes. Ábrelo desde un ordenador de escritorio.
        </p>
      </div>

      {/* Contenido a pantalla completa, solo escritorio */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-ink">Plano de mesas</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Referencia visual, no editable
              {esHoy && ` · actualizado a las ${ahora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setFecha((f) => sumarDias(f, -1))}
                aria-label="Día anterior"
                className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <ChevronLeft size={18} strokeWidth={1.75} />
              </button>
              <span className="min-w-[13rem] text-center text-sm font-medium capitalize text-ink">
                {formatearFecha(fecha)}
              </span>
              <button
                onClick={() => setFecha((f) => sumarDias(f, 1))}
                aria-label="Día siguiente"
                className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <ChevronRight size={18} strokeWidth={1.75} />
              </button>
              {!esHoy && (
                <button
                  onClick={() => setFecha(hoyISO)}
                  className="ml-1 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-sunken"
                >
                  Hoy
                </button>
              )}
            </div>
            <button
              onClick={cargar}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunken"
            >
              <RefreshCw size={14} strokeWidth={1.75} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
          {esHoy ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" /> Ocupada ahora
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-brand bg-brand-tint" /> Reservada más tarde hoy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-line-strong bg-surface-sunken" /> Libre
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-brand bg-brand-tint" /> Con reserva ese día
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-line-strong bg-surface-sunken" /> Libre
              </span>
            </>
          )}
        </div>

        {cargando ? (
          <div className="mt-6 grid grid-cols-2 gap-6 2xl:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-sunken" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-6 2xl:grid-cols-3">
            {zonas.map(([zona, listaMesas]) => (
              <div key={zona} className="rounded-xl border border-line bg-surface p-5 shadow-card">
                <h2 className="font-serif text-2xl text-ink">{zona}</h2>
                <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
                  {listaMesas.map((m) => (
                    <CajaMesa
                      key={m.id}
                      mesa={m}
                      reservasDia={porMesa.get(m.id) || []}
                      horaActual={horaActual}
                      esHoy={esHoy}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CajaMesa({
  mesa,
  reservasDia,
  horaActual,
  esHoy,
}: {
  mesa: Mesa;
  reservasDia: Reserva[];
  horaActual: string;
  esHoy: boolean;
}) {
  const activa = esHoy ? reservasDia.find((r) => r.hora_inicio <= horaActual && horaActual < r.hora_fin) : undefined;
  const proxima = !activa
    ? esHoy
      ? reservasDia.find((r) => r.hora_inicio > horaActual)
      : reservasDia[0]
    : undefined;
  const extra = reservasDia.length - (activa || proxima ? 1 : 0);

  return (
    <div
      className={`rounded-lg border p-2.5 ${
        activa
          ? "border-brand bg-brand text-white"
          : proxima
            ? "border-brand/40 bg-brand-tint text-ink"
            : "border-line-strong bg-surface-sunken text-ink-muted"
      }`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-sm font-bold">{mesa.nombre}</span>
        <span className={`text-[0.65rem] ${activa ? "text-white/75" : "text-ink-faint"}`}>
          {mesa.capacidad_min}-{mesa.capacidad_max}
        </span>
      </div>

      {activa && (
        <div className="mt-1">
          <p className="truncate text-xs font-semibold">{activa.clientes?.nombre}</p>
          <p className="text-[0.65rem] text-white/80">
            {activa.hora_inicio.slice(0, 5)}–{activa.hora_fin.slice(0, 5)}
          </p>
        </div>
      )}
      {proxima && (
        <p className="mt-1 truncate text-[0.7rem]">
          {proxima.hora_inicio.slice(0, 5)} · {proxima.clientes?.nombre}
        </p>
      )}
      {!activa && !proxima && <p className="mt-1 text-[0.7rem] opacity-70">Libre</p>}
      {extra > 0 && (
        <p className={`mt-0.5 text-[0.6rem] ${activa ? "text-white/70" : "text-ink-faint"}`}>
          +{extra} más {esHoy ? "hoy" : "ese día"}
        </p>
      )}
    </div>
  );
}
