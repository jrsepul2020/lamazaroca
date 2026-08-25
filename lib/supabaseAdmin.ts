import { createClient } from "@supabase/supabase-js";

// Next.js parchea el fetch global y cachea peticiones GET por defecto.
// Sin esto, el cliente de Supabase puede quedarse sirviendo para siempre
// la primera respuesta que obtuvo, ignorando filas nuevas.
export function crearClienteAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }) },
  });
}
