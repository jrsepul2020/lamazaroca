"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, CalendarRange } from "lucide-react";
import Link from "next/link";

type Temporada = { id: string; nombre: string; fecha_inicio: string; fecha_fin: string; activa: boolean };

export default function TemporadasPage() {
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevo, setNuevo] = useState({ nombre: "", fecha_inicio: "", fecha_fin: "" });

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/temporadas");
    const data = await res.json();
    setTemporadas(data.temporadas || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/temporadas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo),
    });
    if (res.ok) {
      setNuevo({ nombre: "", fecha_inicio: "", fecha_fin: "" });
      cargar();
    }
  }

  async function alternarActiva(t: Temporada) {
    await fetch(`/api/temporadas/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !t.activa }),
    });
    cargar();
  }

  async function borrar(id: string) {
    if (!confirm("Esto también borrará los horarios de servicio asociados a esta temporada. ¿Continuar?")) return;
    await fetch(`/api/temporadas/${id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Temporadas</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Una temporada (ej. "Horario de verano") define un rango de fechas en el que se puede usar un horario
        distinto al general. Créala aquí y luego añade sus franjas horarias desde{" "}
        <Link href="/admin/horarios" className="text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand">
          Horario de servicio
        </Link>
        , seleccionando esta temporada. Si un día concreto no tiene horario definido dentro de la temporada
        activa, se usa el horario general por defecto.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4 shadow-card"
      >
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Nombre
          <input
            required
            placeholder="Horario de verano"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            className="w-44 rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Desde
          <input
            type="date"
            required
            value={nuevo.fecha_inicio}
            onChange={(e) => setNuevo({ ...nuevo, fecha_inicio: e.target.value })}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Hasta
          <input
            type="date"
            required
            value={nuevo.fecha_fin}
            onChange={(e) => setNuevo({ ...nuevo, fecha_fin: e.target.value })}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          <Plus size={16} strokeWidth={2} />
          Añadir temporada
        </button>
      </form>

      <div className="mt-8">
        {cargando && (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-sunken" />
            ))}
          </div>
        )}

        {!cargando && temporadas.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
            <CalendarRange size={28} strokeWidth={1.5} className="text-ink-faint" />
            <p className="text-sm text-ink-muted">No hay temporadas configuradas — se usa siempre el horario general.</p>
          </div>
        )}

        <div className="space-y-2">
          {temporadas.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 shadow-card ${
                t.activa ? "" : "opacity-50"
              }`}
            >
              <span className="text-sm text-ink">
                <strong className="font-medium">{t.nombre}</strong> — del{" "}
                {new Date(t.fecha_inicio).toLocaleDateString("es-ES")} al{" "}
                {new Date(t.fecha_fin).toLocaleDateString("es-ES")}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => alternarActiva(t)}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted transition-colors hover:bg-surface-sunken"
                >
                  {t.activa ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => borrar(t.id)}
                  aria-label="Borrar temporada"
                  className="rounded-lg border border-line p-1.5 text-state-noshow transition-colors hover:bg-state-noshow-bg"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
