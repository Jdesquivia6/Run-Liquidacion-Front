import axios from "axios";
import axiosClient from "./axiosClient";

const API_BASE = "http://84.247.165.214:3000/api";

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

export async function exportarDashboardExcel({ fechaInicio, fechaFin } = {}) {
  try {
    const response = await axiosClient.get('/dashboard/exportar-excel', {
      params: { fechaInicio, fechaFin },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exportando Excel:', error);
    throw error;
  }
}