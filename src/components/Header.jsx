export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="logo"
            className="w-10"
          />

          <h1 className="text-lg font-semibold text-gray-700">
            Liquidar valores RUNT
          </h1>
        </div>

        <button className="text-red-500 hover:text-red-600">
          Cerrar sesión
        </button>

      </div>
    </header>
  );
}