import QueryHistoryTable from "../components/QueryHistoryTable";

export default function Historial() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800">
          Historial general
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          
        </p>
      </div>

      <QueryHistoryTable data={[]} />
    </div>
  );
}