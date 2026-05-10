import { Trash2 } from "lucide-react";

export default function TramitesTable({ tramites = [], onRemove }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-4 text-[#1e293b]">
        Trámites agregados
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-[#64748b]">
              <th className="py-3">Id</th>
              <th>Nombre</th>
              <th>Tarifa</th>
              <th>Eliminar</th>
            </tr>
          </thead>

          <tbody>
            {tramites.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-4 text-[#64748b] text-center">
                  No hay trámites agregados
                </td>
              </tr>
            ) : (
              tramites.map((item, index) => (
                <tr key={index} className="border-b hover:bg-[#F8FAFC]">
                  <td className="py-3 text-[#1e293b]">{item.id || index + 1}</td>
                  <td className="text-[#1e293b]">{item.nombre}</td>
                  <td className="text-[#64748b]">{item.tarifa}</td>
                  <td>
                    <button
                      onClick={() => onRemove(index)}
                      className="text-[#dc2626] hover:text-white hover:bg-[#dc2626] px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}