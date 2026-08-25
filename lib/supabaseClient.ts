import { createClient } from "@supabase/supabase-js";

// Estas dos variables van en un archivo .env.local (no se sube a git):
// NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica
//
// La anon key es segura de exponer en el navegador: no da acceso de escritura
// directo porque Row Level Security está activado en todas las tablas.
// Toda la escritura real pasa por las funciones de servidor (app/api/*),
// que usan la service_role key solo en el backend.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
