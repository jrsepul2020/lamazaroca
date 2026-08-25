"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import Link from "next/link";

type Horario = {
  id: string;
  dia_semana: number;
  servicio: "comida" | "cena";
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
  temporada_id: string | null;
};

type Temporada = { id: string; nombre: string; fecha_inicio: string; fecha_fin: string };

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [temporadaVista, setTemporadaVista] = useState<string>(""); // "" = general
  const [cargando, setCargando] = useState(true);
  const [nuevo, setNuevo] = useState({
    dia_semana: 1,
    servicio: "comida" as "comida" | "cena",
    hora_apertura: "",
    hora_cierre: "",
  });

  async function cargarTodo() {
    setCargando(true);
    const [resHorarios, resTemporadas] = await Promise.all([
      fetch("/api/horarios"),
      fetch("/api/temporadas"),
    ]);
    const dataHorarios = await resHorarios.json();
    const dataTemporadas = await resTemporadas.json();
    setHorarios(dataHorarios.horarios || []);
    setTemporadas(dataTemporadas.temporadas || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/horarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nuevo, temporada_id: temporadaVista || null }),
    });
    setNuevo({ dia_semana: 1, servicio: "comida", hora_apertura: "", hora_cierre: "" });
    cargarTodo();
  }

  async function alternarActivo(h: Horario) {
    await fetch(`/api/horarios/${h.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !h.activo }),
    });
    cargarTodo();
  }

  async function borrar(id: string) {
    await fetch(`/api/horarios/${id}`, { method: "DELETE" });
    cargarTodo();
  }

  const horariosFiltrados = horarios.filter((h) =>
    temporadaVista ? h.temporada_id === temporadaVista : h.temporada_id === null
  );

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Horario de servicio</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Ventana de apertura por día y servicio (comida/cena). Dentro de esta ventana, el sistema calcula
        automáticamente qué horas concretas quedan libres. Si un día no tiene ninguna franja, ese día está
        cerrado para ese servicio.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        ¿Necesitas un horario distinto en verano/invierno u otra época?{" "}
        <Link href="/admin/temporadas" className="text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand">
          Crea una temporada
        </Link>{" "}
        y después elígela aquí abajo para definir sus horarios propios.
      </p>

      <label className="mt-6 flex max-w-xs flex-col gap-1 text-sm text-ink-muted">
        Editando horario de:
        <select
          value={temporadaVista}
          onChange={(e) => setTemporadaVista(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
        >
          <option value="">General (todo el año)</option>
          {temporadas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} ({new Date(t.fecha_inicio).toLocaleDateString("es-ES")} –{" "}
              {new Date(t.fecha_fin).toLocaleDateString("es-ES")})
            </option>
          ))}
        </select>
      </label>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4 shadow-card"
      >
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Día
          <select
            value={nuevo.dia_semana}
            onChange={(e) => setNuevo({ ...nuevo, dia_semana: Number(e.target.value) })}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          >
            {DIAS.slice(1).map((d, i) => (
              <option key={i + 1} value={i + 1}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Servicio
          <select
            value={nuevo.servicio}
            onChange={(e) => setNuevo({ ...nuevo, servicio: e.target.value as "comida" | "cena" })}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          >
            <option value="comida">Comida</option>
            <option value="cena">Cena</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Apertura
          <input
            type="time"
            required
            value={nuevo.hora_apertura}
            onChange={(e) => setNuevo({ ...nuevo, hora_apertura: e.target.value })}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Cierre
          <input
            type="time"
            required
            value={nuevo.hora_cierre}
            onChange={(e) => setNuevo({ ...nuevo, hora_cierre: e.target.value })}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          <Plus size={16} strokeWidth={2} />
          Añadir franja
        </button>
      </form>

      <div className="mt-8">
        {cargando && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-sunken" />
            ))}
          </div>
        )}

        {!cargando && (
          <div className="space-y-6">
            {DIAS.slice(1).map((nombreDia, idx) => {
              const dia = idx + 1;
              const horariosDelDia = horariosFiltrados.filter((h) => h.dia_semana === dia);

              return (
                <div key={dia}>
                  <h3 className="mb-2 text-sm font-semibold text-ink-muted">{nombreDia}</h3>
                  {horariosDelDia.length === 0 ? (
                    <p className="inline-flex items-center gap-1.5 text-sm text-ink-faint">
                      <Clock size={14} strokeWidth={1.75} />
                      {temporadaVista ? "Sin horario propio (usará el general)" : "Cerrado"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {horariosDelDia.map((h) => (
                        <div
                          key={h.id}
                          className={`flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-2.5 shadow-card ${
                            h.activo ? "" : "opacity-50"
                          }`}
                        >
                          <span className="text-sm text-ink">
                            <strong className="font-medium">{h.servicio === "comida" ? "Comida" : "Cena"}</strong>{" "}
                            — {h.hora_apertura.slice(0, 5)} a {h.hora_cierre.slice(0, 5)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => alternarActivo(h)}
                              className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted transition-colors hover:bg-surface-sunken"
                            >
                              {h.activo ? "Desactivar" : "Activar"}
                            </button>
                            <button
                              onClick={() => borrar(h.id)}
                              aria-label="Borrar franja"
                              className="rounded-lg border border-line p-1.5 text-state-noshow transition-colors hover:bg-state-noshow-bg"
                            >
                              <Trash2 size={14} strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
