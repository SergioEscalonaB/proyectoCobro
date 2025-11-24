# Proyecto de Gestion de Cobros

Este es un sistema integral para la gestión de clientes, préstamos, abonos y liquidaciones diarias de cobradores. Diseñado para optimizar rutas de cobro, registrar operaciones financieras y generar reportes precisos.

---

## Funciones
### 1. **Gestion de Cobradores**
- CRUD completo (crear, leer, actualizar, eliminar).
- Registro de Cobradores: código, nombre, dirección, teléfono y moto.

### 2. **Gestion de Clientes y Prestamos (Tarjetas)**
- Registro de clientes con información básica y asignación a un cobrador.
- Cada cliente puede tener solo 1 préstamos (tarjetas) activo a lo largo del tiempo.
- Cada préstamo incluye:
  - Valor total
  - Cuota
  - Frecuencia de pago (`fp`)
  - Duración
  - Número de secuencia (`iten`) para la posicion en la ruta
- **Navegación secuencial** entre clientes (siguiente/anterior), con opción de filtrar por cobrador.
- Posibilidad de **modificar los datos del préstamo activo**: tiempo, frecuencia de pago y cuota.
- Estado del cliente: `Activo` / `Inactivo`.

### 3. **Registro de Abonos y Movimientos**
- Registro de pagos (abonos) a préstamos activos.
- Historial detallado de movimientos (`Descripcion`), incluyendo:
  - Fecha
  - Monto abonado
  - Saldo restante
- Cálculo automático del saldo actual del préstamo.

### 4. **Liquidación y Reportes Diarios**
- Módulo de reporte para cobradores.
- Registra:
  - Total de abonos (`cobro`)
  - Total de nuevos préstamos (`prestamos`)
  - Gastos (`gastos`, `otrosGastos`)
  - Base inicial de efectivo (`base`)
  - Descuentos (`descuento`)
  - Efectivo ingresado (`efectivo`)
  - Diferencia entre lo esperado y lo recibido
- Consulta histórica de reportes por cobrador y fecha.

### 5. **Interfaz de Usuario**
- **Autenticación segura**
- Menú principal para acceder a todas las funciones.
- Secciones dedicadas:
  - `/cobro`: Gestion de cobradores
  - `/cliente`: Registro y edición de clientes
  - `/abono`: Módulo central de operaciones diarias:
    - Selección de cobrador
    - Navegación secuencial entre clientes
    - Registro de abonos
    - Creación/modificación de préstamos
    - Edición de datos del cliente
  - `/reporte`: Generación y consulta de liquidaciones diarias

---

## Tecnologías Utilizadas

| Componente | Tecnología | Detalles |
|-----------|------------|--------|
| **Backend** | TypeScript + [NestJS](https://nestjs.com/) | API REST, arquitectura modular |
| **Base de Datos** | PostgreSQL | Gestion mediante [Prisma ORM](https://www.prisma.io/) |
| **Frontend** | TypeScript + [React](https://react.dev/) | Interfaz interactiva y dinámica |
| **Estilos** | [Bootstrap](https://getbootstrap.com/) | Diseño responsivo y moderno |



## Configuración y Ejecución

### Backend
1. **Instalar dependencias**
    `cd backend`
   `npm install`

   Crea un archivo .env en backend/ con:
   `DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_bd"`

   Migra prisma usando 
   `npx prisma migrate dev`
   Inicia el servidor 
   `npm run start`


### Frontend
1. **Instalar dependencias**
   `cd Frontend`
   `npm install`

    Inicia el servidor
    `npm run dev`
