import StatusBadge from "./StatusBadge";

export default function QueryHistoryTable({ data = [], onViewDetail }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-bold text-[#1e293b] mb-4">
        Historial de consultas
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b text-[#64748b]">
              <th className="py-3">Placa</th>
              <th>Estado</th>
              <th>Resultado</th>
              <th>Fecha</th>
              <th>Detalle</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[#64748b]">
                  No hay consultas registradas
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index} className="border-b hover:bg-[#F8FAFC]">
                  <td className="py-3 font-bold text-[#1e293b]">{item.placa}</td>
                  <td>
                    <StatusBadge status={item.ok ? "success" : "error"}>
                      {item.ok ? "Exitosa" : "Fallida"}
                    </StatusBadge>
                  </td>
                  <td className="text-[#64748b]">{item.message || item.error || "Sin detalle"}</td>
                  <td className="text-[#64748b]">{item.fecha || new Date().toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => onViewDetail(item)}
                      className="text-[#00ABE4] hover:text-[#0095C5] font-medium"
                    >
                      Ver detalle
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