import { NextRequest, NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabaseAdmin = crearClienteAdmin();
  const { mesa_id } = await req.json();

  const { error } = await supabaseAdmin
    .from("reservas")
    .update({ mesa_id: mesa_id || null })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
