import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { recuperarPasswordRequest } from "../services/authApi";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const resp = await recuperarPasswordRequest(email);

      toast.success(resp.message || "Correo enviado");
      setEmail("");
      setEmailEnviado(true);

    } catch (error) {
      toast.error(error.response?.data?.error || "No se pudo recuperar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">

      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-900/20 blur-3xl"></div>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-blue-700/20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-900/20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full border border-cyan-700/20"></div>

        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        ></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">

        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-10">
            {/* Icono de recuperación */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 mb-6">
              <svg className="w-10 h-10 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.635 2.335l-2.221.741a2.25 2.25 0 00-1.762.736l-.335.111a2.25 2.25 0 00-.6 1v.905a2.25 2.25 0 01-1.635 2.335l-2.221.741a2.25 2.25 0 00-1.762.736l-.335.111a2.25 2.25 0 00-.6 1v.905c0 .63.23 1.22.635 1.659l2.22.741a2.25 2.25 0 001.762.736l.336.111a2.25 2.25 0 00.6-1v-.905a2.25 2.25 0 011.635-2.335l2.221-.74a2.25 2.25 0 001.762-.736l.335-.112a2.25 2.25 0 00.6 1v.906c0 .63-.23 1.22-.635 1.659l-2.22.741a2.25 2.25 0 00-1.762.736l-.336.111a2.25 2.25 0 00-.6-1v-.905a2.25 2.25 0 00-.6 1l-.336.111a2.25 2.25 0 00-1.762-.736l-2.22-.74A2.25 2.25 0 012.25 15.75V14.25a2.25 2.25 0 01.635-1.659l2.22-.741a2.25 2.25 0 001.762-.736l.336-.111a2.25 2.25 0 00.6 1v.905a2.25 2.25 0 00-.6 1l-.336.111a2.25 2.25 0 00-1.762.736l-2.22.741A2.25 2.25 0 012.25 18v-1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v3.75m-6.75 0h9.75" />
              </svg>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Recuperar Contraseña
            </h1>
            <p className="text-blue-300/80 text-sm">
              Ingresa tu correo y te enviaremos una contraseña temporal para acceder al sistema.
            </p>
          </div>

          {/* Card principal */}
          <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-8">

            {emailEnviado ? (
              /* Estado de éxito */
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Correo enviado</h2>
                  <p className="text-blue-300/70 text-sm">
                    Si el correo existe en nuestros registros, recibirás una contraseña temporal en tu bandeja de entrada.
                  </p>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-blue-300/80 text-xs leading-relaxed">
                    Revisa también la carpeta de spam. La contraseña temporal tiene vigencia de 24 horas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEmailEnviado(false)}
                  className="w-full border border-white/20 text-blue-200 hover:bg-white/10 rounded-2xl py-3 font-medium transition-all duration-300"
                >
                  Enviar a otro correo
                </button>
              </div>
            ) : (
              /* Formulario de recuperación */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/60">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Correo electrónico registrado"
                    className="w-full bg-white/[0.08] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-blue-200/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/[0.12] transition-all duration-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-blue-800 disabled:to-cyan-800 text-white font-semibold rounded-2xl py-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        <span>Enviar Contraseña Temporal</span>
                      </>
                    )}
                  </span>
                </button>
              </form>
            )}

            {/* Link volver */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-blue-300/70 hover:text-blue-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Volver al inicio de sesión
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-blue-400/40 text-xs">
              ¿No tienes acceso? Contacta al administrador del sistema
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}