"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/client";

const CLAVE_EMAIL_RECORDADO = "mazaroca_email_recordado";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "recuperar">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);

  useEffect(() => {
    const emailGuardado = localStorage.getItem(CLAVE_EMAIL_RECORDADO);
    if (emailGuardado) {
      setEmail(emailGuardado);
      setRecordar(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");

    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos");
      setCargando(false);
      return;
    }

    if (recordar) {
      localStorage.setItem(CLAVE_EMAIL_RECORDADO, email);
    } else {
      localStorage.removeItem(CLAVE_EMAIL_RECORDADO);
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");

    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });

    setCargando(false);
    if (error) {
      setError("No se pudo enviar el enlace. Comprueba el email.");
      return;
    }
    setEnlaceEnviado(true);
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
            <p className="px-6 pb-5 pt-3 text-sm uppercase tracking-wider text-white/70">Panel de reservas</p>
          </div>

          <div className="p-6">
            {modo === "login" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={verPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
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

                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={recordar}
                    onChange={(e) => setRecordar(e.target.checked)}
                    className="h-4 w-4 rounded border-line accent-espresso-900"
                  />
                  Recordar contraseña
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  {cargando ? "Entrando..." : "Entrar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModo("recuperar");
                    setError("");
                    setEmailRecuperar(email);
                  }}
                  className="w-full text-center text-sm text-ink/60 hover:text-ink"
                >
                  ¿Has olvidado tu contraseña?
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {enlaceEnviado ? (
                  <p className="text-sm text-ink/70">
                    Te hemos enviado un enlace a <span className="font-medium text-ink">{emailRecuperar}</span> para
                    restablecer tu contraseña.
                  </p>
                ) : (
                  <form onSubmit={handleRecuperar} className="space-y-4">
                    <div>
                      <label htmlFor="emailRecuperar" className="mb-1.5 block text-sm font-medium text-ink">
                        Email
                      </label>
                      <input
                        id="emailRecuperar"
                        type="email"
                        required
                        autoComplete="email"
                        value={emailRecuperar}
                        onChange={(e) => setEmailRecuperar(e.target.value)}
                        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                      />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                      type="submit"
                      disabled={cargando}
                      className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                    >
                      {cargando ? "Enviando..." : "Enviar enlace"}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setModo("login");
                    setError("");
                    setEnlaceEnviado(false);
                  }}
                  className="w-full text-center text-sm text-ink/60 hover:text-ink"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
