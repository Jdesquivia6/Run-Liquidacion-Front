import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#E9F1FA] via-blue-50 to-white">

      {/* Partículas decorativas flotantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-[#00ABE4]/5"
          style={{ top: '10%', left: '5%' }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-48 h-48 rounded-full bg-[#00ABE4]/8"
          style={{ top: '60%', right: '10%' }}
          animate={{
            y: [0, 15, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-[#00ABE4]/6"
          style={{ bottom: '20%', left: '15%' }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.25, 0.45, 0.25]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-20 h-20 rounded-full bg-[#00ABE4]/10"
          style={{ top: '30%', right: '25%' }}
          animate={{
            y: [0, 12, 0],
            opacity: [0.35, 0.55, 0.35]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-[#00ABE4]/4"
          style={{ bottom: '40%', right: '30%' }}
          animate={{
            y: [0, -18, 0],
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-[#00ABE4]/20"
          style={{ top: '15%', left: '40%' }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-[#00ABE4]/30"
          style={{ top: '45%', left: '20%' }}
          animate={{
            y: [0, 20, 0],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-[#00ABE4]/15"
          style={{ bottom: '30%', right: '15%' }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.25, 0.5, 0.25]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,171,228,0.15)] p-8 sm:p-10"
        >

          {emailEnviado ? (
            /* Estado de éxito */
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400/30"
              >
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Correo enviado</h2>
                <p className="text-[#64748b] text-sm">
                  Si el correo existe en nuestros registros, recibirás una contraseña temporal en tu bandeja de entrada.
                </p>
              </div>

              <div className="bg-[#00ABE4]/10 border border-[#00ABE4]/20 rounded-2xl p-4 text-left">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#00ABE4] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <p className="text-[#64748b] text-xs leading-relaxed">
                    Revisa también la carpeta de spam. La contraseña temporal tiene vigencia de 24 horas.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEmailEnviado(false)}
                className="w-full border-2 border-gray-100 text-[#64748b] hover:bg-gray-50 hover:border-[#00ABE4]/30 hover:text-[#00ABE4] rounded-2xl py-3 font-medium transition-all duration-300"
              >
                Enviar a otro correo
              </button>

              {/* Botón para ir al login */}
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#00ABE4] to-[#0090c4] hover:from-[#00ABE4] hover:to-[#007ba3] text-white font-semibold rounded-2xl py-3 px-6 transition-all duration-300 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span>Ir al inicio de sesión</span>
              </Link>
            </div>
          ) : (
            /* Formulario de recuperación */
            <>
              {/* Header */}
              <div className="text-center mb-8">
                {/* Logo clickeable que redirige al Landing */}
                <Link to="/" className="inline-block">
                  <motion.div
                    className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E9F1FA] to-[#00ABE4]/10 border-2 border-[#00ABE4]/20 mb-6 cursor-pointer"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(0, 171, 228, 0.2)",
                        "0 0 0 8px rgba(0, 171, 228, 0)",
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.svg
                      className="w-10 h-10 text-[#00ABE4]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </motion.svg>
                  </motion.div>
                </Link>

                <h1 className="text-3xl sm:text-4xl font-bold text-[#1e293b] mb-2">
                  Recuperar Contraseña
                </h1>
                <p className="text-[#64748b] text-sm">
                  Ingresa tu correo y te enviaremos una contraseña temporal para acceder al sistema.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00ABE4]/60">
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
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-[#1e293b] placeholder-[#64748b]/60 focus:outline-none focus:border-[#00ABE4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,171,228,0.15)] transition-all duration-300"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-[#00ABE4] to-[#0090c4] hover:from-[#00ABE4] hover:to-[#007ba3] disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-[#00ABE4]/25 disabled:shadow-none disabled:cursor-not-allowed"
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
                </motion.button>
              </form>

              {/* Link volver */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-[#00ABE4] hover:text-[#0090c4] font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[#64748b]/60 text-xs">
              ¿No tienes acceso? Contacta al administrador del sistema
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
