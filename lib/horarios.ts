import { SupabaseClient } from "@supabase/supabase-js";

export function diaIsoDeFecha(fecha: string) {
  const diaJs = new Date(`${fecha}T00:00:00`).getDay(); // 0=Domingo ... 6=Sábado
  return diaJs === 0 ? 7 : diaJs; // 1=Lunes ... 7=Domingo
}

type HorarioServicio = {
  id: string;
  servicio: string;
  hora_apertura: string;
  hora_cierre: string;
};

// Devuelve los horarios de servicio que aplican a una fecha concreta.
// Si hay una temporada activa que cubre esa fecha y tiene horarios
// definidos para ese día de la semana, se usan esos. Si no, se usa
// el horario general (temporada_id null).
export async function resolverHorariosDelDia(
  supabase: SupabaseClient,
  fecha: string,
  servicio?: string
): Promise<HorarioServicio[]> {
  const diaIso = diaIsoDeFecha(fecha);

  // 1. ¿Hay alguna temporada activa que cubra esta fecha?
  const { data: temporadas } = await supabase
    .from("temporadas")
    .select("id")
    .eq("activa", true)
    .lte("fecha_inicio", fecha)
    .gte("fecha_fin", fecha)
    .limit(1);

  const temporadaId = temporadas && temporadas.length > 0 ? temporadas[0].id : null;

  // 2. Si hay temporada, intentar horarios específicos de esa temporada
  if (temporadaId) {
    let query = supabase
      .from("horarios_servicio")
      .select("id, servicio, hora_apertura, hora_cierre")
      .eq("dia_semana", diaIso)
      .eq("activo", true)
      .eq("temporada_id", temporadaId);
    if (servicio) query = query.eq("servicio", servicio);

    const { data: horariosTemporada } = await query;
    if (horariosTemporada && horariosTemporada.length > 0) {
      return horariosTemporada;
    }
    // Si la temporada no tiene horario definido ese día, cae al general
  }

  // 3. Horario general (sin temporada asociada)
  let queryGeneral = supabase
    .from("horarios_servicio")
    .select("id, servicio, hora_apertura, hora_cierre")
    .eq("dia_semana", diaIso)
    .eq("activo", true)
    .is("temporada_id", null);
  if (servicio) queryGeneral = queryGeneral.eq("servicio", servicio);

  const { data: horariosGenerales } = await queryGeneral;
  return horariosGenerales || [];
}
