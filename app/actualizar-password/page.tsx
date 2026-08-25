"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/client";

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [listoParaActualizar, setListoParaActualizar] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const supabase = crearClienteNavegador();
    // El enlace del email deja a Supabase crear una sesión de recuperación.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setListoParaActualizar(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setListoParaActualizar(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");

    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("No se pudo actualizar la contraseña. Vuelve a solicitar el enlace.");
      setCargando(false);
      return;
    }

    setOk(true);
    setCargando(false);
    setTimeout(() => router.push("/admin"), 1500);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-espresso-950 px-5">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/img/lamazaroca.jpeg)" }}
      />
      <div className="absolute inset-0 bg-espresso-950/80" />

      <div className="relative w-full max-w-sm">
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-popover">
          <div className="bg-brand text-center">
            <img src="/img/logomazaroca1.jpg" alt="Bodega La Mazaroca" className="block w-full h-auto" />
            <p className="px-6 pb-5 pt-3 text-base font-bold uppercase tracking-wider text-white/80">Panel de reservas</p>
          </div>

          <div className="p-6">
          {!listoParaActualizar ? (
            <p className="text-sm text-ink/70">
              Abre el enlace que te hemos enviado por email para poder establecer una contraseña nueva.
            </p>
          ) : ok ? (
            <p className="text-sm text-ink/70">Contraseña actualizada. Entrando al panel...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={verPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 pr-10 text-sm text-ink outline-none focus:border-ink/40"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-ink/40 hover:text-ink/70"
                  >
                    {verPassword ? <EyeOff size={17} strokeWidth={1.75} /> : <Eye size={17} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
              >
                {cargando ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
