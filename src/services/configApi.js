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

export async function listarImpresoras() {
  const response = await axios.get(`${API}/impresoras`);
  return response.data;
}

export async function listarImpresorasDisponibles() {
  const response = await axios.get(`${API}/impresoras/disponibles`);
  return response.data;
}

export async function agregarImpresora(nombre) {
  const response = await axios.post(`${API}/impresoras`, { nombre });
  return response.data;
}

export async function eliminarImpresora(id) {
  const response = await axios.delete(`${API}/impresoras/${id}`);
  return response.data;
}

export async function activarImpresora(id) {
  const response = await axios.post(`${API}/impresoras/${id}/activar`);
  return response.data;
}
