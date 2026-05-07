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
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Gestión de usuarios
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Administra operarios, administradores y permisos.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingUser(null);
              setOpenModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl"
          >
            Crear usuario
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">Nombre</th>
              <th className="p-4 text-left">Correo</th>
              <th className="p-4 text-left">Rol</th>
              <th className="p-4 text-left">Módulos</th>
              <th className="p-4 text-left">Estado</th>
              <th className="p-4 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((user) => (
              <tr
                key={user.id_usuario}
                className="border-t hover:bg-slate-50"
              >
                <td className="p-4 font-semibold">
                  {user.nombre}
                </td>

                <td className="p-4">
                  {user.email}
                </td>

                <td className="p-4">
                  {user.rol}
                </td>

                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {user.rol === "administrador"
                      ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-xl text-xs">
                          Acceso total
                        </span>
                      )
                      : user.modulos.map((m) => (
                        <span
                          key={m}
                          className="bg-slate-100 px-2 py-1 rounded-xl text-xs"
                        >
                          {m}
                        </span>
                      ))}
                  </div>
                </td>

                <td className="p-4">
                  <span
                    className={`
                      px-3 py-1 rounded-xl text-xs font-semibold
                      ${user.activo
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"}
                    `}
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
                    className="text-blue-600 hover:underline"
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