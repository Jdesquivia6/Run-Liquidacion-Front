export default function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  className = "",
  readOnly = false,
  disabled = false,
  placeholder = ""
}) {
  return (
    <div className={className}>
      <label className="text-sm text-gray-600 font-medium block">
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
        className="
          w-full mt-1
          border border-gray-300
          rounded-xl
          px-4 py-2
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          transition
          disabled:bg-gray-100
          read-only:bg-gray-50
        "
      />
    </div>
  );
}
