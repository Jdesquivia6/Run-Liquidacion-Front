import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  listarUsuarios,
  listarModulos,
  crearUsuario,
  actualizarUsuario,
  cambiarPassword
} from "../services/usersApi";

import UserModal from "../components/UserModal";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modulos, setModulos] = useState([]);

  const [openModal, setOpenModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

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

  return (
    <div className="space-y-6">
      {/* Header de sección */}
      <section className="bg-white rounded-3xl shadow-sm p-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
              Gestión de usuarios
            </h2>

            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Administra operarios, administradores y permisos.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingUser(null);
              setOpenModal(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-medium transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: "#00ABE4" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Crear usuario
          </button>
        </div>
      </section>

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
    </div>
  );
}