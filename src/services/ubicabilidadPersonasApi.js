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
