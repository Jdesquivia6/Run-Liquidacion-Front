import axios from "axios";

const API_BASE = "http://localhost:3000/api";

export async function loginRequest(data) {
  const response = await axios.post(`${API_BASE}/auth/login`, data);
  return response.data;
}

export async function recuperarPasswordRequest(email) {
  const response = await axios.post(`${API_BASE}/auth/recuperar-password`, {
    email
  });

  return response.data;
}

export async function cambiarMiPasswordRequest(data) {
  const token = localStorage.getItem("token");

  const response = await axios.patch(
    `${API_BASE}/auth/mi-password`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
}