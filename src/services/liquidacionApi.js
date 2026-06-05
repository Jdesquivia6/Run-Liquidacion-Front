import axios from "axios";
import { API_BASE as CFG } from "../config";

const API = `${CFG}/liquidacion`;

export const API_BASE = API;

export async function consultarLiquidacion(payload) {
  const response = await axios.post(`${API}/consultar-liquidacion`, payload);
  return response.data;
}