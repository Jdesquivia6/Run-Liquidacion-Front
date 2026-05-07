export default function TramitesTable({ tramites = [], onRemove }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        Trámites agregados
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-3">Id</th>
              <th>Nombre</th>
              <th>Tarifa</th>
              <th>Eliminar</th>
            </tr>
          </thead>

          <tbody>
            {tramites.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-4 text-gray-400 text-center">
                  No hay trámites agregados
                </td>
              </tr>
            ) : (
              tramites.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3">{item.id || index + 1}</td>
                  <td>{item.nombre}</td>
                  <td>{item.tarifa}</td>
                  <td>
                    <button
                      onClick={() => onRemove(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}