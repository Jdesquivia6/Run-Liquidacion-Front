import axios from "axios";

const API = "http://84.247.165.214:3000/api/liquidacion";

export async function consultarLiquidacion(payload) {
  const response = await axios.post(`${API}/consultar-liquidacion`, payload);
  return response.data;
}