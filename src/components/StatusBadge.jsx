
const styles = {
  success: {
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
    label: "Correcto"
  },
  error: {
    classes: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    dot: "bg-red-500",
    label: "Error"
  },
  warning: {
    classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    dot: "bg-amber-500",
    label: "Advertencia"
  },
  info: {
    classes: "bg-sky-50 text-[#007EA9] border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    dot: "bg-[#00ABE4]",
    label: "Información"
  },
  pending: {
    classes: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-600",
    dot: "bg-slate-400",
    label: "Pendiente"
  }
};

export default function StatusBadge({
  status = "pending",
  children
}) {
  const config = styles[status] || styles.pending;

  return (
    <span
      className={`
        inline-flex max-w-full items-center gap-1.5
        rounded-lg border px-2.5 py-1
        text-[11px] font-bold leading-4
        shadow-sm transition-colors duration-200
        ${config.classes}
      `}
      title={config.label}
    >
      <span
        aria-hidden="true"
        className={`
          h-1.5 w-1.5 shrink-0 rounded-full
          ${config.dot}
        `}
      />

      <span className="min-w-0 truncate">
        {children}
      </span>
    </span>
  );
}
