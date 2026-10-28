
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  listarUsuarios, listarModulos, crearUsuario,
  actualizarUsuario, cambiarPassword, eliminarUsuario
} from "../services/usersApi";
import UserModal from "../components/UserModal";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../auth/AuthContext";
import {
  Users, UserPlus, UserCheck, UserX, Search, Filter,
  RefreshCw, Pencil, Trash2, ChevronLeft, ChevronRight,
  ShieldCheck, X, Loader2, Eye
} from "lucide-react";

// ======================================================
// CONFIGURACIÓN
// ======================================================

const POR_PAGINA = 10;
const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const BTN = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";
const PRIMARY = `${BTN} bg-[#00ABE4] text-white hover:bg-[#0095C5]`;
const OUTLINE = `${BTN} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;
const INPUT = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#00ABE4] focus:ring-2 focus:ring-sky-100";

const rolNombre = rol =>
  rol === "administrador" ? "Administrador" :
  rol === "operario" ? "Operario" : rol || "Sin rol";

const obtenerModulos = usuario =>
  Array.isArray(usuario.modulos) ? usuario.modulos : [];

const nombreModulo = m => {
  if (typeof m === "string") return m;
  if (typeof m === "object" && m !== null) {
    return m.nombre || m.nombre_modulo || m.slug || String(m.id_modulo || "Módulo");
  }
  return String(m);
};

const errorApi = (error, fallback) =>
  error?.response?.data?.error || error?.message || fallback;

// ======================================================
// INDICADORES
// ======================================================

function Indicador({ titulo, valor, icono: Icon, color }) {
  const estilos = {
    blue: "bg-sky-50 text-[#0095C5]",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600"
  };

  return (
    <div className={`${CARD} flex items-center gap-3 p-4`}>
      <div className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex ${estilos[color]}`}>
        <Icon size={21} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{titulo}</p>
        <p className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
          {valor.toLocaleString("es-CO")}
        </p>
      </div>
    </div>
  );
}

// ======================================================
// MODAL PARA CONSULTAR PERMISOS
// ======================================================

