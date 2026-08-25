import { NextRequest, NextResponse } from "next/server";
import { resolverHorariosDelDia } from "@/lib/horarios";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const ESTADOS_QUE_OCUPAN_MESA = ["pendiente_confirmacion", "confirmada", "sentada", "completada"];
const PASO_MINUTOS = 15; // granularidad de las horas de inicio ofrecidas

function horaAMinutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}
function minutosAHora(mins: number) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = crearClienteAdmin();
  const fecha = req.nextUrl.searchParams.get("fecha");
  const numPersonasStr = req.nextUrl.searchParams.get("num_personas");

  if (!fecha || !numPersonasStr) {
    return NextResponse.json({ error: "Faltan parámetros fecha y num_personas" }, { status: 400 });
  }
  const numPersonas = Number(numPersonasStr);

  // 1. Ventanas de servicio abiertas ese día (aplicando temporada si corresponde)
  const horarios = await resolverHorariosDelDia(supabaseAdmin, fecha);
  if (!horarios || horarios.length === 0) return NextResponse.json({ servicios: [] });

  // 2. Duración estimada por reserva (config de la bodega)
  const { data: config } = await supabaseAdmin
    .from("bodega_config")
    .select("duracion_reserva_minutos")
    .limit(1)
    .single();
  const duracion = config?.duracion_reserva_minutos || 90;

  // 3. Mesas que encajan con el número de personas
  const { data: mesas, error: errMesas } = await supabaseAdmin
    .from("mesas")
    .select("id, zona")
    .eq("activa", true)
    .lte("capacidad_min", numPersonas)
    .gte("capacidad_max", numPersonas);

  if (errMesas) return NextResponse.json({ error: errMesas.message }, { status: 500 });
  if (!mesas || mesas.length === 0) return NextResponse.json({ servicios: [] });

  // 4. Reservas existentes ese día (para comprobar solapes de horario)
  const { data: reservasExistentes, error: errReservas } = await supabaseAdmin
    .from("reservas")
    .select("mesa_id, hora_inicio, hora_fin")
    .eq("fecha", fecha)
    .in("estado", ESTADOS_QUE_OCUPAN_MESA);

  if (errReservas) return NextResponse.json({ error: errReservas.message }, { status: 500 });

  const reservasPorMesa = new Map<string, { inicio: number; fin: number }[]>();
  for (const r of reservasExistentes || []) {
    if (!r.mesa_id) continue;
    const lista = reservasPorMesa.get(r.mesa_id) || [];
    lista.push({ inicio: horaAMinutos(r.hora_inicio), fin: horaAMinutos(r.hora_fin) });
    reservasPorMesa.set(r.mesa_id, lista);
  }

  function mesaLibreEn(mesaId: string, inicio: number, fin: number) {
    const ocupaciones = reservasPorMesa.get(mesaId) || [];
    return !ocupaciones.some((o) => inicio < o.fin && o.inicio < fin);
  }

  // 5. Generar horas de inicio candidatas cada 15 min dentro de cada ventana,
  //    y para cada una comprobar qué zonas tienen mesa libre.
  const servicios = horarios.map((h) => {
    const apertura = horaAMinutos(h.hora_apertura);
    const cierre = horaAMinutos(h.hora_cierre);
    const ultimaHoraInicio = cierre - duracion;

    const slots: { hora: string; zonas: string[] }[] = [];

    for (let inicio = apertura; inicio <= ultimaHoraInicio; inicio += PASO_MINUTOS) {
      const fin = inicio + duracion;
      const zonasMap = new Map<string, boolean>();

      for (const mesa of mesas) {
        const zonaKey = mesa.zona || "General";
        const libre = mesaLibreEn(mesa.id, inicio, fin);
        if (libre) zonasMap.set(zonaKey, true);
        else if (!zonasMap.has(zonaKey)) zonasMap.set(zonaKey, false);
      }

      const zonasDisponibles = Array.from(zonasMap.entries())
        .filter(([, disp]) => disp)
        .map(([zona]) => zona);

      if (zonasDisponibles.length > 0) {
        slots.push({ hora: minutosAHora(inicio), zonas: zonasDisponibles });
      }
    }

    return { servicio: h.servicio, duracion_minutos: duracion, slots };
  });

  return NextResponse.json({ servicios: servicios.filter((s) => s.slots.length > 0) });
}
