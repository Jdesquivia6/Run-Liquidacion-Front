import StatusBadge from "./StatusBadge";

export default function QueryHistoryTable({ data = [], onViewDetail }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        Historial de consultas
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b text-slate-500">
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
                <td colSpan="5" className="py-8 text-center text-slate-400">
                  No hay consultas registradas
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-bold">{item.placa}</td>
                  <td>
                    <StatusBadge status={item.ok ? "success" : "error"}>
                      {item.ok ? "Exitosa" : "Fallida"}
                    </StatusBadge>
                  </td>
                  <td>{item.message || item.error || "Sin detalle"}</td>
                  <td>{item.fecha || new Date().toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => onViewDetail(item)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver
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