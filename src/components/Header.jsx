import logoRunt from "../assets/liquidacion.jpg";

export default function Header() {
  
  return (
    <header className="bg-white shadow-card">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <img
            src={logoRunt}
            alt="Logo RUNT"
            className="w-15 h-15"
          />

          <h1 className="text-lg font-semibold text-[#1e293b]">
            Liquidar valores RUNT
          </h1>
        </div>

      </div>
    </header>
  );
}