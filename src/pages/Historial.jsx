import QueryHistoryTable from "../components/QueryHistoryTable";

export default function Historial() {
  return (
    <div className="min-h-screen bg-[#E9F1FA] p-6 space-y-6 animate-fade-in">
      {/* Título de sección */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-slide-up">
        <h2 className="text-xl font-bold text-[#1e293b]">
          Historial general
        </h2>
        <p className="text-sm text-[#64748b] mt-1">
          Consulta el historial de tus liquidaciones y trámites realizados
        </p>
      </div>

      {/* Tabla de historial */}
      <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <QueryHistoryTable data={[]} />
      </div>
    </div>
  );
}
