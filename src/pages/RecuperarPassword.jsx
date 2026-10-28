
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CarFront, Mail, Lock, ShieldCheck, ArrowLeft,
  ArrowRight, Loader2, CheckCircle2, AlertCircle,
  KeyRound, Send, Inbox, Clock3, LifeBuoy
} from "lucide-react";
import toast from "react-hot-toast";
import { recuperarPasswordRequest } from "../services/authApi";

const INPUT =
  "h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-[16px] text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-50";

function BrandPanel() {
  const reduce = useReducedMotion();

  return (
    <aside className="relative hidden h-full min-h-0 flex-col overflow-y-auto bg-[#081F3A] px-8 py-5 text-white lg:flex xl:px-12 xl:py-7">

      {/* FONDO CORPORATIVO */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-36 -top-36 h-[480px] w-[480px] rounded-full border border-cyan-400/10" />
        <div className="absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full border border-cyan-400/10" />
        <div className="absolute -bottom-40 -left-32 h-[440px] w-[440px] rounded-full bg-[#00ABE4]/10 blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
            backgroundSize: "45px 45px"
          }}
        />
      </div>

      {/* MARCA */}

      <Link
        to="/"
        className="relative z-10 flex w-fit shrink-0 items-center gap-3"
      >
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

      {/* CONTENIDO INSTITUCIONAL */}

      <div className="relative z-10 my-auto w-full max-w-[510px] py-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.4 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">
            <ShieldCheck size={14} className="text-cyan-300" />

            <span className="text-[10px] font-bold tracking-wide text-cyan-200">
              RECUPERACIÓN DE ACCESO
            </span>
          </div>

          <h1 className="mt-5 text-[clamp(30px,3vw,47px)] font-extrabold leading-[1.12] tracking-tight">
            Recupera tu acceso,
            <span className="mt-1 block text-[#43C9F0]">
              continúa tu operación.
            </span>
          </h1>

          <p className="mt-4 max-w-[430px] text-[13px] leading-6 text-slate-300 xl:text-sm">
            Te ayudamos a restablecer el acceso a AutoCore
            mediante el correo electrónico asociado a tu cuenta.
          </p>

          {/* PASOS DE RECUPERACIÓN */}

          <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <KeyRound size={16} className="text-[#43C9F0]" />

              <span className="text-xs font-semibold">
                Proceso de recuperación
              </span>
            </div>

            <div className="divide-y divide-white/10 px-4">
              {[
                {
                  icon: Mail,
                  title: "Ingresa tu correo",
                  description: "Utiliza el correo de tu cuenta AutoCore."
                },
                {
                  icon: Inbox,
                  title: "Revisa tu bandeja",
                  description: "Busca el mensaje con las instrucciones."
                },
                {
                  icon: ShieldCheck,
                  title: "Recupera tu acceso",
                  description: "Utiliza las credenciales recibidas."
                }
              ].map(({ icon: Icon, title, description }, i) => (
                <div key={title} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00ABE4]/10 text-[#43C9F0]">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-100">
                      {title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {description}
                    </p>
                  </div>

                  <span className="text-[11px] font-bold text-cyan-300/70">
                    0{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* FOOTER IZQUIERDO */}

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
// PÁGINA PRINCIPAL
// ======================================================

export default function RecuperarPassword() {
  const reduce = useReducedMotion();
  const enviandoRef = useRef(false);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    if (enviandoRef.current) return;

    const correo = email.trim();

    if (!correo) {
      setErrorForm("Ingresa tu correo electrónico.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setErrorForm("Ingresa un correo electrónico válido.");
      return;
    }

    enviandoRef.current = true;
    setLoading(true);
    setErrorForm("");

    try {
      // Conservamos el contrato original del servicio.
      const resp = await recuperarPasswordRequest(correo);

      if (resp?.ok === false) {
        throw new Error(resp.error || "No se pudo procesar la solicitud.");
      }

      setEmailEnviado(true);

      toast.success(
        "Solicitud de recuperación procesada correctamente."
      );
    } catch (err) {
      const mensaje =
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo procesar la solicitud de recuperación.";

      setErrorForm(mensaje);
      toast.error(mensaje);
    } finally {
      enviandoRef.current = false;
      setLoading(false);
    }
  };

  const otraSolicitud = () => {
    setEmail("");
    setEmailEnviado(false);
    setErrorForm("");
  };

  return (
    <main className="grid min-h-dvh w-full bg-white lg:h-dvh lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:overflow-hidden">

      <BrandPanel />

      {/* PANEL DERECHO */}

      <section className="relative flex min-h-dvh min-w-0 flex-col bg-white lg:h-full lg:min-h-0 lg:overflow-y-auto">
        <div className="pointer-events-none absolute -right-36 -top-36 h-80 w-80 rounded-full bg-sky-100/50 blur-3xl lg:hidden" />

        {/* NAVEGACIÓN SUPERIOR */}

        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-5 py-4 sm:px-10 lg:px-10">
          <Link
            to="/login"
            className="flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0095C5]"
          >
            <ArrowLeft size={17} />
            Volver al login
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500">
            <Lock size={13} className="text-[#0095C5]" />
            Recuperación segura
          </span>
        </header>

        {/* CONTENIDO CENTRAL */}

        <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-5 sm:px-10 lg:px-10">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.4 }}
            className="w-full max-w-[420px]"
          >

            {/* FORMULARIO DE RECUPERACIÓN */}

            {!emailEnviado ? (
              <>
                <div className="mb-7">
                  <Link to="/" className="mb-5 flex w-fit items-center gap-3 lg:hidden">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] text-white">
                      <CarFront size={23} />
                    </span>

                    <span className="text-2xl font-extrabold text-slate-900">
                      Auto<span className="text-[#00ABE4]">Core</span>
                    </span>
                  </Link>

                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-[#0095C5]">
                    <KeyRound size={25} />
                  </div>

                  <h1 className="text-[29px] font-extrabold tracking-tight text-slate-900 sm:text-[32px]">
                    Recuperar contraseña
                  </h1>

                  <p className="mt-3 text-[13px] leading-6 text-slate-500">
                    Ingresa tu correo electrónico registrado.
                    Te enviaremos las instrucciones para recuperar
                    el acceso a tu cuenta.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[13px] font-semibold text-slate-700"
                    >
                      Correo electrónico
                    </label>

                    <div className="relative">
                      <Mail
                        size={19}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="email"
                        type="email"
                        value={email}
                        disabled={loading}
                        onChange={e => {
                          setEmail(e.target.value);
                          if (errorForm) setErrorForm("");
                        }}
                        required
                        autoComplete="email"
                        autoCapitalize="none"
                        inputMode="email"
                        spellCheck={false}
                        placeholder="nombre@empresa.com"
                        className={INPUT}
                        aria-invalid={Boolean(errorForm)}
                        aria-describedby={errorForm ? "recover-error" : undefined}
                      />
                    </div>
                  </div>

                  {errorForm && (
                    <div
                      id="recover-error"
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700"
                    >
                      <AlertCircle size={17} className="shrink-0 text-red-500" />
                      {errorForm}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={reduce || loading ? undefined : { y: -1 }}
                    whileTap={reduce || loading ? undefined : { scale: 0.99 }}
                    className="flex h-[54px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-4 text-sm font-bold text-white shadow-lg shadow-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={19} className="animate-spin" />
                        Procesando solicitud...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar solicitud
                        <ArrowRight size={17} />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#F5F9FC] p-4">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-[#0095C5]"
                  />

                  <p className="text-xs leading-5 text-slate-500">
                    Por seguridad, la confirmación no indica
                    si una dirección de correo está registrada.
                  </p>
                </div>
              </>
            ) : (

              // ==========================================
              // CONFIRMACIÓN DE SOLICITUD
              // ==========================================

              <div>
                <motion.div
                  initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduce ? 0 : 0.35 }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600"
                >
                  <CheckCircle2 size={33} />
                </motion.div>

                <h1 className="text-[30px] font-extrabold tracking-tight text-slate-900">
                  Solicitud recibida
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Si el correo electrónico se encuentra registrado,
                  recibirás un mensaje con las instrucciones
                  para recuperar tu acceso a AutoCore.
                </p>

                <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-[#F8FBFD] p-4">
                  <div className="flex items-start gap-3">
                    <Inbox size={19} className="mt-0.5 shrink-0 text-[#0095C5]" />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Revisa tu correo
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Consulta tu bandeja de entrada y la carpeta
                        de correo no deseado o spam.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-slate-200 pt-3">
                    <Clock3 size={19} className="mt-0.5 shrink-0 text-[#0095C5]" />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Utiliza las instrucciones recibidas
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Si recibes una contraseña temporal, cámbiala
                        cuando el sistema te lo solicite.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    to="/login"
                    className="flex h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#00ABE4] text-sm font-bold text-white transition-colors hover:bg-[#0095C5]"
                  >
                    Ir al inicio de sesión
                    <ArrowRight size={18} />
                  </Link>

                  <button
                    type="button"
                    onClick={otraSolicitud}
                    className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Mail size={17} />
                    Enviar a otro correo
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* FOOTER */}

        <footer className="relative z-10 shrink-0 px-5 py-3 text-center">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} AutoCore · Centro de Operaciones Vehiculares
          </p>
        </footer>
      </section>
    </main>
  );
}
