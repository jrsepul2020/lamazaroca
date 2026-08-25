import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseAdmin = crearClienteAdmin();
  const { data, error } = await supabaseAdmin
    .from("temporadas")
    .select("*")
    .order("fecha_inicio", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ temporadas: data });
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = crearClienteAdmin();
  const { nombre, fecha_inicio, fecha_fin } = await req.json();

  if (!nombre || !fecha_inicio || !fecha_fin) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
  }
  if (fecha_fin < fecha_inicio) {
    return NextResponse.json({ error: "La fecha de fin no puede ser anterior a la de inicio" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("temporadas")
    .insert({ nombre, fecha_inicio, fecha_fin })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, temporada: data });
}
