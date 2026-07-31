import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PageHeroHeader from "../components/PageHeroHeader";
import {
  obtenerConfigImpresora,
  guardarConfigImpresora,
  listarImpresoras,
  listarImpresorasDisponibles,
  agregarImpresora,
  eliminarImpresora,
  activarImpresora
} from "../services/configApi";
import { API_BASE } from "../services/liquidacionApi";
import { Printer, Save, TestTube, Plus, Trash2, ScanSearch } from "lucide-react";

export default function ConfiguracionImpresora() {
  const [printerName, setPrinterName] = useState("");
  const [autoPrint, setAutoPrint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [impresoras, setImpresoras] = useState([]);
  const [activa, setActiva] = useState("");
  const [selectedPrinterId, setSelectedPrinterId] = useState("");
  const [nuevaImpresora, setNuevaImpresora] = useState("");
  const [disponibles, setDisponibles] = useState([]);
  const [detectando, setDetectando] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [mostrarDisponibles, setMostrarDisponibles] = useState(false);

  const cargarTodo = async () => {
    const [configResp, listaResp] = await Promise.all([
      obtenerConfigImpresora(),
      listarImpresoras()
    ]);

    if (configResp.ok && configResp.data) {
      setPrinterName(configResp.data.printer_name || "");
      setAutoPrint(configResp.data.auto_print || false);
    }

    if (listaResp.ok && listaResp.data) {
      setImpresoras(listaResp.data.impresoras || []);
      setActiva(listaResp.data.activa || "");
      const activaEnLista = (listaResp.data.impresoras || []).find(
        p => p.nombre === (listaResp.data.activa || "")
      );
      setSelectedPrinterId(activaEnLista ? String(activaEnLista.id) : "");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await cargarTodo();
      } catch {
        toast.error("Error cargando configuración");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const recargarLista = async () => {
    const listaResp = await listarImpresoras();
    if (listaResp.ok && listaResp.data) {
      setImpresoras(listaResp.data.impresoras || []);
      setActiva(listaResp.data.activa || "");
    }
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);

      const seleccionada = impresoras.find(p => String(p.id) === String(selectedPrinterId));
      const nombreFinal = seleccionada ? seleccionada.nombre : printerName;

      if (seleccionada) {
        await activarImpresora(seleccionada.id);
      }

      await guardarConfigImpresora({
        printer_name: nombreFinal,
        auto_print: autoPrint
      });

      setPrinterName(nombreFinal);
      setActiva(nombreFinal);
      toast.success("Configuración guardada correctamente");
    } catch {
      toast.error("Error guardando configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleProbarImpresion = async () => {
    try {
      setTesting(true);
      const resp = await fetch(`${API_BASE}/imprimir-pdfs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileNames: [] })
      });
      const data = await resp.json();
      if (data.fallidas === 0) {
        toast.success("Prueba de impresión exitosa");
      } else {
        toast.error(`Falló: ${data.errores?.[0] || "Sin impresoras disponibles"}`);
      }
    } catch (err) {
      toast.error("No se pudo conectar al servidor");
    } finally {
      setTesting(false);
    }
  };

  const handleAgregarManual = async () => {
    const nombre = nuevaImpresora.trim();
    if (!nombre) {
      toast.error("Escriba el nombre de la impresora");
      return;
    }

    try {
      setAgregando(true);
      await agregarImpresora(nombre);
      setNuevaImpresora("");
      await recargarLista();
      toast.success(`Impresora "${nombre}" agregada`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error agregando impresora");
    } finally {
      setAgregando(false);
    }
  };

  const handleAgregarDisponible = async (nombre) => {
    try {
      setAgregando(true);
      await agregarImpresora(nombre);
      await recargarLista();
      toast.success(`Impresora "${nombre}" agregada`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error agregando impresora");
    } finally {
      setAgregando(false);
    }
  };

  const handleDetectar = async () => {
    try {
      setDetectando(true);
      const resp = await listarImpresorasDisponibles();
      if (resp.ok) {
        const registradas = new Set(impresoras.map(p => p.nombre));
        const nuevas = (resp.data || []).filter(d => !registradas.has(d));
        setDisponibles(nuevas);
        setMostrarDisponibles(true);
        if (nuevas.length === 0) {
          toast.info("Todas las impresoras instaladas ya están registradas");
        }
      }
    } catch {
      toast.error("No se pudieron detectar impresoras");
    } finally {
      setDetectando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    try {
      await eliminarImpresora(id);
      await recargarLista();
      if (activa === nombre) {
        setActiva("");
        setSelectedPrinterId("");
      }
      toast.success(`Impresora "${nombre}" eliminada`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error eliminando impresora");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#00ABE4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-5">
        <PageHeroHeader
          label="Configuración"
          labelIcon={Printer}
          title="Configuración de impresora"
          description="Registre sus impresoras y seleccione cuál usar para la impresión automática de liquidaciones RUNT."
          icon={Printer}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Printer className="w-5 h-5 text-[#00ABE4]" />
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Datos de la impresora
            </h3>
          </div>

          <div className="space-y-5">
            {/* Dropdown de impresora activa */}
            <div>
              <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                Impresora activa
              </label>
              <select
                value={selectedPrinterId}
                onChange={(e) => setSelectedPrinterId(e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl border-2 border-slate-200
                  text-sm text-[#1e293b] bg-white
                  focus:outline-none focus:border-[#00ABE4] focus:ring-4 focus:ring-[#00ABE4]/10
                  transition-all duration-200
                "
              >
                <option value="">— Seleccione una impresora —</option>
                {impresoras.map(p => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nombre}{p.nombre === activa ? "  (Activa)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#94a3b8] mt-1.5">
                Esta será la impresora que se usará al imprimir. Selecciónela y presione "Guardar configuración".
              </p>
            </div>

            {/* Lista de impresoras registradas */}
            <div>
              <p className="block text-xs font-semibold text-[#64748b] mb-1.5">
                Impresoras registradas ({impresoras.length})
              </p>
              {impresoras.length === 0 ? (
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-[#94a3b8]">
                  No hay impresoras registradas. Agregue una manualmente o detecte las de Windows.
                </div>
              ) : (
                <ul className="space-y-2">
                  {impresoras.map(p => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Printer size={15} className="text-[#00ABE4] flex-shrink-0" />
                        <span className="text-sm text-[#1e293b] truncate">{p.nombre}</span>
                        {p.nombre === activa && (
                          <span className="flex-shrink-0 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Activa
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleEliminar(p.id, p.nombre)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                        title={`Eliminar ${p.nombre}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Agregar manual */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                  Agregar impresora
                </label>
                <input
                  type="text"
                  value={nuevaImpresora}
                  onChange={(e) => setNuevaImpresora(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAgregarManual(); }}
                  placeholder="Nombre exacto de la impresora"
                  className="
                    w-full px-4 py-3 rounded-xl border-2 border-slate-200
                    text-sm text-[#1e293b] placeholder:text-[#94a3b8]
                    focus:outline-none focus:border-[#00ABE4] focus:ring-4 focus:ring-[#00ABE4]/10
                    transition-all duration-200
                  "
                />
              </div>
              <button
                onClick={handleAgregarManual}
                disabled={agregando}
                className="flex items-center gap-2 px-4 py-3 bg-[#00ABE4] hover:bg-[#0095C5] text-white rounded-xl text-sm font-semibold transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {/* Detectar impresoras de Windows */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleDetectar}
                disabled={detectando}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#64748b] rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
              >
                <ScanSearch className="w-4 h-4" />
                {detectando ? "Detectando..." : "Detectar impresoras de Windows"}
              </button>

              {mostrarDisponibles && (
                <div className="mt-3">
                  {disponibles.length === 0 ? (
                    <p className="text-xs text-[#94a3b8]">
                      Todas las impresoras instaladas ya están registradas.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {disponibles.map(d => (
                        <button
                          key={d}
                          onClick={() => handleAgregarDisponible(d)}
                          disabled={agregando}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00ABE4] border border-blue-200 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          <Plus size={12} />
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auto-impresión */}
            <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-[#1e293b]">Auto-impresión</p>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Imprimir automáticamente al finalizar cada batch
                </p>
              </div>
              <button
                onClick={() => setAutoPrint(!autoPrint)}
                className={`
                  inline-flex items-center w-12 h-7 rounded-full p-1 transition-colors duration-200
                  focus:outline-none focus:ring-0 select-none
                  [webkit-tap-highlight-color:transparent]
                  ${autoPrint ? "bg-[#00ABE4]" : "bg-slate-300"}
                `}
              >
                <span
                  className={`
                    w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                    ${autoPrint ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00ABE4] hover:bg-[#0095C5] text-white rounded-xl text-sm font-semibold transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>

            <button
              onClick={handleProbarImpresion}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#64748b] rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
            >
              <TestTube className="w-4 h-4" />
              {testing ? "Probando..." : "Probar impresión"}
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Nota:</strong> La impresión funciona con impresoras locales (USB) y de red (Wi-Fi/Ethernet).
            Registre cada impresora una sola vez y luego selecciónela.
          </p>
        </div>
      </div>
    </div>
  );
}
