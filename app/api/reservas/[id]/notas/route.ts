import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseAdmin = crearClienteAdmin();
  const { notas } = await req.json();

  const { error } = await supabaseAdmin
    .from("reservas")
    .update({ notas: typeof notas === "string" && notas.trim() ? notas.trim() : null })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
