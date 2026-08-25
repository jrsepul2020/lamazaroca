import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseAdmin = crearClienteAdmin();
  const { data, error } = await supabaseAdmin
    .from("mesas")
    .select("*")
    .eq("activa", true)
    .order("nombre", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mesas: data });
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = crearClienteAdmin();
  const { nombre, zona, capacidad_min, capacidad_max } = await req.json();

  if (!nombre || !capacidad_max) {
    return NextResponse.json({ error: "Nombre y capacidad máxima son obligatorios" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("mesas")
    .insert({
      nombre,
      zona: zona || null,
      capacidad_min: capacidad_min || 1,
      capacidad_max,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mesa: data });
}
