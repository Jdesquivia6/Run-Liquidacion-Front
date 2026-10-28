
import { useEffect, useState } from "react";
import {
  X, UserRound, Mail, Lock, Eye, EyeOff,
  ShieldCheck, Shield, Check, Save, UserPlus,
  Pencil, LayoutGrid, Info, ChevronDown
} from "lucide-react";

const INITIAL_FORM = {
  nombre: "",
  email: "",
  password: "",
  rol: "operario",
  modulos: []
};

const INPUT =
  "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#00ABE4] dark:border-slate-700 dark:bg-[#111F32] dark:text-slate-100 dark:placeholder:text-slate-500";

export default function UserModal({
  open,
  onClose,
  onSave,
  modulosDisponibles = [],
  initialData
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [verPassword, setVerPassword] = useState(false);

  const editando = Boolean(initialData);
  const esOperario = form.rol === "operario";
  const seleccionados = form.modulos.length;

  useEffect(() => {
    if (!open) return;

    setForm(
      initialData
        ? {
            nombre: initialData.nombre || "",
            email: initialData.email || "",
            password: "",
            rol: initialData.rol || "operario",
            modulos: [...(initialData.modulos || [])]
          }
        : { ...INITIAL_FORM, modulos: [] }
    );

    setVerPassword(false);
  }, [open, initialData]);

  // Bloquea el scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!open) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = e => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const actualizar = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const toggleModulo = codigo => {
    setForm(prev => ({
      ...prev,
      modulos: prev.modulos.includes(codigo)
        ? prev.modulos.filter(m => m !== codigo)
        : [...prev.modulos, codigo]
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(form);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[3px] sm:p-5"
      role="presentation"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
        className="flex max-h-[min(92dvh,850px)] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#172539] sm:rounded-3xl"
      >

        {/* ============================================
            ENCABEZADO
        ============================================ */}

        <header className="relative shrink-0 overflow-hidden border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-700 dark:bg-[#172539] sm:px-6 sm:py-5">
          <div className="pointer-events-none absolute -right-12 -top-20 h-44 w-44 rounded-full bg-sky-100/60 blur-2xl dark:bg-sky-500/5" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00ABE4]/10 text-[#0095C5] dark:bg-sky-400/10 dark:text-sky-400">
                {editando ? <Pencil size={21} /> : <UserPlus size={22} />}
              </div>

              <div className="min-w-0">
                <h2
                  id="user-modal-title"
                  className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl"
                >
                  {editando ? "Editar usuario" : "Nuevo usuario"}
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {editando
                    ? "Actualiza los datos y permisos de acceso."
                    : "Registra un usuario y configura sus permisos."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-[#111F32] dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X size={19} />
            </button>
          </div>
        </header>

        {/* ============================================
            CUERPO CON SCROLL INDEPENDIENTE
        ============================================ */}

        <form
          id="user-modal-form"
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="space-y-6 p-5 sm:p-6">

            {/* INFORMACIÓN GENERAL */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <UserRound size={17} className="text-[#0095C5] dark:text-sky-400" />

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Información del usuario
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* NOMBRE */}

                <div>
                  <label
                    htmlFor="usuario-nombre"
                    className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Nombre completo
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="usuario-nombre"
                      type="text"
                      value={form.nombre}
                      onChange={e => actualizar("nombre", e.target.value)}
                      placeholder="Nombre del usuario"
                      className={INPUT}
                    />
                  </div>
                </div>

                {/* CORREO */}

                <div>
                  <label
                    htmlFor="usuario-email"
                    className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Correo electrónico
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="usuario-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={e => actualizar("email", e.target.value)}
                      placeholder="correo@empresa.com"
                      className={INPUT}
                    />
                  </div>
                </div>

                {/* CONTRASEÑA: SOLO NUEVO USUARIO */}

                {!editando && (
                  <div>
                    <label
                      htmlFor="usuario-password"
                      className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Contraseña inicial
                    </label>

                    <div className="relative">
                      <Lock
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="usuario-password"
                        type={verPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={e => actualizar("password", e.target.value)}
                        placeholder="Contraseña temporal"
                        className={`${INPUT} pr-12`}
                      />

                      <button
                        type="button"
                        onClick={() => setVerPassword(v => !v)}
                        aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={verPassword}
                        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-[#0095C5] dark:hover:text-sky-400"
                      >
                        {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* ROL */}

                <div>
                  <label
                    htmlFor="usuario-rol"
                    className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Rol del usuario
                  </label>

                  <div className="relative">
                    <ShieldCheck
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      id="usuario-rol"
                      value={form.rol}
                      onChange={e => actualizar("rol", e.target.value)}
                      className={`${INPUT} cursor-pointer appearance-none pr-10`}
                    >
                      <option value="operario">Operario</option>
                      <option value="administrador">Administrador</option>
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* PERMISOS POR MÓDULO */}

            {esOperario && (
              <section className="border-t border-slate-100 pt-5 dark:border-slate-700">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <LayoutGrid
                      size={18}
                      className="mt-0.5 shrink-0 text-[#0095C5] dark:text-sky-400"
                    />

                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Módulos permitidos
                      </h3>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Selecciona los módulos a los que tendrá acceso.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1.5 text-[11px] font-bold text-[#0095C5] dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                    {seleccionados} de {modulosDisponibles.length}
                  </span>
                </div>

                {modulosDisponibles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {modulosDisponibles.map(modulo => {
                      const activo = form.modulos.includes(modulo.codigo);

                      return (
                        <label
                          key={modulo.codigo}
                          className={`flex min-h-[54px] cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                            activo
                              ? "border-[#00ABE4]/40 bg-sky-50 dark:border-sky-400/30 dark:bg-sky-400/10"
                              : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111F32] dark:hover:bg-slate-800"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={activo}
                            onChange={() => toggleModulo(modulo.codigo)}
                            className="sr-only"
                          />

                          <span
                            aria-hidden="true"
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              activo
                                ? "border-[#00ABE4] bg-[#00ABE4] text-white"
                                : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                            }`}
                          >
                            {activo && <Check size={14} strokeWidth={3} />}
                          </span>

                          <span
                            className={`text-xs font-semibold leading-5 ${
                              activo
                                ? "text-[#007EA9] dark:text-sky-300"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {modulo.nombre}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-[#111F32] dark:text-slate-400">
                    No hay módulos disponibles para asignar.
                  </div>
                )}
              </section>
            )}

            {/* INFORMACIÓN DE ROL ADMINISTRADOR */}

            {!esOperario && (
              <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                <Shield
                  size={19}
                  className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400"
                />

                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Rol administrador
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                    Los permisos por módulo se configuran para el rol operario.
                    Verifica que este usuario deba tener acceso administrativo.
                  </p>
                </div>
              </div>
            )}

            {/* NOTA INFORMATIVA */}

            {!editando && (
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 dark:bg-[#111F32]">
                <Info size={17} className="mt-0.5 shrink-0 text-[#0095C5] dark:text-sky-400" />

                <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Define una contraseña inicial y comparte las credenciales
                  mediante un canal autorizado.
                </p>
              </div>
            )}
          </div>
        </form>

        {/* ============================================
            FOOTER FIJO
        ============================================ */}

        <footer className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-slate-100 bg-white px-5 py-4 dark:border-slate-700 dark:bg-[#172539] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="hidden text-[11px] text-slate-400 dark:text-slate-500 sm:block">
            AutoCore · Gestión de usuarios
          </p>

          <div className="flex w-full gap-2.5 sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111F32] dark:text-slate-300 dark:hover:bg-slate-700 sm:flex-none"
            >
              Cancelar
            </button>

            <button
              type="submit"
              form="user-modal-form"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#00ABE4] px-5 text-xs font-bold text-white shadow-md shadow-sky-500/15 transition-colors hover:bg-[#0095C5] sm:flex-none"
            >
              <Save size={17} />
              {editando ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
