import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { cambiarMiPasswordRequest } from "../services/authApi";
import { useAuth } from "../auth/AuthContext";

export default function CambiarPassword() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [form, setForm] = useState({
    passwordActual: "",
    nuevaPassword: "",
    confirmarPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  // Validación de fortaleza de contraseña
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "nuevaPassword") {
      let strength = 0;
      if (value.length >= 8) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-yellow-500";
      case 4: return "bg-green-500";
      default: return "bg-gray-300";
    }
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 1: return "Débil";
      case 2: return "Regular";
      case 3: return "Buena";
      case 4: return "Fuerte";
      default: return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.nuevaPassword !== form.confirmarPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (form.nuevaPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      await cambiarMiPasswordRequest({
        passwordActual: form.passwordActual,
        nuevaPassword: form.nuevaPassword
      });

      const token = localStorage.getItem("token");

      login({
        token,
        user: { ...user, debe_cambiar_password: false }
      });

      toast.success("Contraseña actualizada correctamente");
      navigate("/");

    } catch (error) {
      toast.error(error.response?.data?.error || "No se pudo cambiar la contraseña");
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </motion.svg>
              </motion.div>
            </Link>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#1e293b] mb-2">
              Nueva Contraseña
            </h1>
            <p className="text-[#64748b] text-sm">
              Crea una contraseña segura para proteger tu cuenta del sistema.
            </p>
          </div>

          {/* Indicador de cambio obligatorio */}
          <div className="flex items-start gap-3 bg-[#00ABE4]/10 border border-[#00ABE4]/20 rounded-2xl p-4 mb-6">
            <svg className="w-5 h-5 text-[#00ABE4] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-[#1e293b] text-sm font-medium">Contraseña temporal</p>
              <p className="text-[#64748b] text-xs mt-0.5">
                Tu cuenta fue creada con una contraseña provisional. Debes cambiarla antes de continuar.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Contraseña actual */}
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Contraseña actual
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00ABE4]/60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type={verActual ? "text" : "password"}
                  name="passwordActual"
                  value={form.passwordActual}
                  onChange={handleChange}
                  required
                  placeholder="Ingresa tu contraseña actual"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-12 text-[#1e293b] placeholder-[#64748b]/60 focus:outline-none focus:border-[#00ABE4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,171,228,0.15)] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setVerActual(!verActual)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00ABE4]/60 hover:text-[#00ABE4] transition-colors"
                >
                  {verActual ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00ABE4]/60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </div>
                <input
                  type={verNueva ? "text" : "password"}
                  name="nuevaPassword"
                  value={form.nuevaPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Crea una nueva contraseña"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-12 text-[#1e293b] placeholder-[#64748b]/60 focus:outline-none focus:border-[#00ABE4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,171,228,0.15)] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setVerNueva(!verNueva)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00ABE4]/60 hover:text-[#00ABE4] transition-colors"
                >
                  {verNueva ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Indicador de fortaleza */}
              {form.nuevaPassword && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((nivel) => (
                      <div
                        key={nivel}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          nivel <= passwordStrength ? getStrengthColor() : "bg-gray-200"
                        }`}
                      ></div>
                    ))}
                  </div>
                  {passwordStrength > 0 && (
                    <p className={`text-xs font-medium transition-colors ${
                      passwordStrength <= 2 ? "text-red-500" : passwordStrength === 3 ? "text-yellow-500" : "text-green-500"
                    }`}>
                      Fortaleza: {getStrengthLabel()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00ABE4]/60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <input
                  type={verConfirmar ? "text" : "password"}
                  name="confirmarPassword"
                  value={form.confirmarPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Repite la nueva contraseña"
                  className={`w-full rounded-2xl py-4 pl-12 pr-12 text-[#1e293b] placeholder-[#64748b]/60 focus:outline-none transition-all duration-300 ${
                    form.confirmarPassword
                      ? form.confirmarPassword === form.nuevaPassword
                        ? "bg-green-50 border-2 border-green-500 focus:border-green-500 focus:bg-green-50 focus:shadow-[0_0_0_4px_rgba(34,197,94,0.15)]"
                        : "bg-red-50 border-2 border-red-500 focus:border-red-500 focus:bg-red-50 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.15)]"
                      : "bg-gray-50 border-2 border-gray-100 focus:border-[#00ABE4] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,171,228,0.15)]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVerConfirmar(!verConfirmar)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00ABE4]/60 hover:text-[#00ABE4] transition-colors"
                >
                  {verConfirmar ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Validación visual */}
              {form.confirmarPassword && (
                <div className="mt-2 flex items-center gap-2">
                  {form.confirmarPassword === form.nuevaPassword ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-xs text-green-500 font-medium">Las contraseñas coinciden</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs text-red-500 font-medium">Las contraseñas no coinciden</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Botón actualizar */}
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
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Actualizar Contraseña</span>
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Botón cerrar sesión */}
          <button
            type="button"
            onClick={logout}
            className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-gray-100 text-[#64748b] hover:bg-gray-50 hover:border-[#00ABE4]/30 hover:text-[#00ABE4] rounded-2xl py-3 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="text-sm font-medium">Cerrar sesión</span>
          </button>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[#64748b] text-xs">
              Tu nueva contraseña debe tener al menos 6 caracteres
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
