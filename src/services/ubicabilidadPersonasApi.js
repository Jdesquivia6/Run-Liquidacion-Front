import axios from "axios";
import { API_BASE as CFG } from "../config";

const API = `${CFG}/ubicabilidad-personas`;

export async function validarArchivoExcel(formData) {
  const response = await axios.postForm(`${API}/validar-archivo`, formData);
  return response.data;
}

export async function obtenerDocumentosParaProcesar(documentos) {
  const response = await axios.post(`${API}/obtener-documentos`, { documentos });
  return response.data;
}

export async function listarResultados({ page = 1, limit = 20, documento, estado, fecha_inicio, fecha_fin } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (documento) params.append('documento', documento);
  if (estado) params.append('estado', estado);
  if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
  if (fecha_fin) params.append('fecha_fin', fecha_fin);
  const response = await axios.get(`${API}/resultados?${params.toString()}`);
  return response.data;
}

export async function listarPendientes(limit = 90) {
  const response = await axios.get(`${API}/pendientes?limit=${limit}`);
  return response.data;
}

export async function listarHistorial() {
  const response = await axios.get(`${API}/historial`);
  return response.data;
}

export async function guardarDocumentos(documentos) {
  const response = await axios.post(`${API}/guardar-documentos`, { documentos });
  return response.data;
}

export async function limpiarDocumentos() {
  const response = await axios.delete(`${API}/limpiar-documentos`);
  return response.data;
}

// ── Integraciones API (NO se mezclan con fotodetección/Excel) ──

export async function listarOrigenesApi() {
  const response = await axios.get(`${API}/origenes-api`);
  return response.data;
}

export async function listarPendientesApi(limit = 1000, origen = "", anio = "") {
  const params = new URLSearchParams({ limit });
  if (origen) params.append("origen", origen);
  if (anio) params.append("anio", anio);
  const response = await axios.get(`${API}/pendientes-api?${params.toString()}`);
  return response.data;
}

export async function limpiarDocumentosApi(origen = "", anio = "") {
  const params = new URLSearchParams();
  if (origen) params.append("origen", origen);
  if (anio) params.append("anio", anio);
  const qs = params.toString();
  const response = await axios.delete(`${API}/limpiar-api${qs ? `?${qs}` : ""}`);
  return response.data;
}

// ── Envío a CONTRAVENCIONES ──
// Envía al enriquecer de Contravenciones los resultados del scraping de un año.
export async function enviarAnioExterno(anio, origen = "") {
  const response = await axios.post(`${API}/enviar-externo`, { anio, origen });
  return response.data;
}

// Detalle de las respuestas que CONTRAVENCIONES rechazó, para ver el motivo
// y poder reintentar el envío.
export async function obtenerErroresEnvio(anio = "", origen = "") {
  const params = new URLSearchParams();
  if (anio !== "" && anio !== null && anio !== undefined) params.append("anio", anio);
  if (origen) params.append("origen", origen);
  const qs = params.toString();
  const response = await axios.get(`${API}/errores-envio${qs ? `?${qs}` : ""}`);
  return response.data;
}
