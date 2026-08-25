import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const ESTADOS_VALIDOS = [
  "pendiente_confirmacion",
  "confirmada",
  "sentada",
  "completada",
  "no_show",
  "cancelada",
  "lista_espera",
];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseAdmin = crearClienteAdmin();
  const { estado } = await req.json();

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("reservas")
    .update({ estado })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
