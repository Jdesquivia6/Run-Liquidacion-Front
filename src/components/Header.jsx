import { useAuth } from "../auth/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  const usuarioActual = user?.nombre || user?.usuario || "Invitado";

  return (
    <header className="bg-white shadow-card">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo RUNT"
            className="w-10 h-10"
          />

          <h1 className="text-lg font-semibold text-[#1e293b]">
            Liquidar valores RUNT
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 hidden sm:block">
            {usuarioActual}
          </span>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#00ABE4] 
                     rounded-lg transition-all duration-200 ease-in-out
                     hover:bg-[#00ABE4]/10 hover:text-[#0095C5]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}