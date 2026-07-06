import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PageHeroHeader from "../components/PageHeroHeader";
import { obtenerConfigImpresora, guardarConfigImpresora } from "../services/configApi";
import { API_BASE } from "../services/liquidacionApi";
import { Printer, Save, TestTube } from "lucide-react";

export default function ConfiguracionImpresora() {
  const [printerName, setPrinterName] = useState("");
  const [autoPrint, setAutoPrint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    try {
      const resp = await obtenerConfigImpresora();
      if (resp.ok && resp.data) {
        setPrinterName(resp.data.printer_name || "");
        setAutoPrint(resp.data.auto_print || false);
      }
    } catch {
      toast.error("Error cargando configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);
      await guardarConfigImpresora({
        printer_name: printerName.trim(),
        auto_print: autoPrint
      });
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
          description="Define la impresora predeterminada para la impresión automática de liquidaciones RUNT."
          icon={Printer}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Printer className="w-5 h-5 text-[#00ABE4]" />
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Datos de la impresora
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                Nombre de la impresora
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="Deja vacío para usar la impresora predeterminada de Windows"
                className="
                  w-full px-4 py-3 rounded-xl border-2 border-slate-200
                  text-sm text-[#1e293b] placeholder:text-[#94a3b8]
                  focus:outline-none focus:border-[#00ABE4] focus:ring-4 focus:ring-[#00ABE4]/10
                  transition-all duration-200
                "
              />
              <p className="text-xs text-[#94a3b8] mt-1.5">
                El nombre debe coincidir exactamente con el de la cola de impresión de Windows.
                Si lo dejas vacío, se usará la impresora predeterminada.
              </p>
            </div>

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
                  relative w-12 h-7 rounded-full transition-colors duration-200
                  ${autoPrint ? "bg-[#00ABE4]" : "bg-slate-300"}
                `}
              >
                <span
                  className={`
                    absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                    ${autoPrint ? "translate-x-6" : "translate-x-1"}
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
            El nombre de la impresora debe ser el mismo que aparece en "Dispositivos e impresoras" en Windows.
          </p>
        </div>
      </div>
    </div>
  );
}
