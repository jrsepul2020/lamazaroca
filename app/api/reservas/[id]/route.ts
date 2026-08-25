import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseAdmin = crearClienteAdmin();
  const { nombre, email, telefono, num_personas } = await req.json();

  const { data: reserva, error: errReserva } = await supabaseAdmin
    .from("reservas")
    .select("cliente_id")
    .eq("id", params.id)
    .single();

  if (errReserva) return NextResponse.json({ error: errReserva.message }, { status: 500 });

  const cambiosCliente: Record<string, unknown> = {};
  if (typeof nombre === "string" && nombre.trim()) cambiosCliente.nombre = nombre.trim();
  if (typeof email === "string" && email.trim()) cambiosCliente.email = email.trim();
  if (typeof telefono === "string" && telefono.trim()) cambiosCliente.telefono = telefono.trim();

  if (Object.keys(cambiosCliente).length > 0) {
    const { error: errCliente } = await supabaseAdmin
      .from("clientes")
      .update(cambiosCliente)
      .eq("id", reserva.cliente_id);
    if (errCliente) return NextResponse.json({ error: errCliente.message }, { status: 500 });
  }

  if (typeof num_personas === "number" && num_personas >= 1 && num_personas <= 8) {
    const { error: errReservaUpdate } = await supabaseAdmin
      .from("reservas")
      .update({ num_personas })
      .eq("id", params.id);
    if (errReservaUpdate) return NextResponse.json({ error: errReservaUpdate.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseAdmin = crearClienteAdmin();
  const { error } = await supabaseAdmin.from("reservas").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
