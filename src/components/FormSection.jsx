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
    <div className={className}>
      <label className="text-sm text-[#1e293b] font-medium block mb-1">
        {label}
      </label>

      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="
          w-full
          border border-[#cbd5e1]
          rounded-xl
          px-4 py-3
          text-[#1e293b]
          bg-white
          focus:outline-none
          focus:border-[#00ABE4]
          focus:ring-2
          focus:ring-[#00ABE4]/30
          transition-all
          duration-200
          disabled:bg-[#E9F1FA]
          disabled:cursor-not-allowed
          cursor-pointer
        "
      >
        <option value="">Seleccione...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
