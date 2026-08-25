import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseAdmin = crearClienteAdmin();
  const { data, error } = await supabaseAdmin
    .from("horarios_servicio")
    .select("*")
    .order("dia_semana", { ascending: true })
    .order("hora_apertura", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ horarios: data });
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = crearClienteAdmin();
  const { dia_semana, servicio, hora_apertura, hora_cierre, temporada_id } = await req.json();

  if (!dia_semana || !servicio || !hora_apertura || !hora_cierre) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("horarios_servicio")
    .insert({ dia_semana, servicio, hora_apertura, hora_cierre, temporada_id: temporada_id || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, horario: data });
}
