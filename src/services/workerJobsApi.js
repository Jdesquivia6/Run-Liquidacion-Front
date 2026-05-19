import axios from "axios";

const API_BASE = "http://84.247.165.214:3000/api";

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