import axios from "axios";
import { API_BASE as CFG } from "../config";

const API = `${CFG}/placas`;

export async function cargarPlacasPorArchivo(formData) {
  const response = await axios.postForm(`${API}/cargar-archivo`, formData);
  return response.data;
}
