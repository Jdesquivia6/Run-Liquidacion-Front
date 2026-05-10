import { Car, User, AlertTriangle, Eye } from "lucide-react";
import { motion as Motion } from "framer-motion";
import StatusBadge from "./StatusBadge";

export default function QueryCard({ item, onViewDetail }) {
  const status = item.ok ? "success" : "error";
  const label = item.ok ? "Consultada exitosamente" : "Sin información encontrada";

  return (
    <Motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E9F1FA] flex items-center justify-center text-[#00ABE4]">
            <Car size={22} />
          </div>

          <div>
            <p className="text-xs text-[#64748b]">Placa</p>
            <h3 className="text-2xl font-bold text-[#1e293b]">{item.placa}</h3>
          </div>
        </div>

        <StatusBadge status={status}>{label}</StatusBadge>
      </div>

      {item.error && (
        <div className="mt-4 flex gap-2 text-sm text-white bg-[#dc2626] rounded-2xl p-3">
          <AlertTriangle size={18} />
          <span>{item.error}</span>
        </div>
      )}

      {item.propietario && (
        <div className="mt-4 bg-[#E9F1FA] rounded-2xl p-4 text-sm text-[#64748b]">
          <div className="flex items-center gap-2 font-semibold text-[#1e293b] mb-2">
            <User size={17} />
            Propietario
          </div>
          <p>{item.propietario.nombre_completo || "No disponible"}</p>
          <p className="text-[#64748b]">
            {item.propietario.tipo_documento} {item.propietario.numero_documento}
          </p>
        </div>
      )}

      {item.datos_vehiculo && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {[
            ["Marca", item.datos_vehiculo.marca],
            ["Línea", item.datos_vehiculo.linea],
            ["Modelo", item.datos_vehiculo.modelo],
            ["Servicio", item.datos_vehiculo.servicio]
          ].map(([label, value]) => (
            <div key={label} className="bg-[#E9F1FA] rounded-2xl p-3">
              <p className="text-xs text-[#64748b]">{label}</p>
              <p className="font-semibold text-[#1e293b]">{value || "N/D"}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => onViewDetail(item)}
        className="mt-5 w-full bg-[#00ABE4] hover:bg-[#0095C5] text-white rounded-2xl py-3 text-sm transition flex items-center justify-center gap-2"
      >
        <Eye size={17} />
        Ver detalle
      </button>
    </Motion.div>
  );
}