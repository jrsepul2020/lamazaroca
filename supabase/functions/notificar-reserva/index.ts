// Edge Function: notificar-reserva
// Se dispara vía webhook de base de datos al insertarse una fila en `reservas`.
// Envía email (Resend) al cliente y a la bodega. (MVP: sin WhatsApp todavía)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM = Deno.env.get("RESEND_FROM")!; // ej: reservas@tubodega.com u onboarding@resend.dev
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const reserva = payload.record; // fila insertada en `reservas`

    // 1. Cargar datos del cliente y de la bodega
    const { data: cliente, error: errCliente } = await supabase
      .from("clientes")
      .select("nombre, email, telefono")
      .eq("id", reserva.cliente_id)
      .single();

    const { data: bodega, error: errBodega } = await supabase
      .from("bodega_config")
      .select("nombre_bodega, email_notificaciones")
      .limit(1)
      .single();

    if (errCliente || errBodega || !cliente || !bodega) {
      throw new Error("No se pudo cargar cliente o configuración de bodega");
    }

    const fechaFormateada = new Date(reserva.fecha).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const horaInicio = (reserva.hora_inicio || "").slice(0, 5);
    const horaFin = (reserva.hora_fin || "").slice(0, 5);

    const textoCliente =
      `Hola ${cliente.nombre}, tu reserva en ${bodega.nombre_bodega} está confirmada ` +
      `para el ${fechaFormateada}, de ${horaInicio} a ${horaFin}, para ${reserva.num_personas} persona(s). ¡Te esperamos!`;

    const textoBodega =
      `Nueva reserva: ${cliente.nombre} (${cliente.telefono}) — ${fechaFormateada} ${horaInicio}-${horaFin} — ` +
      `${reserva.num_personas} persona(s).`;

    // 2. Enviar los 2 emails en paralelo
    const resultados = await Promise.allSettled([
      enviarEmail(cliente.email, `Reserva confirmada — ${bodega.nombre_bodega}`, textoCliente),
      enviarEmail(bodega.email_notificaciones, `Nueva reserva — ${cliente.nombre}`, textoBodega),
    ]);

    const fallos = resultados.filter((r) => r.status === "rejected");
    if (fallos.length > 0) {
      console.error("Algunos envíos fallaron:", fallos);
    }

    return new Response(JSON.stringify({ ok: true, fallos: fallos.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function enviarEmail(to: string, subject: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject,
      text,
    }),
  });
  if (!res.ok) throw new Error(`Error enviando email a ${to}: ${await res.text()}`);
}
