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
      <label className="text-sm text-gray-600 font-medium block">
        {label}
      </label>

      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="
          w-full mt-1
          border border-gray-300
          rounded-xl
          px-4 py-2
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          transition
          bg-white
          disabled:bg-gray-100
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