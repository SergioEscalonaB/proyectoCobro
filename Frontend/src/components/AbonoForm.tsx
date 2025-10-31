// src/components/AbonoForm.tsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente AbonoForm
 * 
 * Este componente es la conversión directa del HTML de "Predocumento.html"
 * a código JSX de React con TypeScript. Se han realizado los siguientes cambios:
 * 1. 'class' se ha reemplazado por 'className'.
 * 2. Las etiquetas sin cierre (como <input>) se han cerrado automáticamente (<input />).
 * 3. Los comentarios HTML se han convertido a comentarios JSX.
 * 4. Se ha añadido la lógica básica de un componente funcional de React.
 * 5. Se han añadido comentarios en español para explicar la estructura.
 */
const AbonoForm: React.FC = () => {
  // NOTA: En un proyecto real, se usarían hooks de React como useState y useEffect
  // para manejar el estado de los formularios y la lógica de la aplicación.

  return (
    // Contenedor principal: ocupa toda la pantalla con fondo gris claro
    <div className="bg-gray-200 dark:bg-gray-800 h-screen p-4 font-sans overflow-hidden">
      <div className="mx-auto h-full max-w-[100vw] flex flex-col">
        {/* Sección de Créditos o Encabezado */}
        <div className="bg-white dark:bg-gray-700 px-3 py-1 mb-1 rounded shadow">
          <p className="text-xs text-gray-700 dark:text-gray-300">Creditos Realizado por Sergio Escalona</p>
        </div>

        {/* Contenedor principal de la aplicación (Grid) */}
        <div className="grid grid-cols-12 gap-2 flex-1 overflow-hidden">
          {/* Columna Izquierda (Formulario Principal) - 9 de 12 columnas */}
          <div className="col-span-9 flex flex-col overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-700 mb-2 p-2 rounded shadow flex-1 flex flex-col overflow-hidden">
              
              {/* Fila 1: Código del Cobro y Botón Modificar */}
              <div className="items-center mb-2 flex gap-2">
                <label className="font-bold text-xs text-gray-900 dark:text-white whitespace-nowrap">Codigo del Cobro</label>
                <select 
                  className="border-2 border-blue-600 dark:text-white dark:border-blue-400 min-w-[150px]
                  bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                >
                  <option>Seleccionar código</option>
                </select>
                <button 
                  type="button" // Cambiado a type="button" ya que no es un submit de formulario
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-gray-200
                  dark:bg-gray-600 px-2 py-0.5 text-xs ml-45"
                >
                  Modificar
                </button>
              </div>

              {/* Fila 2: Datos del Cliente (Cedula, Nombre, Dir-Tel, Plazo, FP, Días Vencidos) */}
              <div className="mb-2 grid grid-cols-12 gap-2">
                {/* Cedula */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">Cedula</label>
                  <input 
                    type="text" 
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
                    dark:bg-gray-600 px-1 py-0.5 text-xs" 
                  />
                </div>
                {/* Nombre Del Cliente */}
                <div className="col-span-3">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">Nombre Del Cliente</label>
                  <input 
                    type="text" 
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
                    dark:bg-gray-600 px-1 py-0.5 text-xs" 
                  />
                </div>
                {/* Dir - Tel */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">Dir - Tel</label>
                  <input 
                    type="text" 
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
                    dark:bg-gray-600 px-1 py-0.5 text-xs" 
                  />
                </div>
                {/* Plazo (Dias) */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">Plazo (Dias)</label>
                  <input 
                    type="text" 
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
                    dark:bg-gray-600 px-1 py-0.5 text-xs" 
                  />
                </div>
                {/* FP */}
                <div className="col-span-1">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">FP</label>
                  <select 
                    className="border-2 border-gray-300 dark:text-white dark:border-blue-400 min-w-15
                    bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                  >
                    <option>--</option>
                  </select>
                </div>
                {/* Dias Vencidos */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">Dias Vencidos</label>
                  <input 
                    type="text" 
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-15 bg-yellow-300
                    dark:bg-yellow-500 px-1 py-0.5 text-xs" 
                  />
                </div>
              </div>

              {/* Fila 3: Valores (Valor, Cuota, Fecha, Saldo) */}
              <div className="mb-2 grid grid-cols-12 gap-2">
                {/* Valor */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">Valor</label>
                  <input 
                    type="text" 
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
                    dark:bg-gray-600 px-1 py-0.5 text-xs" 
                  />
                </div>
                {/* Cuota */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">Cuota</label>
                  <input 
                    type="text" 
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
                    dark:bg-gray-600 px-1 py-0.5 text-xs" 
                  />
                </div>
                {/* Fecha */}
                <div className="col-span-2">
                  {/* Nota: En JSX, <span italic=""> se convierte a <span className="italic"> o simplemente <span> */}
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">Fecha <span className="italic">( dd-mm-aa )</span></label>
                  <input 
                    type="text" 
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
                    dark:bg-gray-600 px-1 py-0.5 text-xs" 
                  />
                </div>
                {/* Saldo */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">Saldo</label>
                  <input 
                    type="text" 
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-32 bg-green-300
                    dark:bg-green-600 px-1 py-0.5 text-xs" 
                  />
                </div>
              </div>
              
              {/* SECCIÓN PRINCIPAL: Checkboxes y Tabla de Descripción */}
              <div className="mb-2 flex-1 flex gap-2 overflow-hidden">
                {/* Panel de checkboxes (izquierda) */}
                <div className="bg-gray dark:bg-gray-600 border-2 border-gray-400 dark:border-gray-500 p-3 w-64 flex flex-col justify-center">
                  <div className="mb-0.5">
                    <label className="items-center text-xs text-gray-900 flex dark:text-white">
                      <input type="checkbox" className="mr-1" />
                      <span className="font-bold">Colocar Fecha del sistema</span>
                    </label>
                  </div>
                  <div className="mb-0.5">
                    <label className="items-center text-xs text-gray-900 flex dark:text-white">
                      <input type="checkbox" className="mr-1" />
                      <span className="font-bold">Descontar de la suma del cobro</span>
                    </label>
                  </div>
                  <div className="mb-0.5">
                    <label className="items-center text-xs text-gray-900 flex dark:text-white">
                      <input type="checkbox" className="mr-1" />
                      <span className="font-bold">Crear Prestamo Sin Sumar a Prest.</span>
                    </label>
                  </div>
                  {/* Sección de Radio Buttons para Nuevo Cliente */}
                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-400 dark:border-gray-500 p-3 mt-3">
                    <div className="font-bold text-xs mb-0.5 text-gray-900 dark:text-white">Nuevo Cliente</div>
                    <div className="mb-0.5">
                      <label className="items-center text-xs text-gray-600 flex dark:text-gray-300">
                        {/* El atributo 'name' es importante para que solo se pueda seleccionar uno */}
                        <input name="cliente" type="radio" className="mr-1" />
                        <span>Antes</span>
                      </label>
                    </div>
                    <div>
                      <label className="items-center text-xs text-gray-600 flex dark:text-gray-300">
                        <input name="cliente" type="radio" className="mr-1" />
                        <span>Despues</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Tabla de descripción (derecha) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="text-center font-bold text-xs mb-1 text-gray-900 dark:text-white">
                    DESCRIPCION DE ABONOS
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-xs border border-gray-800 dark:border-gray-500">
                      <thead>
                        <tr className="bg-white dark:bg-gray-600">
                          <th className="px-1 py-0.5 text-gray-900 border border-gray-800 dark:border-gray-500 dark:text-white w-1/5 ">Fecha Actual/Abono</th>
                          <th className="px-1 py-0.5 text-gray-900 border border-gray-800 dark:border-gray-500 dark:text-white w-1/6">FECHA</th>
                          <th className="px-1 py-0.5 text-gray-900 border border-gray-800 dark:border-gray-500 dark:text-white w-1/5">ABONO</th>
                          <th className="px-1 py-0.5 text-gray-900 border border-gray-800 dark:border-gray-500 dark:text-white w-1/5">RESTA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Fila de ejemplo. En React, esta fila se generaría con un .map() */}
                        <tr className="bg-white dark:bg-gray-600">
                          <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white">&nbsp;</td>
                          <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white">&nbsp;</td>
                          <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white">&nbsp;</td>
                          <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white">&nbsp;</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Fila de Botones Inferiores */}
              <div className="justify-end flex flex-col">
                {/* Fila superior de botones */}
                <div className="mb-0.5 flex gap-1">
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Cancelar</button>
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Guardar</button>
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Nuevo Cliente</button>
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Abono</button>
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Modificar</button>
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Salir</button>
                </div>
                {/* Fila inferior de botones de navegación (Primero, Anterior, Siguiente, Último) */}
                <div className="flex gap-1">
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Primero</button>
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Anterior</button>
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Siguiente</button>
                  <button type="button" className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs">Ultimo</button>
                  {/* Botón Volver al Menú - Añadido para la navegación en React */}
                  <Link to="/" className="flex-1 flex items-center justify-center border-2 border-blue-500 text-blue-500 hover:text-white hover:bg-blue-500 bg-white px-2 py-0.5 text-xs transition duration-300">
                    Volver al Menú
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha (Información Adicional) - 3 de 12 columnas */}
              <div className="col-span-3 flex flex-col overflow-hidden gap-1">
      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded shadow">
        <div className="mb-1 grid grid-cols-6 gap-1">
          <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-5">
            COBRO
          </label>
          <input
            type="text"
            className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
          />
        </div>

        <div className="mb-1 grid grid-cols-6 gap-1">
          <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
            - PRESTAMO
          </label>
          <input
            type="text"
            className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
          />
        </div>

        <div className="mb-1 grid grid-cols-6 gap-1">
          <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
            - GASTOS
          </label>
          <div className="flex gap-0.5 col-span-2">
            <input
              type="text"
              className="flex-1 border border-gray-400 dark:border-gray-500 dark:text-white w-24 bg-white
                dark:bg-gray-600 px-1 py-0.5 text-xs"
            />
            <label className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
              Otr Gas
            </label>
            <input
              type="text"
              className="border border-gray-400 dark:border-gray-500 dark:text-white w-20 bg-white
                dark:bg-gray-600 px-1 py-0.5 text-xs"
            />
          </div>
        </div>

        <div className="mb-1 grid grid-cols-6 gap-1">
          <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
            + BASE
          </label>
          <input
            type="text"
            className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
          />
        </div>

        <div className="mb-1 grid grid-cols-6 gap-1">
          <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
            - DESCUENTO
          </label>
          <input
            type="text"
            className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
          />
        </div>

        <div className="mb-1 grid grid-cols-6 gap-1">
          <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-5">
            Efectivo
          </label>
          <input
            type="text"
            className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
          />
        </div>

        <div className="items-center flex gap-1">
          <div className="bg-green-500 dark:bg-green-600 px-1 py-1 flex-1">&nbsp;</div>
          <label className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
            Diferencia:
          </label>
          <div className="bg-yellow-300 dark:bg-yellow-500 px-1 py-1 flex-1">&nbsp;</div>
        </div>
      </div>

      <div className="bg-blue-700 dark:bg-blue-800 text-white text-center px-1 py-1 text-xs font-bold dark:text-white whitespace-nowrap">
        Fecha
      </div>

      <div className="bg-red-600 dark:bg-red-700 text-white text-center py-1 font-bold text-xs rounded shadow">
        SIN GUARDAR
      </div>

      <div className="flex-1">
        <div className="bg-gray-800 dark:bg-gray-900 text-white text-center py-1 font-bold text-xs">
          TARJETAS CANCELADAS
        </div>
        <div className="bg-yellow-500 dark:bg-yellow-600 h-full"></div>
      </div>

      <div className="flex-1">
        <div className="bg-gray-800 dark:bg-gray-900 text-white text-center py-1 font-bold text-xs">
          PRESTAMOS INGRESADOS
        </div>
        <div className="bg-cyan-500 dark:bg-cyan-600 h-full"></div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded shadow">
        <label className="text-xs font-bold mb-1 text-gray-900 block dark:text-white">
          Buscar
        </label>
        <select
          className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
            dark:bg-gray-600 px-1 py-0.5 text-xs mb-1"
        >
          <option>Seleccionar</option>
        </select>

        <div className="items-center mb-1 flex gap-1">
          <label className="text-xs font-bold text-gray-900 dark:text-white">Cédula</label>
          <input
            type="text"
            className="flex-1 border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs"
          />
        </div>

        <button
          type="submit"
          className="border-2 border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
            dark:bg-gray-600 px-2 py-1 text-xs font-bold mb-1"
        >
          Verificar
        </button>

        <button
          type="submit"
          className="border-2 border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
            dark:bg-gray-600 px-2 py-1 text-xs font-bold"
        >
          #Tarjeta
        </button>
      </div>
    </div>
        </div>
      </div>
    </div>
  );
};

export default AbonoForm;
