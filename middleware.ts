import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas de API que el formulario público de /reservar necesita sin sesión.
// Coincidencia exacta: /api/reservas/listar o /api/reservas/[id]/* siguen protegidas.
const RUTAS_API_PUBLICAS = ["/api/disponibilidad", "/api/reservas"];

function esRutaApiPublica(pathname: string) {
  return RUTAS_API_PUBLICAS.includes(pathname);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esAdmin = pathname.startsWith("/admin");
  const esApi = pathname.startsWith("/api");

  if (esAdmin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (esApi && !esRutaApiPublica(pathname) && !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (pathname === "/" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/"],
};
