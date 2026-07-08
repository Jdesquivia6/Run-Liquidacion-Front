import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  listarUsuarios,
  listarModulos,
  crearUsuario,
  actualizarUsuario,
  cambiarPassword,
  eliminarUsuario
} from "../services/usersApi";
import UserModal from "../components/UserModal";
import ConfirmModal from "../components/ConfirmModal";
import PageHeroHeader from "../components/PageHeroHeader";
import { Users, UserPlus, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Usuarios() {
  const { user: authUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [modulos, setModulos] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const cargar = async () => {
    try {
      const [usersResp, modulosResp] = await Promise.all([
        listarUsuarios(),
        listarModulos()
      ]);

      setUsuarios(usersResp.results || []);
      setModulos(modulosResp.results || []);

    } catch (error) {
      toast.error("Error cargando usuarios");
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleSave = async (form) => {
    try {
      if (editingUser) {
        await actualizarUsuario(editingUser.id_usuario, form);

        if (form.password) {
          await cambiarPassword(
            editingUser.id_usuario,
            form.password
          );
        }

        toast.success("Usuario actualizado");

      } else {
        await crearUsuario(form);

        toast.success("Usuario creado");
      }

      setOpenModal(false);
      setEditingUser(null);

      await cargar();

    } catch (error) {
      toast.error(
        error.response?.data?.error ||
        "Error guardando usuario"
      );
    }
  };

  const handleEliminar = (user) => {
    setUserToDelete(user);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await eliminarUsuario(userToDelete.id_usuario);
      toast.success("Usuario eliminado");
      setConfirmOpen(false);
      setUserToDelete(null);
      await cargar();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al eliminar usuario");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header hero */}
      <PageHeroHeader
        label="Administración"
        labelIcon={Users}
        title="Gestión de usuarios"
        description="Administra operarios, administradores y permisos."
        icon={Users}
        actionButton={
          <button
            onClick={() => {
              setEditingUser(null);
              setOpenModal(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#00ABE4] font-semibold shadow-md transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Crear usuario
          </button>
        }
      />

      {/* Tabla de usuarios */}
      <section
        className="bg-white rounded-3xl overflow-hidden shadow-sm animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: "#F8FAFC" }}>
            <tr>
              <th className="p-4 text-left font-semibold" style={{ color: "#1e293b" }}>
                Nombre
              </th>
              <th className="p-4 text-left font-semibold" style={{ color: "#1e293b" }}>
                Correo
              </th>
              <th className="p-4 text-left font-semibold" style={{ color: "#1e293b" }}>
                Rol
              </th>
              <th className="p-4 text-left font-semibold" style={{ color: "#1e293b" }}>
                Módulos
              </th>
              <th className="p-4 text-left font-semibold" style={{ color: "#1e293b" }}>
                Estado
              </th>
              <th className="p-4 text-left font-semibold" style={{ color: "#1e293b" }}>
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((user, index) => (
              <tr
                key={user.id_usuario}
                className="border-t transition-colors duration-150 hover:bg-slate-50"
                style={{
                  animation: `fade-in 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                <td className="p-4 font-semibold" style={{ color: "#1e293b" }}>
                  {user.nombre}
                </td>

                <td className="p-4" style={{ color: "#64748b" }}>
                  {user.email}
                </td>

                <td className="p-4">
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style={{
                      backgroundColor: "#E9F1FA",
                      color: "#00ABE4"
                    }}
                  >
                    {user.rol === "administrador" ? "Administrador" : "Operario"}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {user.rol === "administrador"
                      ? (
                        <span
                          className="px-2 py-1 rounded-xl text-xs font-medium"
                          style={{
                            backgroundColor: "#E9F1FA",
                            color: "#00ABE4"
                          }}
                        >
                          Acceso total
                        </span>
                      )
                      : user.modulos.map((m) => (
                        <span
                          key={m}
                          className="px-2 py-1 rounded-xl text-xs"
                          style={{
                            backgroundColor: "#F8FAFC",
                            color: "#64748b"
                          }}
                        >
                          {m}
                        </span>
                      ))}
                  </div>
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                      user.activo
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>

                <td className="p-4">
                  <button
                    onClick={() => {
                      setEditingUser(user);
                      setOpenModal(true);
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: "#E9F1FA",
                      color: "#00ABE4"
                    }}
                  >
                    Editar
                  </button>

                  {authUser?.rol === "administrador" && (
                    <button
                      onClick={() => handleEliminar(user)}
                      className="ml-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <UserModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
        modulosDisponibles={modulos}
        initialData={editingUser}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar usuario"
        message={`¿Estás seguro de eliminar al usuario "${userToDelete?.nombre || userToDelete?.email}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setUserToDelete(null);
        }}
        loading={deleting}
      />
    </div>
  );
}