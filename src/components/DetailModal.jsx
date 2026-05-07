export default function DetailModal({ open, item, onClose }) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Detalle de consulta
            </h2>
            <p className="text-sm text-slate-500">
              Placa: {item.placa}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <pre className="bg-slate-950 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}