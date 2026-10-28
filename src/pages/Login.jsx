
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CarFront, Mail, Lock, Eye, EyeOff, ArrowRight,
  ArrowLeft, Loader2, ShieldCheck, Search, FileText,
  Workflow, CheckCircle2, Fingerprint, Layers3, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { loginRequest } from "../services/authApi";
import { useAuth } from "../auth/AuthContext";

const INPUT = "h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-[16px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 disabled:bg-slate-50";
const FEATURES = [
  { icon: Search, title: "Consultas vehiculares", description: "Información centralizada" },
  { icon: FileText, title: "Liquidaciones RUNT", description: "Gestión de trámites" },
  { icon: Workflow, title: "Integraciones", description: "Automatización de procesos" }
];

// ======================================================
// PANEL CORPORATIVO
// ======================================================

function BrandPanel() {
  const reduce = useReducedMotion();

  return (
    <aside className="relative hidden h-full min-h-0 flex-col overflow-y-auto bg-[#081F3A] px-8 py-5 text-white lg:flex xl:px-12 xl:py-7">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-36 -top-36 h-[480px] w-[480px] rounded-full border border-cyan-400/10" />
        <div className="absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full border border-cyan-400/10" />
        <div className="absolute -bottom-40 -left-32 h-[430px] w-[430px] rounded-full bg-[#00ABE4]/10 blur-[90px]" />
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
          backgroundSize: "45px 45px"
        }} />
      </div>

      <Link to="/" className="relative z-10 flex w-fit shrink-0 items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] shadow-lg shadow-cyan-500/20">
          <CarFront size={23} />
        </span>
        <span>
          <span className="block text-[22px] font-extrabold tracking-tight">
            Auto<span className="text-[#43C9F0]">Core</span>
          </span>
          <span className="block text-[9px] font-semibold tracking-[0.17em] text-slate-400">
            CENTRO DE OPERACIONES
          </span>
        </span>
      </Link>

      <div className="relative z-10 my-auto w-full max-w-[510px] py-5">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            <span className="text-[10px] font-bold tracking-wide text-cyan-200">
              PLATAFORMA DE OPERACIONES VEHICULARES
            </span>
          </div>

          <h1 className="mt-5 text-[clamp(30px,3vw,48px)] font-extrabold leading-[1.12] tracking-tight">
            Tu operación,
            <span className="mt-1 block text-[#43C9F0]">
              conectada en un solo lugar.
            </span>
          </h1>

          <p className="mt-4 max-w-[430px] text-[13px] leading-6 text-slate-300 xl:text-sm">
            Accede a las herramientas que simplifican las consultas,
            liquidaciones e integraciones de tu equipo.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Layers3 size={15} className="text-[#43C9F0]" />
                <span className="text-xs font-semibold">Espacio de trabajo AutoCore</span>
              </div>
              <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-slate-300">
                Plataforma
              </span>
            </div>

            <div className="divide-y divide-white/10 px-4">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-center gap-3 py-2.5 xl:py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00ABE4]/10 text-[#43C9F0]">
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-100">{title}</p>
                    <p className="text-[11px] text-slate-400">{description}</p>
                  </div>
                  <CheckCircle2 size={15} className="shrink-0 text-cyan-400/80" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
        <span className="flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck size={15} className="text-[#43C9F0]" />
          Acceso para usuarios autorizados
        </span>
        <span className="text-[11px] text-slate-500">
          © {new Date().getFullYear()} AutoCore
        </span>
      </div>
    </aside>
  );
}

// ======================================================
// LOGIN
// ======================================================

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const reduce = useReducedMotion();
  const enviandoRef = useRef(false);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errorForm) setErrorForm("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (enviandoRef.current) return;

    const email = form.email.trim();

    if (!email || !form.password) {
      setErrorForm("Ingresa tu correo electrónico y contraseña.");
      return;
    }

    enviandoRef.current = true;
    setLoading(true);
    setErrorForm("");

    try {
      const resp = await loginRequest({ email, password: form.password });
      login(resp);
      toast.success("Bienvenido a AutoCore");

      navigate(
        resp.user?.debe_cambiar_password === true
          ? "/cambiar-password"
          : "/dashboard",
        { replace: true }
      );
    } catch (err) {
      const mensaje = err?.response?.data?.error ||
        "No fue posible iniciar sesión. Verifica tus credenciales.";
      setErrorForm(mensaje);
      toast.error(mensaje);
    } finally {
      enviandoRef.current = false;
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-dvh w-full bg-white lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <BrandPanel />

      {/* El desplazamiento, cuando sea necesario, queda dentro del panel */}
      <section className="relative flex min-h-dvh min-w-0 flex-col bg-white lg:h-full lg:min-h-0 lg:overflow-y-auto">
        <div className="pointer-events-none absolute -right-36 -top-36 h-80 w-80 rounded-full bg-sky-100/50 blur-3xl lg:hidden" />

        {/* BARRA SUPERIOR */}
        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-5 py-4 sm:px-10 lg:px-10">
          <Link to="/" className="flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0095C5]">
            <ArrowLeft size={17} /> Volver al inicio
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500">
            <Lock size={13} className="text-[#0095C5]" /> Acceso privado
          </span>
        </header>

        {/* FORMULARIO */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-5 sm:px-10 lg:px-10">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.4 }}
            className="w-full max-w-[420px]"
          >
            <div className="mb-6">
              <Link to="/" className="mb-5 flex w-fit items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] text-white">
                  <CarFront size={24} />
                </div>
                <span className="text-2xl font-extrabold text-slate-900">
                  Auto<span className="text-[#00ABE4]">Core</span>
                </span>
              </Link>

              <div className="mb-4 hidden h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-[#0095C5] lg:flex">
                <Fingerprint size={24} />
              </div>

              <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px]">
                Bienvenido de nuevo
              </h1>

              <p className="mt-2 text-[13px] leading-6 text-slate-500">
                Ingresa tus credenciales para acceder a tu espacio de trabajo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={loading}
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nombre@empresa.com"
                    className={INPUT}
                    aria-invalid={Boolean(errorForm)}
                    aria-describedby={errorForm ? "login-error" : undefined}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="password" className="text-[13px] font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <Link
                    to="/recuperar-password"
                    className="inline-flex min-h-11 items-center text-xs font-semibold text-[#0095C5] hover:underline"
                  >
                    ¿La olvidaste?
                  </Link>
                </div>

                <div className="relative">
                  <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={verPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Ingresa tu contraseña"
                    className={INPUT}
                    aria-invalid={Boolean(errorForm)}
                    aria-describedby={errorForm ? "login-error" : undefined}
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setVerPassword(v => !v)}
                    aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={verPassword}
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-[#0095C5]"
                  >
                    {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {errorForm && (
                <div id="login-error" role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle size={17} className="shrink-0 text-red-500" />
                  {errorForm}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={reduce || loading ? undefined : { y: -1 }}
                whileTap={reduce || loading ? undefined : { scale: 0.99 }}
                className="flex h-[54px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-5 text-sm font-bold text-white shadow-lg shadow-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    Verificando credenciales...
                  </>
                ) : (
                  <>
                    Iniciar sesión <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="flex items-start gap-3 rounded-xl bg-[#F5F9FC] p-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#0095C5]" />
                <p className="text-xs leading-5 text-slate-500">
                  Acceso para usuarios autorizados. Si tienes problemas
                  para ingresar, contacta al administrador de tu organización.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <footer className="relative z-10 shrink-0 px-5 py-3 text-center sm:px-10">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} AutoCore · Centro de Operaciones Vehiculares
          </p>
        </footer>
      </section>
    </main>
  );
}
