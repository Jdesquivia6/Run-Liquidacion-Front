const styles = {
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  error: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  pending: "bg-slate-100 text-slate-600 border-slate-200"
};

export default function StatusBadge({ status = "pending", children }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {children}
    </span>
  );
}