function ModalPermisos({ usuario, cerrar }) {
  useEffect(() => {
    if (!usuario) return;
    const tecla = e => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [usuario, cerrar]);

  if (!usuario) return null;

  const administrador = usuario.rol === "administrador";
  const permisos = obtenerModulos(usuario);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={e => e.target === e.currentTarget && cerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Permisos del usuario"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-[#00ABE4]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Permisos del usuario</h3>
              <p className="text-xs text-slate-500">
                {usuario.nombre || usuario.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5">
          {administrador ? (
            <div className="flex items-start gap-3 rounded-xl bg-sky-50 p-4">
              <ShieldCheck size={20} className="shrink-0 text-[#0095C5]" />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Acceso total
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Este usuario tiene rol de administrador y acceso
                  a todos los módulos autorizados para dicho rol.
                </p>
              </div>
            </div>
          ) : permisos.length ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {permisos.map((m, i) => (
                <div
                  key={`${nombreModulo(m)}-${i}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <ShieldCheck size={15} className="shrink-0 text-[#0095C5]" />
                  <span className="break-words text-xs font-medium text-slate-700">
                    {nombreModulo(m)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
              Este usuario no tiene módulos asignados.
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 p-4">
          <button type="button" className={PRIMARY} onClick={cerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function Usuarios() {
  const { user: authUser } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [usuarioPermisos, setUsuarioPermisos] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [pagina, setPagina] = useState(1);

  // ====================================================
  // CARGAR USUARIOS Y MÓDULOS
  // ====================================================

  const cargar = useCallback(async () => {
    try {
      setLoading(true);

      const [usersResp, modulosResp] = await Promise.all([
        listarUsuarios(),
        listarModulos()
      ]);

      setUsuarios(usersResp?.results || []);
      setModulos(modulosResp?.results || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      toast.error(errorApi(error, "Error cargando usuarios"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ====================================================
  // ESTADÍSTICAS Y FILTROS
  // ====================================================

  const estadisticas = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo === true).length,
    inactivos: usuarios.filter(u => u.activo !== true).length
  }), [usuarios]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-CO");

    return usuarios.filter(u => {
      const coincideBusqueda =
        !texto ||
        String(u.nombre || "").toLocaleLowerCase("es-CO").includes(texto) ||
        String(u.email || "").toLocaleLowerCase("es-CO").includes(texto);

      const coincideRol =
        filtroRol === "todos" || u.rol === filtroRol;

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activos" && u.activo === true) ||
        (filtroEstado === "inactivos" && u.activo !== true);

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const totalPaginas = Math.max(
    1, Math.ceil(filtrados.length / POR_PAGINA)
  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const visibles = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  const inicio = filtrados.length
    ? (paginaActual - 1) * POR_PAGINA + 1
    : 0;

  const fin = Math.min(
    paginaActual * POR_PAGINA,
    filtrados.length
  );

  const cambiarFiltros = (setter, valor) => {
    setter(valor);
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroRol("todos");
    setFiltroEstado("todos");
    setPagina(1);
  };

  // ====================================================
  // CREAR Y EDITAR
  // ====================================================

  const abrirCrear = () => {
    setEditingUser(null);
    setOpenModal(true);
  };

  const abrirEditar = usuario => {
    setEditingUser(usuario);
    setOpenModal(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setOpenModal(false);
    setEditingUser(null);
  };

  const handleSave = async form => {
    if (guardando) return;

    setGuardando(true);

    try {
      if (editingUser) {
        // No enviar la contraseña en la actualización de datos:
        // se gestiona mediante su servicio específico.
        const { password, ...datosUsuario } = form;

        await actualizarUsuario(
          editingUser.id_usuario,
          datosUsuario
        );

        if (password) {
          try {
            await cambiarPassword(
              editingUser.id_usuario,
              password
            );
          } catch (errorPassword) {
            toast.error(
              "Los datos del usuario se actualizaron, pero no se pudo cambiar la contraseña."
            );

            // Refrescar la lista sin cerrar el modal para
            // permitir reintentar el cambio de contraseña.
            await cargar();
            return;
          }
        }

        toast.success("Usuario actualizado correctamente");
      } else {
        await crearUsuario(form);
        toast.success("Usuario creado correctamente");
      }

      setOpenModal(false);
      setEditingUser(null);
      await cargar();
    } catch (error) {
      console.error("Error guardando usuario:", error);
      toast.error(errorApi(error, "Error guardando usuario"));
    } finally {
      setGuardando(false);
    }
  };

  // ====================================================
  // ELIMINACIÓN
  // ====================================================

  const handleEliminar = usuario => {
    if (
      authUser?.rol !== "administrador" ||
      String(authUser?.id_usuario) === String(usuario.id_usuario)
    ) return;

    setUserToDelete(usuario);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || deleting) return;

    if (
      String(authUser?.id_usuario) ===
      String(userToDelete.id_usuario)
    ) {
      toast.error("No puedes eliminar tu propia cuenta");
      return;
    }

    setDeleting(true);

    try {
      await eliminarUsuario(userToDelete.id_usuario);

      toast.success("Usuario eliminado correctamente");

      setConfirmOpen(false);
      setUserToDelete(null);

      await cargar();
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      toast.error(errorApi(error, "Error al eliminar usuario"));
    } finally {
      setDeleting(false);
    }
  };

  // ====================================================
  // INTERFAZ
  // ====================================================

  return (
    <div className="space-y-4">

      {/* ENCABEZADO */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-6 py-5 text-white shadow-lg md:px-8">
        <Users
          size={110}
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 opacity-15 md:block"
        />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-sky-100">
              <Users size={15} />
              ADMINISTRACIÓN
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Gestión de usuarios
            </h1>

            <p className="mt-2 text-sm text-sky-50">
              Administra operarios, administradores y permisos del sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirCrear}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0095C5] shadow-sm transition-colors hover:bg-sky-50"
          >
            <UserPlus size={18} />
            Crear usuario
          </button>
        </div>
      </section>

      {/* INDICADORES */}

      <div className="grid grid-cols-3 gap-3">
        <Indicador
          titulo="Total usuarios"
          valor={estadisticas.total}
          icono={Users}
          color="blue"
        />

        <Indicador
          titulo="Activos"
          valor={estadisticas.activos}
          icono={UserCheck}
          color="green"
        />

        <Indicador
          titulo="Inactivos"
          valor={estadisticas.inactivos}
          icono={UserX}
          color="red"
        />
      </div>

      {/* FILTROS */}

      <section className={`${CARD} p-4 md:p-5`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Buscar y filtrar usuarios
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Encuentra usuarios por nombre, correo, rol o estado.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={cargar}
            className={OUTLINE}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-6">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={e =>
                cambiarFiltros(setBusqueda, e.target.value)
              }
              className={`${INPUT} pl-10`}
            />

            {busqueda && (
              <button
                type="button"
                onClick={() => cambiarFiltros(setBusqueda, "")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="relative md:col-span-3">
            <select
              value={filtroRol}
              onChange={e =>
                cambiarFiltros(setFiltroRol, e.target.value)
              }
              className={INPUT}
            >
              <option value="todos">Todos los roles</option>
              <option value="administrador">Administradores</option>
              <option value="operario">Operarios</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={filtroEstado}
              onChange={e =>
                cambiarFiltros(setFiltroEstado, e.target.value)
              }
              className={INPUT}
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>

        {(busqueda || filtroRol !== "todos" || filtroEstado !== "todos") && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0095C5] hover:underline"
            >
              <X size={14} />
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      {/* TABLA */}

      <section className={`${CARD} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 md:px-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Listado de usuarios
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filtrados.length} usuarios encontrados
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter size={14} />
            10 por página
          </div>
        </div>

        {loading ? (
          <div className="flex h-52 flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-[#00ABE4]" />
            <p className="text-sm text-slate-500">
              Cargando usuarios...
            </p>
          </div>
        ) : visibles.length === 0 ? (
          <div className="flex h-52 flex-col items-center justify-center gap-3">
            <Users size={35} className="text-slate-300" />
            <p className="text-sm text-slate-500">
              No se encontraron usuarios.
            </p>

            {(busqueda || filtroRol !== "todos" || filtroEstado !== "todos") && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className={OUTLINE}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-[#E9F1FA]">
                <tr>
                  {[
                    "Nombre", "Correo", "Rol",
                    "Módulos", "Estado", "Acciones"
                  ].map(h => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibles.map(usuario => {
                  const administrador =
                    usuario.rol === "administrador";

                  const permisos = obtenerModulos(usuario);

                  const puedeEliminar =
                    authUser?.rol === "administrador" &&
                    String(authUser?.id_usuario) !==
                    String(usuario.id_usuario);

                  return (
                    <tr
                      key={usuario.id_usuario}
                      className="border-t border-slate-100 transition-colors hover:bg-sky-50/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-[#0095C5]">
                            {String(usuario.nombre || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <span className="font-semibold text-slate-900">
                            {usuario.nombre || "Sin nombre"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        {usuario.email || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          administrador
                            ? "bg-sky-50 text-[#0095C5]"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {administrador && <ShieldCheck size={13} />}
                          {rolNombre(usuario.rol)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {administrador ? (
                          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-[#0095C5]">
                            Acceso total
                          </span>
                        ) : permisos.length ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {permisos.slice(0, 2).map((m, i) => (
                              <span
                                key={`${nombreModulo(m)}-${i}`}
                                className="max-w-[130px] truncate rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
                                title={nombreModulo(m)}
                              >
                                {nombreModulo(m)}
                              </span>
                            ))}

                            {permisos.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setUsuarioPermisos(usuario)}
                                className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-[#0095C5] hover:bg-sky-100"
                              >
                                +{permisos.length - 2} más
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sin módulos
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          usuario.activo
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            usuario.activo ? "bg-emerald-500" : "bg-red-500"
                          }`} />
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!administrador && permisos.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setUsuarioPermisos(usuario)}
                              title="Ver permisos"
                              aria-label={`Ver permisos de ${usuario.nombre}`}
                              className="rounded-lg bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
                            >
                              <Eye size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => abrirEditar(usuario)}
                            title="Editar usuario"
                            aria-label={`Editar ${usuario.nombre}`}
                            className="rounded-lg bg-sky-50 p-2 text-[#0095C5] hover:bg-sky-100"
                          >
                            <Pencil size={16} />
                          </button>

                          {puedeEliminar && (
                            <button
                              type="button"
                              onClick={() => handleEliminar(usuario)}
                              title="Eliminar usuario"
                              aria-label={`Eliminar ${usuario.nombre}`}
                              className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINACIÓN */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
          <p className="text-xs text-slate-500">
            Mostrando {inicio} a {fin} de {filtrados.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paginaActual <= 1 || loading}
              onClick={() =>
                setPagina(p => Math.max(1, p - 1))
              }
              className={`${OUTLINE} !px-3`}
              aria-label="Página anterior"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="text-xs font-semibold text-slate-600">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              type="button"
              disabled={paginaActual >= totalPaginas || loading}
              onClick={() =>
                setPagina(p => Math.min(totalPaginas, p + 1))
              }
              className={`${OUTLINE} !px-3`}
              aria-label="Página siguiente"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* MODALES EXISTENTES */}

      <UserModal
        open={openModal}
        onClose={cerrarModal}
        onSave={handleSave}
        modulosDisponibles={modulos}
        initialData={editingUser}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar usuario"
        message={
          `¿Estás seguro de eliminar al usuario "${userToDelete?.nombre || userToDelete?.email}"? ` +
          `Esta acción no se puede deshacer.`
        }
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setUserToDelete(null);
        }}
        loading={deleting}
      />

      <ModalPermisos
        usuario={usuarioPermisos}
        cerrar={() => setUsuarioPermisos(null)}
      />
    </div>
  );
}
