import axios from "axios";
import { API_BASE as CFG } from "../config";

const API_BASE = `${CFG}/users`;

function getToken() {
  return localStorage.getItem("token");
}

export async function listarUsuarios() {
  const response = await axios.get(API_BASE, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  return response.data;
}

export async function listarModulos() {
  const response = await axios.get(
    `${API_BASE}/catalogos/modulos`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  return response.data;
}

export async function crearUsuario(data) {
  const response = await axios.post(API_BASE, data, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  return response.data;
}

export async function actualizarUsuario(id, data) {
  const response = await axios.put(
    `${API_BASE}/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  return response.data;
}

export async function cambiarPassword(id, password) {
  const response = await axios.patch(
    `${API_BASE}/${id}/password`,
    { password },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  return response.data;
}