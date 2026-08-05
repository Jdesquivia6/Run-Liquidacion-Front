import { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Clock3, ShieldCheck, AlertTriangle, RefreshCcw } from "lucide-react";
import { getLocalSession, saveLocalSession, obtenerEstadoSesionRunt } from "../services/sessionRunt";

const LOCAL_API_BASE = "http://localhost:3000";

export default function RuntSessionStatus({ compact = false, iconOnly = false }) {
  const [session, setSession] = useState(() => getLocalSession() || null);
  const [loading, setLoading] = useState(false);
  const alertShownRef = useRef(false);

  const actualizarEstado = useCallback(async () => {
    try {
      const data = await obtenerEstadoSesionRunt();
      if (data?.ok && data?.session) {
        setSession(data.session);
        if (data.session?.sessionStartedAt) {
          saveLocalSession(data.session);
        }
      }
    } catch (err) {
      console.warn("No se pudo obtener estado de sesión RUNT:", err.message);
    }
  }, []);

  const registrarSesion = () => {
    const ventana = window.open(
      `${LOCAL_API_BASE}/api/runt-session/iniciar`,
      "runtSession",
      "width=420,height=200"
    );
    if (!ventana) {
      toast.error("Bloqueador de popups detectado. Permite popups para esta página.");
      return;
    }
    setLoading(true);
  };

  useEffect(() => {
    const handler = (event) => {
      if (event.origin !== LOCAL_API_BASE) return;
      if (event.data?.type === "runt-session-iniciada" && event.data?.payload?.session) {
        saveLocalSession(event.data.payload.session);
        setSession(getLocalSession());
        toast.success("Sesión RUNT registrada");
        setLoading(false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    actualizarEstado();
    const interval = setInterval(actualizarEstado, 15000);
    return () => clearInterval(interval);
  }, [actualizarEstado]);

  const activa = session?.activa;
  const minutos = session?.minutosRestantes || 0;
  const capacidad = session?.capacidadSegura || 0;

  useEffect(() => {
    if (activa && minutos <= 5 && minutos > 0 && !alertShownRef.current) {
      alertShownRef.current = true;
      toast.error(
        `La sesión RUNT expira en ${minutos} minuto${minutos !== 1 ? "s" : ""}. Renueva ahora.`,
        { duration: 8000, icon: <AlertTriangle size={20} className="text-amber-500" /> }
      );
    }
    if (minutos > 5) {
      alertShownRef.current = false;
    }
  }, [activa, minutos]);

  const statusStyle = !activa
    ? {
        wrapper: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20",
        icon: AlertTriangle,
        label: "Sesión vencida"
      }
    : minutos <= 15
      ? {
          wrapper: "bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20",
          icon: Clock3,
          label: "Tiempo bajo"
        }
      : {
          wrapper: "bg-[#059669]/10 text-[#059669] border-[#059669]/20",
          icon: ShieldCheck,
          label: "Sesión activa"
        };

  const Icon = statusStyle.icon;

  const porcentaje = activa
    ? Math.max(Math.min((minutos / 60) * 100, 100), 0)
    : 0;

  if (iconOnly) {
    const LoadingIcon = loading ? RefreshCcw : Icon;

    return (
      <button
        onClick={registrarSesion}
        disabled={loading}
        title={`${statusStyle.label} · ${minutos} min restantes · Clic para renovar sesión`}
        className={`
          w-10 h-10 rounded-xl border flex items-center justify-center shrink-0
          transition-colors disabled:opacity-60
          ${statusStyle.wrapper}
        `}
      >
        <LoadingIcon size={20} className={loading ? "animate-spin" : ""} />
      </button>
    );
  }

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
            className="shrink-0 bg-white/80 hover:bg-[#E9F1FA] rounded-xl p-2 text-[#1e293b] disabled:opacity-60"
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
            <span className="text-[#00ABE4] font-semibold">{minutos} min</span>
          </div>

          <div className="w-full h-2 bg-white/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00ABE4] rounded-full transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <button
          onClick={registrarSesion}
          disabled={loading}
          className="bg-[#00ABE4] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0095C5] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Registrando..." : "Registrar sesión"}
        </button>
      </div>
    </div>
  );
}
