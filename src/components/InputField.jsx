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
    <div className={className}>
      <label className="text-sm text-[#1e293b] font-medium block mb-1">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full
          border border-[#cbd5e1]
          rounded-xl
          px-4 py-2.5
          text-[#1e293b]
          placeholder:text-[#64748b]
          focus:outline-none
          focus:border-[#00ABE4]
          focus:ring-2
          focus:ring-[#00ABE4]/30
          transition-all
          duration-200
          disabled:bg-[#E9F1FA]
          disabled:cursor-not-allowed
          read-only:bg-[#E9F1FA]
          ${error ? "border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/30" : ""}
        `}
      />
    </div>
  );
}
