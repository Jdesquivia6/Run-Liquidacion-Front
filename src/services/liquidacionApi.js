import axiosClient from "./axiosClient";
import { API_BASE as CFG } from "../config";

const API = `${CFG}/liquidacion`;

export const API_BASE = API;

export async function consultarLiquidacion(payload) {
  const response = await axiosClient.post(`/liquidacion/consultar-liquidacion`, payload);
  return response.data;
}

export async function consultarLiquidacionBatch(items) {
  const response = await axiosClient.post(`/liquidacion/consultar-liquidacion-batch`, { items });
  return response.data;
}

/**
 * Batch secuencial: llama al endpoint individual por cada placa una tras otra,
 * actualizando el progreso después de cada una. Funciona con cualquier proxy.
 *
 * @param {Array} items - [{ placa, tramites, fechaLiquidacion }]
 * @param {Object} callbacks
 * @param {(data) => void} callbacks.onResult - por cada resultado de placa
 * @param {(data) => void} callbacks.onComplete - cuando termina todo
 */
export async function consultarLiquidacionBatchSecuencial(items, callbacks = {}) {
  const { onResult, onComplete } = callbacks;
  let exitosos = 0;
  let fallidos = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const resp = await consultarLiquidacion(item);

      if (resp.ok) exitosos++;
      else fallidos++;

      onResult?.({
        index: i,
        ok: resp.ok,
        data: resp.data || null,
        error: resp.error || null,
        placa: item.placa,
        tramites: item.tramites
      });
    } catch (err) {
      fallidos++;
      onResult?.({
        index: i,
        ok: false,
        error: err.response?.data?.error || err.message || 'Error de conexión',
        placa: item.placa,
        tramites: item.tramites
      });
    }
  }

  onComplete?.({ total: items.length, exitosos, fallidos });
}

export async function imprimirPdfs(fileNames) {
  const response = await axiosClient.post(`/liquidacion/imprimir-pdfs`, { fileNames });
  return response.data;
}

export async function crearJobImpresion(fileNames) {
  const response = await axiosClient.post(`/liquidacion/crear-job-impresion`, { fileNames });
  return response.data;
}