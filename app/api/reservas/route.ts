import { NextRequest, NextResponse } from "next/server";
import { resolverHorariosDelDia } from "@/lib/horarios";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const ESTADOS_QUE_OCUPAN_MESA = ["pendiente_confirmacion", "confirmada", "sentada", "completada"];

function horaAMinutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}
function minutosAHora(mins: number) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = crearClienteAdmin();
    const { nombre, email, telefono, fecha, hora, servicio, num_personas, zona } = await req.json();

    if (!nombre || !email || !telefono || !fecha || !hora || !servicio || !num_personas) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (num_personas < 1 || num_personas > 8) {
      return NextResponse.json({ error: "El número de personas debe ser entre 1 y 8" }, { status: 400 });
    }

    // 1. Verificar que esa hora cae dentro de una ventana de servicio abierta ese día
    // (aplicando el horario de temporada si esa fecha cae dentro de una)
    const [horario] = await resolverHorariosDelDia(supabaseAdmin, fecha, servicio);

    if (!horario) {
      return NextResponse.json({ error: "Ese día no hay servicio abierto a esa hora" }, { status: 400 });
    }

    const { data: config } = await supabaseAdmin
      .from("bodega_config")
      .select("duracion_reserva_minutos")
      .limit(1)
      .single();
    const duracion = config?.duracion_reserva_minutos || 90;

    const inicioMin = horaAMinutos(hora);
    const finMin = inicioMin + duracion;

    if (inicioMin < horaAMinutos(horario.hora_apertura) || finMin > horaAMinutos(horario.hora_cierre)) {
      return NextResponse.json({ error: "Esa hora no está dentro del horario de servicio" }, { status: 400 });
    }

    const horaInicio = minutosAHora(inicioMin);
    const horaFin = minutosAHora(finMin);

    // 2. Buscar mesas que encajen (capacidad + zona si se ha pedido una concreta)
    let queryMesas = supabaseAdmin
      .from("mesas")
      .select("id, zona")
      .eq("activa", true)
      .lte("capacidad_min", num_personas)
      .gte("capacidad_max", num_personas);

    if (zona) queryMesas = queryMesas.eq("zona", zona);

    const { data: mesasCandidatas, error: errMesas } = await queryMesas;
    if (errMesas) throw errMesas;
    if (!mesasCandidatas || mesasCandidatas.length === 0) {
      return NextResponse.json({ error: "No hay mesas configuradas para ese número de personas" }, { status: 409 });
    }

    // 3. Ver qué mesas de esas candidatas ya están ocupadas en ese rango horario
    const { data: reservasDelDia, error: errReservasDelDia } = await supabaseAdmin
      .from("reservas")
      .select("mesa_id, hora_inicio, hora_fin")
      .eq("fecha", fecha)
      .in("estado", ESTADOS_QUE_OCUPAN_MESA)
      .in(
        "mesa_id",
        mesasCandidatas.map((m) => m.id)
      );

    if (errReservasDelDia) throw errReservasDelDia;

    const mesaLibre = mesasCandidatas.find((m) => {
      const ocupaciones = (reservasDelDia || []).filter((r) => r.mesa_id === m.id);
      return !ocupaciones.some((o) => {
        const oInicio = horaAMinutos(o.hora_inicio);
        const oFin = horaAMinutos(o.hora_fin);
        return inicioMin < oFin && oInicio < finMin;
      });
    });

    if (!mesaLibre) {
      return NextResponse.json(
        { error: "Ya no queda disponibilidad para esa hora. Prueba otra hora o apúntate a la lista de espera." },
        { status: 409 }
      );
    }

    // 4. Buscar o crear el cliente por email
    const { data: clienteExistente } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let clienteId = clienteExistente?.id;

    if (!clienteId) {
      const { data: nuevoCliente, error: errCliente } = await supabaseAdmin
        .from("clientes")
        .insert({ nombre, email, telefono })
        .select("id")
        .single();
      if (errCliente) throw errCliente;
      clienteId = nuevoCliente.id;
    }

    // 5. Crear la reserva. La restricción de la base de datos (exclude using gist)
    // actúa como red de seguridad final por si dos peticiones llegan a la vez.
    // Al insertar, el webhook configurado en Supabase dispara automáticamente
    // la Edge Function "notificar-reserva" (email + WhatsApp a cliente y bodega).
    const { data: reserva, error: errReserva } = await supabaseAdmin
      .from("reservas")
      .insert({
        cliente_id: clienteId,
        fecha,
        servicio,
        mesa_id: mesaLibre.id,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        duracion_minutos: duracion,
        num_personas,
        estado: "pendiente_confirmacion",
      })
      .select()
      .single();

    if (errReserva) {
      if (errReserva.code === "23P01" || errReserva.code === "23505") {
        return NextResponse.json(
          { error: "Ya no queda disponibilidad para esa hora. Prueba otra hora o apúntate a la lista de espera." },
          { status: 409 }
        );
      }
      throw errReserva;
    }

    return NextResponse.json({ ok: true, reserva });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear la reserva" }, { status: 500 });
  }
}
