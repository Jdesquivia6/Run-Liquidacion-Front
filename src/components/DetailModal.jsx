export default function DetailModal({ open, item, onClose }) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto animate-modal-in">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">
              Detalle de consulta
            </h2>
            <p className="text-sm text-[#64748b]">
              Placa: {item.placa}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#00ABE4] text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#E9F1FA] transition"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <pre className="bg-[#1e293b] text-[#E9F1FA] rounded-xl p-4 text-xs overflow-x-auto">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}