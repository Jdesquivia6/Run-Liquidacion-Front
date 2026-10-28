
import { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Volume2, VolumeX, AlertTriangle, RefreshCcw,
  Fingerprint, ShieldCheck, Clock3, ExternalLink
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import sesionRuntAlerta from "../assets/sesionRuntAlerta.mp3";
import {
  getLocalSession,
  saveLocalSession,
  obtenerEstadoSesionRunt
} from "../services/sessionRunt";

const LOCAL_API_BASE = "http://localhost:3000";
const UMBRAL_ALARMA_MINUTOS = 5;
const POLLING_MS = 10000;

export default function RuntSessionAlarm() {
  const reduceMotion = useReducedMotion();
  const [session, setSession] = useState(null);
  const [alarmaActiva, setAlarmaActiva] = useState(false);

  const alarmTriggeredRef = useRef(false);
  const audioRef = useRef(null);

  // AUDIO EN BUCLE
  useEffect(() => {
    const audio = new Audio(sesionRuntAlerta);
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  const detenerAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
  }, []);

  // CONSULTA DEL BACKEND
  const actualizarEstado = useCallback(async () => {
    try {
      const data = await obtenerEstadoSesionRunt();

      if (data?.ok && data?.session) {
        setSession(data.session);
      }
    } catch (err) {
      console.warn(
        "No se pudo obtener estado de sesión RUNT:",
        err?.message
      );
    }
  }, []);

  // ACTUALIZACIÓN LOCAL SI EL BACKEND NO RESPONDE
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

  // POLLING CADA 10 SEGUNDOS
  useEffect(() => {
    actualizarEstado();

    const interval = setInterval(actualizarEstado, POLLING_MS);
    return () => clearInterval(interval);
  }, [actualizarEstado]);

  // RECÁLCULO LOCAL CADA 15 SEGUNDOS
  useEffect(() => {
    const tick = setInterval(recalcularLocal, 15000);
    return () => clearInterval(tick);
  }, [recalcularLocal]);

  // RECIBIR CONFIRMACIÓN DE RENOVACIÓN
  useEffect(() => {
    const handler = event => {
      if (event.origin !== LOCAL_API_BASE) return;

      if (
        event.data?.type === "runt-session-iniciada" &&
        event.data?.payload?.session
      ) {
        saveLocalSession(event.data.payload.session);
        setSession(getLocalSession() || event.data.payload.session);

        setAlarmaActiva(false);
        alarmTriggeredRef.current = false;
        detenerAudio();

        toast.success("Sesión RUNT renovada por 60 minutos");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [detenerAudio]);

  // DISPARAR ALARMA CUANDO QUEDAN 5 MINUTOS
  useEffect(() => {
    if (!session) return;

    const minutos = Number(session.minutosRestantes) || 0;
    const activa = Boolean(session.activa);

    if (
      activa &&
      minutos > 0 &&
      minutos <= UMBRAL_ALARMA_MINUTOS &&
      !alarmTriggeredRef.current
    ) {
      alarmTriggeredRef.current = true;
      setAlarmaActiva(true);

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.warn("No se pudo reproducir la alarma:", err);
        });
      }
    }

    if (minutos > UMBRAL_ALARMA_MINUTOS && alarmaActiva) {
      setAlarmaActiva(false);
      alarmTriggeredRef.current = false;
      detenerAudio();
    }
  }, [session, alarmaActiva, detenerAudio]);

  // SILENCIAR Y ABRIR VENTANA RUNT
  const silenciarYRenovar = () => {
    detenerAudio();
    setAlarmaActiva(false);
    alarmTriggeredRef.current = true;

    const ventana = window.open(
      `${LOCAL_API_BASE}/api/runt-session/iniciar`,
      "runtSession",
      "width=480,height=520,resizable=yes,scrollbars=yes"
    );

    if (!ventana) {
      toast.error(
        "Bloqueador de ventanas detectado. Permite ventanas emergentes para continuar."
      );
    }
  };

  if (!alarmaActiva) return null;

  const minutos = Number(session?.minutosRestantes) || 0;
  const minutosTexto = `${minutos} minuto${minutos !== 1 ? "s" : ""}`;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="runt-alarm-title"
      aria-describedby="runt-alarm-description"
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-[#061527]/80 p-3 backdrop-blur-[5px] sm:p-5"
      onClick={e => e.stopPropagation()}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="my-auto w-full max-w-[490px] overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,.3)] dark:border-amber-500/20 dark:bg-[#172539] sm:rounded-3xl"
      >

        {/* CABECERA */}

        <div className="relative overflow-hidden border-b border-amber-100 bg-gradient-to-br from-amber-50 to-white px-5 pb-5 pt-6 text-center dark:border-slate-700 dark:from-[#1D2B3F] dark:to-[#172539]">
          <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-400/10" />

          <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <AlertTriangle size={29} strokeWidth={1.9} />
          </div>

          <span className="relative inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <Volume2 size={13} />
            Alerta de sesión RUNT
          </span>

          <h2
            id="runt-alarm-title"
            className="relative mt-3 text-[23px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-[27px]"
          >
            Tu sesión está por vencer
          </h2>

          <p
            id="runt-alarm-description"
            className="relative mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400"
          >
            Debes renovar tu sesión para continuar realizando consultas.
          </p>
        </div>

        {/* TIEMPO RESTANTE */}

        <div className="px-5 pt-5 sm:px-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Clock3 size={19} />

              <span className="text-xs font-semibold">
                Tiempo restante
              </span>
            </div>

            <span className="text-xl font-extrabold tabular-nums text-amber-700 dark:text-amber-300">
              {minutosTexto}
            </span>
          </div>
        </div>

        {/* INSTRUCCIONES */}

        <div className="space-y-3 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-[#111F32]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0095C5] dark:bg-sky-400/10 dark:text-sky-400">
              <Fingerprint size={19} />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                1. Autentícate en RUNT
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                Ve a la sesión RUNT y autentícate con tu huella digital y clave.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-[#111F32]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldCheck size={19} />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                2. Registra la nueva sesión
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                Presiona el botón inferior para silenciar la alarma y registrar la renovación.
              </p>
            </div>
          </div>
        </div>

        {/* ACCIÓN PRINCIPAL */}

        <div className="border-t border-slate-100 bg-white px-5 pb-5 pt-4 dark:border-slate-700 dark:bg-[#172539] sm:px-6">
          <button
            type="button"
            onClick={silenciarYRenovar}
            title="Silenciar alarma y abrir ventana de renovación"
            className="flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-4 text-[13px] font-bold text-white shadow-lg shadow-sky-500/15 transition-colors hover:from-[#0095C5] hover:to-[#007EA9]"
          >
            <VolumeX size={19} />
            Silenciar y renovar sesión
            <ExternalLink size={15} />
          </button>

          <p className="mt-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
            La alarma sonora continuará hasta realizar esta acción.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
