import axios from "axios";
import { API_BASE as CFG } from "../config";

const API = `${CFG}/config`;

export async function obtenerConfigImpresora() {
  const response = await axios.get(`${API}/impresora`);
  return response.data;
}

export async function guardarConfigImpresora(payload) {
  const response = await axios.post(`${API}/impresora`, payload);
  return response.data;
}
