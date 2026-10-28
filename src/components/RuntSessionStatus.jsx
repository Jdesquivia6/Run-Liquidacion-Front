
import { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Clock3, ShieldCheck, AlertTriangle, RefreshCcw
} from "lucide-react";
import {
  getLocalSession,
  saveLocalSession,
  obtenerEstadoSesionRunt
} from "../services/sessionRunt";

const LOCAL_API_BASE = "http://localhost:3000";

const ESTADOS = {
  vencida: {
    texto: "Sesión vencida",
    icono: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    fondo: "bg-red-50 dark:bg-red-500/10",
    borde: "border-red-200 dark:border-red-500/20",
    barra: "bg-red-500"
  },
  alerta: {
    texto: "Tiempo bajo",
    icono: Clock3,
    color: "text-amber-600 dark:text-amber-400",
    fondo: "bg-amber-50 dark:bg-amber-500/10",
    borde: "border-amber-200 dark:border-amber-500/20",
    barra: "bg-amber-500"
  },
  activa: {
    texto: "Sesión activa",
    icono: ShieldCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    fondo: "bg-emerald-50 dark:bg-emerald-500/10",
    borde: "border-emerald-200 dark:border-emerald-500/20",
    barra: "bg-emerald-500"
  }
};

// El modo predeterminado ya no dibuja una tarjeta grande.
export default function RuntSessionStatus({
  compact = false,
  iconOnly = false
}) {
  if (!compact && !iconOnly) return null;

  return (
    <SessionIndicator
      compact={compact}
      iconOnly={iconOnly}
    />
  );
}

function SessionIndicator({ compact, iconOnly }) {
  const [session, setSession] = useState(
    () => getLocalSession() || null
  );
  const [loading, setLoading] = useState(false);
  const alertaMostrada = useRef(false);

  // CONSULTA AL BACKEND CADA 15 SEGUNDOS
  const actualizarEstado = useCallback(async () => {
    try {
      const data = await obtenerEstadoSesionRunt();

      if (data?.ok && data?.session) {
        setSession(data.session);

        if (data.session.sessionStartedAt) {
          saveLocalSession(data.session);
        }
      }
    } catch (err) {
      console.warn(
        "No se pudo obtener estado de sesión RUNT:",
        err?.message
      );
    }
  }, []);

  // RECÁLCULO LOCAL CADA 30 SEGUNDOS
  const recalcularLocal = useCallback(() => {
    const local = getLocalSession();

    setSession(prev => {
      if (local) return { ...(prev || {}), ...local };
      if (!prev) return prev;

      return {
        ...prev,
        activa: false,
        puedeConsultar: false,
        minutosRestantes: 0,
        capacidadSegura: 0,
        mensaje: "La sesión RUNT ya venció"
      };
    });
  }, []);

  // ABRIR EL REGISTRO DE SESIÓN
  const registrarSesion = () => {
    if (loading) return;

    const ventana = window.open(
      `${LOCAL_API_BASE}/api/runt-session/iniciar`,
      "runtSession",
      "width=420,height=200"
    );

    if (!ventana) {
      toast.error(
        "Permite las ventanas emergentes para registrar la sesión RUNT."
      );
      return;
    }

    setLoading(true);
  };

  // RECIBIR RESPUESTA DEL REGISTRO
  useEffect(() => {
    const handler = event => {
      if (event.origin !== LOCAL_API_BASE) return;

      if (
        event.data?.type === "runt-session-iniciada" &&
        event.data?.payload?.session
      ) {
        saveLocalSession(event.data.payload.session);
        setSession(getLocalSession());
        setLoading(false);
        toast.success("Sesión RUNT registrada");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    actualizarEstado();

    const intervalo = setInterval(actualizarEstado, 15000);
    return () => clearInterval(intervalo);
  }, [actualizarEstado]);

  useEffect(() => {
    const intervalo = setInterval(recalcularLocal, 30000);
    return () => clearInterval(intervalo);
  }, [recalcularLocal]);

  // ESTADO VISUAL
  const activa = Boolean(session?.activa);
  const minutos = Number(session?.minutosRestantes) || 0;
  const capacidad = Number(session?.capacidadSegura) || 0;

  const estado = ESTADOS[
    !activa ? "vencida" : minutos <= 15 ? "alerta" : "activa"
  ];

  const Icono = estado.icono;
  const porcentaje = activa
    ? Math.max(0, Math.min(100, (minutos / 60) * 100))
    : 0;

  // ALERTAR CUANDO RESTEN 5 MINUTOS
  useEffect(() => {
    if (
      activa &&
      minutos > 0 &&
      minutos <= 5 &&
      !alertaMostrada.current
    ) {
      alertaMostrada.current = true;

      toast.error(
        `La sesión RUNT expira en ${minutos} minuto${minutos !== 1 ? "s" : ""}. Renueva ahora.`,
        {
          duration: 8000,
          icon: <AlertTriangle size={20} className="text-amber-500" />
        }
      );
    }

    if (minutos > 5) alertaMostrada.current = false;
  }, [activa, minutos]);

  // ==========================================
  // ICONO PEQUEÑO - HEADER
  // ==========================================
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={registrarSesion}
        disabled={loading}
        title={`${estado.texto} · ${minutos} min · Renovar sesión RUNT`}
        aria-label={`${estado.texto}. ${minutos} minutos restantes. Renovar sesión RUNT`}
        className={`
          relative flex h-10 w-10 shrink-0 items-center
          justify-center rounded-xl border transition-colors
          disabled:cursor-not-allowed disabled:opacity-60
          ${estado.fondo} ${estado.borde} ${estado.color}
        `}
      >
        {loading
          ? <RefreshCcw size={19} className="animate-spin" />
          : <Icono size={19} />
        }

        <span
          aria-hidden="true"
          className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#172539] ${estado.barra}`}
        />
      </button>
    );
  }

  // ==========================================
  // TARJETA COMPACTA - SIDEBAR
  // ==========================================
  if (compact) {
    return (
      <div
        className={`
          w-full min-w-0 rounded-2xl border p-3
          ${estado.fondo} ${estado.borde}
        `}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={`
                flex h-10 w-10 shrink-0 items-center
                justify-center rounded-xl
                bg-white/80 dark:bg-[#172539]
                ${estado.color}
              `}
            >
              <Icono size={20} />
            </div>

            <div className="min-w-0">
              <p className={`truncate text-xs font-bold ${estado.color}`}>
                {estado.texto}
              </p>

              <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400">
                {minutos} min · {capacidad} consultas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={registrarSesion}
            disabled={loading}
            title="Renovar sesión RUNT"
            aria-label="Renovar sesión RUNT"
            className="
              flex h-11 w-11 shrink-0 touch-manipulation
              items-center justify-center rounded-xl border
              border-slate-200 bg-white text-slate-700
              hover:border-sky-300 hover:text-[#0095C5]
              disabled:cursor-not-allowed disabled:opacity-60
              dark:border-slate-700 dark:bg-[#111F32]
              dark:text-slate-200
            "
          >
            <RefreshCcw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Tiempo disponible
          </span>
          <span className={`font-bold ${estado.color}`}>
            {minutos} min
          </span>
        </div>

        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${estado.barra}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    );
  }

  return null;
}
