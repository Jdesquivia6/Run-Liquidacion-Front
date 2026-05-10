const styles = {
  success: "bg-[#059669] text-white border-[#059669]",
  error: "bg-[#dc2626] text-white border-[#dc2626]",
  warning: "bg-[#d97706] text-white border-[#d97706]",
  info: "bg-[#00ABE4] text-white border-[#00ABE4]",
  pending: "bg-[#64748b] text-white border-[#64748b]"
};

export default function StatusBadge({ status = "pending", children }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold border shadow-sm ${styles[status]}`}>
      {children}
    </span>
  );
}