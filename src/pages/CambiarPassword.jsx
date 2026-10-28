
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CarFront, ShieldCheck, Lock, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2, ArrowRight,
  LogOut, KeyRound, Fingerprint, CircleCheck,
  Shield, Check, X
} from "lucide-react";
import toast from "react-hot-toast";
import { cambiarMiPasswordRequest } from "../services/authApi";
import { useAuth } from "../auth/AuthContext";

const INPUT = "h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-[16px] text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-50";
const CRITERIOS = [
  { label: "Mínimo 6 caracteres", test: v => v.length >= 6 },
  { label: "Una letra mayúscula", test: v => /[A-Z]/.test(v) },
  { label: "Un número", test: v => /[0-9]/.test(v) },
  { label: "Un carácter especial", test: v => /[^A-Za-z0-9]/.test(v) }
];

function BrandPanel({ obligatorio }) {
  const reduce = useReducedMotion();

  return (
    <aside className="relative hidden h-full min-h-0 flex-col overflow-y-auto bg-[#081F3A] px-8 py-5 text-white lg:flex xl:px-12 xl:py-7">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full border border-cyan-400/10" />
        <div className="absolute -right-16 -top-16 h-[350px] w-[350px] rounded-full border border-cyan-400/10" />
        <div className="absolute -bottom-40 -left-32 h-[440px] w-[440px] rounded-full bg-[#00ABE4]/10 blur-[90px]" />
        <div className="absolute inset-0 opacity-[0.045]" style={{
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

      <div className="relative z-10 my-auto w-full max-w-[510px] py-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">
            <ShieldCheck size={13} className="text-cyan-300" />
            <span className="text-[10px] font-bold tracking-wide text-cyan-200">
              SEGURIDAD DE TU CUENTA
            </span>
          </div>

          <h1 className="mt-5 text-[clamp(30px,3vw,47px)] font-extrabold leading-[1.12] tracking-tight">
            Protege tu acceso,
            <span className="mt-1 block text-[#43C9F0]">
              mantén el control.
            </span>
          </h1>

          <p className="mt-4 max-w-[430px] text-[13px] leading-6 text-slate-300 xl:text-sm">
            Actualiza tus credenciales y continúa gestionando
            tus operaciones en AutoCore.
          </p>

          <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Shield size={16} className="text-[#43C9F0]" />
              <span className="text-xs font-semibold">Protección de acceso</span>
            </div>

            <div className="space-y-4 p-4">
              {[
                ["Contraseña personal", "Utiliza una clave diferente a la anterior."],
                ["Acceso protegido", "No compartas tu contraseña con terceros."],
                ["Credenciales seguras", "Evita información fácil de adivinar."]
              ].map(([titulo, descripcion]) => (
                <div key={titulo} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00ABE4]/10 text-[#43C9F0]">
                    <CheckCircle2 size={18} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-100">{titulo}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {obligatorio && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
              <AlertCircle size={17} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-xs leading-5 text-amber-100">
                Se requiere actualizar la contraseña temporal para continuar.
              </p>
            </div>
          )}
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

function PasswordField({
  label, name, value, onChange, visible, toggle,
  placeholder, disabled, autoComplete = "new-password"
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required
          className={INPUT}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={toggle}
          aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-[#0095C5]"
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}

export default function CambiarPassword() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const reduce = useReducedMotion();
  const enviandoRef = useRef(false);
  const obligatorio = user?.debe_cambiar_password === true;

  const [form, setForm] = useState({
    passwordActual: "",
    nuevaPassword: "",
    confirmarPassword: ""
  });
  const [visible, setVisible] = useState({
    passwordActual: false,
    nuevaPassword: false,
    confirmarPassword: false
  });
  const [loading, setLoading] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const criterios = CRITERIOS.map(c => ({
    ...c, ok: c.test(form.nuevaPassword)
  }));
  const fortaleza = criterios.filter(c => c.ok).length;
  const coinciden = !!form.confirmarPassword &&
    form.confirmarPassword === form.nuevaPassword;

  const fuerzaColor = [
    "bg-slate-200", "bg-red-500", "bg-orange-500",
    "bg-amber-500", "bg-emerald-500"
  ][fortaleza];

  const fuerzaTexto = ["", "Débil", "Regular", "Buena", "Fuerte"][fortaleza];

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrorForm("");
  };

  const toggleVisible = name =>
    setVisible(prev => ({ ...prev, [name]: !prev[name] }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (enviandoRef.current) return;

    if (!form.passwordActual || !form.nuevaPassword || !form.confirmarPassword) {
      setErrorForm("Completa todos los campos.");
      return;
    }
    if (form.nuevaPassword.length < 6) {
      setErrorForm("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (form.nuevaPassword === form.passwordActual) {
      setErrorForm("La nueva contraseña debe ser diferente de la actual.");
      return;
    }
    if (form.nuevaPassword !== form.confirmarPassword) {
      setErrorForm("Las contraseñas no coinciden.");
      return;
    }

    enviandoRef.current = true;
    setLoading(true);
    setErrorForm("");

    try {
      await cambiarMiPasswordRequest({
        passwordActual: form.passwordActual,
        nuevaPassword: form.nuevaPassword
      });

      const token = localStorage.getItem("token");

      // Mantener contrato de autenticación utilizado en tu código.
      login({
        token,
        user: { ...user, debe_cambiar_password: false }
      });

      toast.success("Contraseña actualizada correctamente");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const mensaje = err?.response?.data?.error ||
        "No se pudo actualizar la contraseña.";
      setErrorForm(mensaje);
      toast.error(mensaje);
    } finally {
      enviandoRef.current = false;
      setLoading(false);
    }
  };

  const salir = async () => {
    if (loading) return;
    await logout();
  };

  return (
    <main className="grid min-h-dvh w-full bg-white lg:h-dvh lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:overflow-hidden">
      <BrandPanel obligatorio={obligatorio} />

      <section className="relative flex min-h-dvh min-w-0 flex-col bg-white lg:h-full lg:min-h-0 lg:overflow-y-auto">
        <div className="pointer-events-none absolute -right-36 -top-36 h-80 w-80 rounded-full bg-sky-100/50 blur-3xl lg:hidden" />

        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-5 py-3 sm:px-10 lg:px-10">
          <Link to="/" className="flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0095C5]">
            <CarFront size={17} /> AutoCore
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500">
            <Lock size={13} className="text-[#0095C5]" />
            Seguridad de cuenta
          </span>
        </header>

        <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-4 sm:px-10 lg:px-10">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.4 }}
            className="w-full max-w-[420px]"
          >
            <div className="mb-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-[#0095C5]">
                <Fingerprint size={24} />
              </div>

              <h1 className="text-[27px] font-extrabold tracking-tight text-slate-900 sm:text-[30px]">
                Cambiar contraseña
              </h1>
              <p className="mt-2 text-[13px] leading-5 text-slate-500">
                Actualiza tu contraseña para mantener protegido tu acceso.
              </p>
            </div>

            {obligatorio && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50 p-3">
                <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#0095C5]" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Cambio de contraseña obligatorio
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-600">
                    Debes reemplazar tu contraseña temporal antes de continuar.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <PasswordField
                label="Contraseña actual"
                name="passwordActual"
                value={form.passwordActual}
                onChange={handleChange}
                visible={visible.passwordActual}
                toggle={() => toggleVisible("passwordActual")}
                placeholder="Contraseña actual"
                autoComplete="current-password"
                disabled={loading}
              />

              <PasswordField
                label="Nueva contraseña"
                name="nuevaPassword"
                value={form.nuevaPassword}
                onChange={handleChange}
                visible={visible.nuevaPassword}
                toggle={() => toggleVisible("nuevaPassword")}
                placeholder="Crea una nueva contraseña"
                disabled={loading}
              />

              {form.nuevaPassword && (
                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Seguridad de contraseña
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">
                      {fuerzaTexto}
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(n => (
                      <span key={n} className={`h-1.5 flex-1 rounded-full ${
                        n <= fortaleza ? fuerzaColor : "bg-slate-200"
                      }`} />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {criterios.map(c => (
                      <div key={c.label}
                        className={`flex items-center gap-1 text-[10px] ${
                          c.ok ? "text-emerald-700" : "text-slate-500"
                        }`}>
                        {c.ok ? <Check size={12} /> : <X size={12} />}
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <PasswordField
                label="Confirmar nueva contraseña"
                name="confirmarPassword"
                value={form.confirmarPassword}
                onChange={handleChange}
                visible={visible.confirmarPassword}
                toggle={() => toggleVisible("confirmarPassword")}
                placeholder="Repite la nueva contraseña"
                disabled={loading}
              />

              {form.confirmarPassword && (
                <p className={`flex items-center gap-1.5 text-[11px] font-medium ${
                  coinciden ? "text-emerald-600" : "text-red-600"
                }`}>
                  {coinciden ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {coinciden
                    ? "Las contraseñas coinciden"
                    : "Las contraseñas no coinciden"}
                </p>
              )}

              {errorForm && (
                <div role="alert"
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
                className="flex h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-4 text-sm font-bold text-white shadow-lg shadow-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Actualizando...</>
                ) : (
                  <><KeyRound size={18} /> Actualizar contraseña <ArrowRight size={17} /></>
                )}
              </motion.button>
            </form>

            <button type="button"
              disabled={loading}
              onClick={salir}
              className="mt-3 flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <LogOut size={16} /> Cerrar sesión
            </button>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              No compartas tu contraseña con otras personas.
            </p>
          </motion.div>
        </div>

        <footer className="relative z-10 shrink-0 px-5 py-3 text-center">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} AutoCore · Centro de Operaciones Vehiculares
          </p>
        </footer>
      </section>
    </main>
  );
}
