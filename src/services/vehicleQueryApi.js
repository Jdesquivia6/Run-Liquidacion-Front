import axios from "axios";

const API_BASE = "http://localhost:3000/api";

export async function consultarPlacaBatch(placas) {
  const response = await axios.post(`${API_BASE}/vehiculos/procesar-batch`, {
    placas
  });

  return response.data;
}

export async function consultarDatosVehiculoBatch(placas) {
  const response = await axios.post(`${API_BASE}/datos-vehiculo/procesar-batch`, {
    placas
  });

  return response.data;
}

export async function listarHistorialVehiculos(modulo = "consulta-placa", limit = 50) {
  const response = await axios.get(`${API_BASE}/historial-vehiculos`, {
    params: {
      modulo,
      limit
    }
  });

  return response.data;
}

export async function listarPlacasPendientes({
  fechaInicio,
  fechaFin,
  estado = "pendientes",
  modulo = "consulta-placa",
  limit = 100
}) {
  const response = await axios.get(`${API_BASE}/placas-pendientes`, {
    params: {
      fechaInicio,
      fechaFin,
      estado,
      modulo,
      limit
    }
  });

  return response.data;
}

export async function obtenerDashboard({ fechaInicio, fechaFin } = {}) {
  const response = await axios.get(`${API_BASE}/dashboard`, {
    params: {
      fechaInicio,
      fechaFin
    }
  });

  return response.data;
}

export function exportarDashboardExcel({ fechaInicio, fechaFin } = {}) {
  const params = new URLSearchParams();

  if (fechaInicio && fechaFin) {
    params.append("fechaInicio", fechaInicio);
    params.append("fechaFin", fechaFin);
  }

  window.open(
    `${API_BASE}/dashboard/exportar-excel?${params.toString()}`,
    "_blank"
  );
}