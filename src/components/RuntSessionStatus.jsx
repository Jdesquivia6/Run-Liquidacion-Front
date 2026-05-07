import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Clock3, ShieldCheck, AlertTriangle, RefreshCcw } from "lucide-react";
import {
  obtenerEstadoSesionRunt,
  iniciarSesionRunt
} from "../services/sessionRunt";

export default function RuntSessionStatus({ compact = false }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const cargarEstado = async () => {
    try {
      const resp = await obtenerEstadoSesionRunt();
      setSession(resp.session);
    } catch {
      setSession(null);
    }
  };

  const registrarSesion = async () => {
    try {
      setLoading(true);
      const resp = await iniciarSesionRunt();
      setSession(resp.session);
      toast.success("Sesión RUNT registrada");
    } catch {
      toast.error("No se pudo registrar la sesión RUNT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstado();
    const interval = setInterval(cargarEstado, 30000);
    return () => clearInterval(interval);
  }, []);

  const activa = session?.activa;
  const minutos = session?.minutosRestantes || 0;
  const capacidad = session?.capacidadSegura || 0;

  const statusStyle = !activa
    ? {
        wrapper: "bg-red-50 text-red-700 border-red-200",
        icon: AlertTriangle,
        label: "Sesión vencida"
      }
    : minutos <= 15
      ? {
          wrapper: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock3,
          label: "Tiempo bajo"
        }
      : {
          wrapper: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: ShieldCheck,
          label: "Sesión activa"
        };

  const Icon = statusStyle.icon;

  const porcentaje = activa
    ? Math.max(Math.min((minutos / 60) * 100, 100), 0)
    : 0;

  if (compact) {
    return (
      <div
        className={`
          border rounded-2xl px-3 py-2 min-w-[260px]
          ${statusStyle.wrapper}
        `}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Icon size={18} />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {statusStyle.label}
              </p>
              <p className="text-xs truncate">
                {minutos} min · {capacidad} consultas seguras
              </p>
            </div>
          </div>

          <button
            onClick={registrarSesion}
            disabled={loading}
            title="Registrar nuevo inicio de sesión RUNT"
            className="shrink-0 bg-white/80 hover:bg-white rounded-xl p-2 text-slate-800 disabled:opacity-60"
          >
            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="mt-2 h-1.5 rounded-full bg-white/70 overflow-hidden">
          <div
            className="h-full rounded-full bg-current transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl px-4 py-4 border ${statusStyle.wrapper}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon size={22} />

          <div>
            <p className="font-bold text-sm">Estado sesión RUNT</p>
            <p className="text-sm mt-1">
              {session?.mensaje || "Sesión no registrada"}
            </p>
            <p className="text-xs mt-1">
              Capacidad segura: {capacidad} consultas
            </p>
          </div>
        </div>

        <div className="w-full lg:w-80">
          <div className="flex justify-between text-xs mb-1">
            <span>Tiempo disponible</span>
            <span>{minutos} min</span>
          </div>

          <div className="w-full h-2 bg-white/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-current rounded-full transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <button
          onClick={registrarSesion}
          disabled={loading}
          className="bg-white/80 text-slate-800 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Registrando..." : "Registrar sesión"}
        </button>
      </div>
    </div>
  );
}