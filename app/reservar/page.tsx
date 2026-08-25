"use client";

import { useEffect, useState } from "react";

type Slot = { hora: string; zonas: string[] };
type ServicioDisponible = { servicio: string; duracion_minutos: number; slots: Slot[] };

const ETIQUETA_SERVICIO: Record<string, string> = { comida: "Comida", cena: "Cena" };

export default function ReservarPage() {
  const [fecha, setFecha] = useState("");
  const [numPersonas, setNumPersonas] = useState(2);
  const [servicios, setServicios] = useState<ServicioDisponible[]>([]);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    servicio: "",
    hora: "",
    zona: "",
  });
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    if (!fecha || !numPersonas) {
      setServicios([]);
      return;
    }
    setCargandoDisponibilidad(true);
    setForm((f) => ({ ...f, servicio: "", hora: "", zona: "" }));
    fetch(`/api/disponibilidad?fecha=${fecha}&num_personas=${numPersonas}`)
      .then((r) => r.json())
      .then((data) => setServicios(data.servicios || []))
      .finally(() => setCargandoDisponibilidad(false));
  }, [fecha, numPersonas]);

  const slotSeleccionado = servicios
    .find((s) => s.servicio === form.servicio)
    ?.slots.find((s) => s.hora === form.hora);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    setMensajeError("");

    const res = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fecha, num_personas: numPersonas }),
    });

    if (res.ok) {
      setEstado("ok");
    } else {
      const data = await res.json();
      setMensajeError(data.error || "Ha ocurrido un error");
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <main style={estilos.contenedor}>
        <div style={estilos.tarjeta}>
          <h1 style={estilos.titulo}>Reserva enviada</h1>
          <p style={estilos.texto}>
            Te hemos enviado la confirmación por email y WhatsApp. La bodega la revisará en breve.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={estilos.contenedor}>
      <form onSubmit={handleSubmit} style={estilos.tarjeta}>
        <h1 style={estilos.titulo}>Reservar mesa</h1>

        <label style={estilos.label}>
          Personas
          <select
            style={estilos.input}
            value={numPersonas}
            onChange={(e) => setNumPersonas(Number(e.target.value))}
          >
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} persona{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={estilos.label}>
          Fecha
          <input
            type="date"
            style={estilos.input}
            required
            min={new Date().toISOString().split("T")[0]}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </label>

        {fecha && cargandoDisponibilidad && <p style={estilos.texto}>Consultando disponibilidad...</p>}

        {fecha && !cargandoDisponibilidad && servicios.length === 0 && (
          <p style={estilos.errorTexto}>
            No hay disponibilidad para {numPersonas} persona(s) ese día. Prueba otra fecha o apúntate a la lista
            de espera.
          </p>
        )}

        {fecha &&
          servicios.map((s) => (
            <div key={s.servicio} style={estilos.label}>
              {ETIQUETA_SERVICIO[s.servicio] || s.servicio}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {s.slots.map((slot) => (
                  <button
                    type="button"
                    key={slot.hora}
                    onClick={() => setForm({ ...form, servicio: s.servicio, hora: slot.hora, zona: "" })}
                    style={{
                      ...estilos.chip,
                      ...(form.servicio === s.servicio && form.hora === slot.hora ? estilos.chipSeleccionado : {}),
                    }}
                  >
                    {slot.hora}
                  </button>
                ))}
              </div>
            </div>
          ))}

        {slotSeleccionado && slotSeleccionado.zonas.length > 1 && (
          <label style={estilos.label}>
            Zona
            <select
              style={estilos.input}
              value={form.zona}
              onChange={(e) => setForm({ ...form, zona: e.target.value })}
            >
              <option value="">Sin preferencia</option>
              {slotSeleccionado.zonas.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>
        )}

        <label style={estilos.label}>
          Nombre
          <input
            style={estilos.input}
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </label>

        <label style={estilos.label}>
          Email
          <input
            type="email"
            style={estilos.input}
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <label style={estilos.label}>
          Teléfono (con prefijo, ej: +34600111222)
          <input
            style={estilos.input}
            required
            placeholder="+34600111222"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
        </label>

        {estado === "error" && <p style={estilos.errorTexto}>{mensajeError}</p>}

        <button type="submit" disabled={estado === "enviando" || !form.hora} style={estilos.boton}>
          {estado === "enviando" ? "Enviando..." : "Confirmar reserva"}
        </button>
      </form>
    </main>
  );
}

const estilos: Record<string, React.CSSProperties> = {
  contenedor: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#faf7f2",
    padding: "24px",
  },
  tarjeta: {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  titulo: { fontSize: "1.5rem", margin: 0, color: "#2b2118" },
  texto: { color: "#555", lineHeight: 1.5, margin: 0 },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.9rem", color: "#333" },
  input: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "1rem",
  },
  chip: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "20px",
    background: "#fff",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  chipSeleccionado: {
    background: "#6b3f2a",
    color: "#fff",
    borderColor: "#6b3f2a",
  },
  boton: {
    marginTop: "8px",
    padding: "12px",
    background: "#6b3f2a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  errorTexto: { color: "#c0392b", fontSize: "0.9rem", margin: 0 },
};
