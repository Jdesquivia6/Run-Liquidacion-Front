import axios from "axios";
import { API_BASE } from "../config";

// Cliente con interceptor de token (igual que axiosClient)
const api = axios.create({
  baseURL: API_BASE
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function crearJob(modulo, items, workerName = "PC-USUARIO") {
  const response = await api.post(`${API_BASE}/worker-jobs`, {
    modulo,
    workerName,
    items
  });
  return response.data;
}

export async function listarJobs({ modulo, estado, limit = 50, offset = 0, mine = false } = {}) {
  const response = await api.get(`${API_BASE}/worker-jobs`, {
    params: { modulo, estado, limit, offset, mine }
  });
  return response.data;
}

export async function obtenerDetalleJob(jobId) {
  const response = await api.get(`${API_BASE}/worker-jobs/${jobId}`);
  return response.data;
}

export async function exportarJobExcel(jobId) {
  const response = await api.get(`${API_BASE}/worker-jobs/${jobId}/exportar-excel`, {
    responseType: "blob"
  });

  const disposition = response.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  const nombre = match?.[1] || `job_${jobId}.xlsx`;

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nombre);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function obtenerProgresoJob(jobId) {
  const response = await api.get(`${API_BASE}/worker-jobs/${jobId}/progreso`);
  return response.data;
}

export async function cancelarJob(jobId) {
  const response = await api.post(`${API_BASE}/worker-jobs/${jobId}/cancelar`);
  return response.data;
}

export async function reintentarFallidos(jobId) {
  const response = await api.post(`${API_BASE}/worker-jobs/${jobId}/reintentar-fallidos`);
  return response.data;
}

export async function obtenerCatalogoEstados() {
  const response = await api.get(`${API_BASE}/worker-jobs/catalogos/estados`);
  return response.data;
}