"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, LayoutGrid, Users } from "lucide-react";

type Mesa = { id: string; nombre: string; zona: string | null; capacidad_min: number; capacidad_max: number };

export default function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [form, setForm] = useState({ nombre: "", zona: "", capacidad_min: 1, capacidad_max: 4 });
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  async function cargarMesas() {
    setCargando(true);
    const res = await fetch("/api/mesas");
    const data = await res.json();
    setMesas(data.mesas || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarMesas();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    await fetch("/api/mesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ nombre: "", zona: "", capacidad_min: 1, capacidad_max: 4 });
    await cargarMesas();
    setEnviando(false);
  }

  const grupos = useMemo(() => {
    const mapa = new Map<string, Mesa[]>();
    for (const m of mesas) {
      const zona = m.zona || "Sin zona";
      const lista = mapa.get(zona) || [];
      lista.push(m);
      mapa.set(zona, lista);
    }
    return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [mesas]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Mesas</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Lista simple de mesas para poder asignarlas a las reservas. Sin plano visual — solo nombre, zona y
        capacidad.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4 shadow-card"
      >
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Nombre
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-36 rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Zona (opcional)
          <input
            value={form.zona}
            onChange={(e) => setForm({ ...form, zona: e.target.value })}
            className="w-44 rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Mín.
          <input
            type="number"
            min={1}
            value={form.capacidad_min}
            onChange={(e) => setForm({ ...form, capacidad_min: Number(e.target.value) })}
            className="w-20 rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Máx.
          <input
            type="number"
            min={1}
            max={8}
            value={form.capacidad_max}
            onChange={(e) => setForm({ ...form, capacidad_max: Number(e.target.value) })}
            className="w-20 rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
        >
          <Plus size={16} strokeWidth={2} />
          Añadir mesa
        </button>
      </form>

      <div className="mt-8">
        {cargando && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-sunken" />
            ))}
          </div>
        )}

        {!cargando && mesas.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
            <LayoutGrid size={28} strokeWidth={1.5} className="text-ink-faint" />
            <p className="text-sm text-ink-muted">Todavía no hay mesas. Añade la primera arriba.</p>
          </div>
        )}

        <div className="space-y-6">
          {grupos.map(([zona, lista]) => (
            <div key={zona}>
              <h2 className="mb-2.5 text-sm font-semibold text-ink-muted">{zona}</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {lista.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-line bg-surface px-3.5 py-2.5 shadow-card"
                  >
                    <p className="font-medium text-ink">{m.nombre}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-muted">
                      <Users size={12} strokeWidth={1.75} />
                      {m.capacidad_min}–{m.capacidad_max} personas
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
