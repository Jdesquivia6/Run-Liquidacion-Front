import axios from "axios";

const LOCAL_API_BASE = "http://localhost:3000/api";
const SESSION_DURATION = 60;
const SAFETY_MARGIN = 10;

export async function obtenerEstadoSesionRunt() {
  const response = await axios.get(`${LOCAL_API_BASE}/runt-session/estado`);
  return response.data;
}

export function getLocalSession() {
  const startedAt = localStorage.getItem("runtSessionStartedAt");
  if (!startedAt) return null;

  const elapsed = (Date.now() - Number(startedAt)) / 60000;
  if (elapsed >= SESSION_DURATION) {
    localStorage.removeItem("runtSessionStartedAt");
    return null;
  }

  const minutosRestantes = Math.max(SESSION_DURATION - elapsed, 0);
  const puedeConsultar = minutosRestantes > SAFETY_MARGIN;

  return {
    iniciada: true,
    activa: minutosRestantes > 2,
    puedeConsultar,
    minutosRestantes: Math.round(minutosRestantes),
    capacidadSegura: puedeConsultar
      ? Math.max(Math.floor((minutosRestantes - SAFETY_MARGIN) / 1.2), 0)
      : 0,
    mensaje:
      minutosRestantes > 0
        ? `Quedan ${Math.round(minutosRestantes)} minutos de sesión RUNT`
        : "La sesión RUNT ya venció"
  };
}

export function saveLocalSession(session) {
  if (session?.sessionStartedAt) {
    localStorage.setItem("runtSessionStartedAt", new Date(session.sessionStartedAt).getTime().toString());
  }
}

export function clearLocalSession() {
  localStorage.removeItem("runtSessionStartedAt");
}
