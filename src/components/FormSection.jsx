
import { ChevronDown } from "lucide-react";

export default function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  className = "",
  disabled = false
}) {
  return (
    <div className={`min-w-0 ${className}`}>

      {/* ETIQUETA */}

      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>

      {/* SELECT */}

      <div className="relative min-w-0">
        <select
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className="
            h-12 w-full min-w-0 appearance-none
            rounded-xl border border-slate-200
            bg-white pl-3.5 pr-10
            text-[14px] text-slate-800
            outline-none cursor-pointer
            transition-[border-color,box-shadow,background-color]
            duration-200

            hover:border-slate-300
            focus:border-[#00ABE4]
            focus:ring-2 focus:ring-[#00ABE4]/15

            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:text-slate-500

            dark:border-slate-700
            dark:bg-[#111F32]
            dark:text-slate-100
            dark:hover:border-slate-600
            dark:focus:border-[#00ABE4]

            dark:disabled:bg-[#1B2B40]
            dark:disabled:text-slate-500
          "
        >
          <option value="">Seleccione...</option>

          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* ÍCONO DECORATIVO */}

        <ChevronDown
          size={17}
          aria-hidden="true"
          className="
            pointer-events-none absolute
            right-3.5 top-1/2
            -translate-y-1/2
            text-slate-400
            dark:text-slate-500
          "
        />
      </div>
    </div>
  );
}
