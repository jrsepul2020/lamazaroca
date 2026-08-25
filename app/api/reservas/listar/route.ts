import { NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseAdmin = crearClienteAdmin();

  const { data, error } = await supabaseAdmin
    .from("reservas")
    .select(
      "id, fecha, hora_inicio, hora_fin, num_personas, estado, mesa_id, servicio, notas, clientes(nombre, email, telefono), mesas(nombre, zona)"
    )
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservas: data });
}
