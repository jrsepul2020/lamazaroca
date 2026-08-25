import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseAdmin = crearClienteAdmin();
  const { activo, hora_apertura, hora_cierre } = await req.json();

  const cambios: Record<string, unknown> = {};
  if (typeof activo === "boolean") cambios.activo = activo;
  if (hora_apertura) cambios.hora_apertura = hora_apertura;
  if (hora_cierre) cambios.hora_cierre = hora_cierre;

  const { error } = await supabaseAdmin.from("horarios_servicio").update(cambios).eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseAdmin = crearClienteAdmin();
  const { error } = await supabaseAdmin.from("horarios_servicio").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
