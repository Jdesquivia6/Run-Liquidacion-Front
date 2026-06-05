import axios from "axios";
import { API_BASE } from "../config";

export async function obtenerEstadoSesionRunt() {
  const response = await axios.get(`${API_BASE}/runt-session/estado`);
  return response.data;
}

export async function iniciarSesionRunt() {
  const response = await axios.post(`${API_BASE}/runt-session/iniciar`);
  return response.data;
}

export async function reiniciarSesionRunt() {
  const response = await axios.post(`${API_BASE}/runt-session/reiniciar`);
  return response.data;
}