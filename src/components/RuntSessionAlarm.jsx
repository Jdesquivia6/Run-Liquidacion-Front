import { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Volume2, VolumeX, AlertTriangle, ExternalLink, CircleDot } from "lucide-react";
import sonidoLiquidacion from "../assets/sonidoLiquidacion.mp3";
import { obtenerEstadoSesionRunt } from "../services/sessionRunt";

const LOCAL_API_BASE = "http://localhost:3000";
const UMBRAL_ALARMA_MINUTOS = 5;
const POLLING_MS = 10000;

export default function RuntSessionAlarm() {
  const [session, setSession] = useState(null);
  const [alarmaActiva, setAlarmaActiva] = useState(false);
  const alarmTriggeredRef = useRef(false);
  const audioRef = useRef(null);

  if (!audioRef.current) {
    audioRef.current = new Audio(sonidoLiquidacion);
    audioRef.current.loop = true;
  }

  const actualizarEstado = useCallback(async () => {
    try {
      const data = await obtenerEstadoSesionRunt();
      if (data?.ok && data?.session) {
        setSession(data.session);
      }
    } catch (err) {
      console.warn("No se pudo obtener estado de sesión RUNT:", err.message);
    }
  }, []);

  useEffect(() => {
    actualizarEstado();
    const interval = setInterval(actualizarEstado, POLLING_MS);
    return () => clearInterval(interval);
  }, [actualizarEstado]);

  useEffect(() => {
    const handler = (event) => {
      if (event.origin !== LOCAL_API_BASE) return;
      if (event.data?.type === "runt-session-iniciada" && event.data?.payload?.session) {
        setSession(event.data.payload.session);
        setAlarmaActiva(false);
        alarmTriggeredRef.current = false;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        toast.success("Sesión RUNT renovada por 60 minutos");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (!session) return;
    const minutos = session.minutosRestantes || 0;
    const activa = session.activa;

    if (activa && minutos > 0 && minutos <= UMBRAL_ALARMA_MINUTOS && !alarmTriggeredRef.current) {
      alarmTriggeredRef.current = true;
      setAlarmaActiva(true);
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn("No se pudo reproducir la alarma:", err);
      });
    }

    if (minutos > UMBRAL_ALARMA_MINUTOS && alarmaActiva) {
      setAlarmaActiva(false);
      alarmTriggeredRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [session, alarmaActiva]);

  const silenciarYRenovar = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setAlarmaActiva(false);
    alarmTriggeredRef.current = true;

    const ventana = window.open(
      `${LOCAL_API_BASE}/api/runt-session/iniciar`,
      "runtSession",
      "width=520,height=320"
    );
    if (!ventana) {
      toast.error("Bloqueador de popups detectado. Permite popups para esta página.");
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  if (!alarmaActiva) return null;

  const minutos = session?.minutosRestantes || 0;
  const minutosTexto = `${minutos} minuto${minutos !== 1 ? "s" : ""}`;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border-4 border-amber-400">
        <div className="bg-amber-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-200 mb-4 animate-pulse">
            <AlertTriangle className="w-14 h-14 text-amber-700" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Volume2 className="w-6 h-6 text-amber-600 animate-pulse" />
            <span className="text-sm font-bold text-amber-700 uppercase tracking-wider">
              Alarma de sesión
            </span>
            <Volume2 className="w-6 h-6 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-amber-800 mb-2">
            ¡La sesión vence en {minutosTexto}!
          </h2>
          <p className="text-base text-amber-700">
            Debes renovar la sesión RUNT para poder seguir consultando.
          </p>
        </div>

        <div className="p-8 bg-white">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6">
            <p className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
              <CircleDot size={18} className="text-amber-700 shrink-0" />
              <span>Ir a la sesion RUNT, donde inicio la sesión</span>
            </p>
            <p className="text-xs text-amber-700 pl-7">
              Iniciar sesión con tu huella digital y clave.
            </p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 mb-6">
            <p className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
              <CircleDot size={18} className="text-emerald-700 shrink-0" />
              <span>Registrar nueva sesión</span>
            </p>
            <p className="text-xs text-emerald-700 pl-7">
              Clic en el botón "Silenciar y renovar". Se abrirá una ventana que registrará la nueva sesión de 60 minutos automáticamente.
            </p>
          </div>

          <button
            onClick={silenciarYRenovar}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-base font-bold transition-all shadow-lg hover:shadow-xl"
            title="Silenciar alarma y abrir ventana de inicio de sesión"
          >
            <VolumeX size={20} />
            Silenciar y renovar sesión
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">
            La alarma seguirá sonando hasta que silencies
          </p>
        </div>
      </div>
    </div>
  );
}
