
export default function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  className = "",
  readOnly = false,
  disabled = false,
  placeholder = "",
  error = false
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      {/* ETIQUETA */}

      <label
        htmlFor={name}
        className="
          mb-1.5 block text-xs font-semibold
          text-slate-700 dark:text-slate-300
        "
      >
        {label}
      </label>

      {/* CAMPO */}

      <input
        id={name}
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`
          h-12 w-full min-w-0 rounded-xl border
          bg-white px-3.5 text-[14px]
          text-slate-800 placeholder:text-slate-400
          outline-none transition-[border-color,box-shadow,background-color]
          duration-200

          focus:border-[#00ABE4]
          focus:ring-2 focus:ring-[#00ABE4]/15

          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:text-slate-500

          read-only:bg-slate-50
          read-only:text-slate-600

          dark:bg-[#111F32]
          dark:text-slate-100
          dark:placeholder:text-slate-500

          dark:disabled:bg-[#1B2B40]
          dark:disabled:text-slate-500

          dark:read-only:bg-[#1B2B40]
          dark:read-only:text-slate-300

          ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500"
              : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
          }
        `}
      />
    </div>
  );
}
