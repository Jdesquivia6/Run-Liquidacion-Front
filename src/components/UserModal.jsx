import { useEffect, useState } from "react";

export default function UserModal({
  open,
  onClose,
  onSave,
  modulosDisponibles,
  initialData
}) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "operario",
    modulos: []
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        nombre: initialData.nombre || "",
        email: initialData.email || "",
        password: "",
        rol: initialData.rol || "operario",
        modulos: initialData.modulos || []
      });
    }
  }, [initialData]);

  if (!open) return null;

  const toggleModulo = (codigo) => {
    setForm((prev) => ({
      ...prev,
      modulos: prev.modulos.includes(codigo)
        ? prev.modulos.filter((m) => m !== codigo)
        : [...prev.modulos, codigo]
    }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {initialData ? "Editar usuario" : "Nuevo usuario"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold">
              Nombre
            </label>

            <input
              value={form.nombre}
              onChange={(e) =>
                setForm({
                  ...form,
                  nombre: e.target.value
                })
              }
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">
              Correo
            </label>

            <input
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value
                })
              }
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            />
          </div>

          {!initialData && (
            <div>
              <label className="text-sm font-semibold">
                Contraseña
              </label>

              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value
                  })
                }
                className="mt-2 w-full border rounded-2xl px-4 py-3"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold">
              Rol
            </label>

            <select
              value={form.rol}
              onChange={(e) =>
                setForm({
                  ...form,
                  rol: e.target.value
                })
              }
              className="mt-2 w-full border rounded-2xl px-4 py-3"
            >
              <option value="operario">
                Operario
              </option>

              <option value="administrador">
                Administrador
              </option>
            </select>
          </div>
        </div>

        {form.rol === "operario" && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Módulos permitidos
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {modulosDisponibles.map((modulo) => (
                <label
                  key={modulo.codigo}
                  className="flex items-center gap-2 border rounded-2xl px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={form.modulos.includes(modulo.codigo)}
                    onChange={() => toggleModulo(modulo.codigo)}
                  />

                  <span className="text-sm">
                    {modulo.nombre}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-3 rounded-2xl bg-blue-600 text-white"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}