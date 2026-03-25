# 🚜 El Tolar - Sistema de Logística y Administración Agrícola

Plataforma de gestión integral de nivel empresarial desarrollada para productores agropecuarios. El sistema digitaliza el control de stock, la logística de insumos y la administración financiera, integrando ahora la planificación productiva de lotes.

Reemplaza planillas dispersas y procesos manuales por una arquitectura centralizada, moderna y escalable con soporte para múltiples depósitos y operaciones en tiempo real.

---

## 🚀 Funcionalidades Principales

### 1. 📦 Logística y Control de Stock (Core)

- **Multi-Depósito:** Gestión de inventario dividido por ubicaciones físicas (Galpones).
- **Trazabilidad Total:** Registro detallado de Ingresos (compras/facturas) y Egresos (consumo/labores).
- **Remitos Digitales (PDF):** Generación automática de documentos de salida con formato profesional para transporte.
- **Alertas Inteligentes:** Notificaciones de "Stock Crítico" basadas en umbrales configurables por producto.

### 2. 💰 Módulo Financiero y Cuentas Corrientes

- **Gestión de Comprobantes:** Carga modular de facturas con soporte para Fecha de Emisión y Fecha de Vencimiento.
- **Multimoneda Dinámica:** Soporte nativo para ARS y USD con integración de cotización del dólar en tiempo real.
- **Control de Deuda:** Panel de KPIs con Deuda Total, Vencimientos del Mes y Deuda Exigible.
- **Digitalización:** Almacenamiento en la nube de comprobantes físicos (PDF/Imágenes).

### 3. 🌱 Planificación de Lotes (Módulo Agronómico)

- **Ciclo de Cultivos:** Seguimiento de campañas productivas desde la planificación hasta la cosecha.
- **Costos Directos:** Imputación automática de insumos retirados de stock al costo de cada lote.
- **Análisis de Rinde:** Cálculo de ROI y márgenes brutos por hectárea.

### 4. 📊 Dashboard de Operaciones

- **Agenda Agrícola:** Calendario visual de tareas, vencimientos de pagos y alertas de stock.
- **Contexto Operativo:** Integración con APIs de Clima local y cotizaciones financieras.
- **Modo Offline Aware:** Indicador visual de conectividad para asegurar la integridad de los datos en zonas rurales.

---

## 🛠 Tech Stack

Arquitectura moderna, tipada y escalable.

- **Frontend:** [Next.js 15](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **UI & Estilos:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Manejo de Formularios:** React Hook Form + Zod
- **Generación de PDF:** React-PDF (Renderizado cliente/servidor)
- **Iconos:** Lucide React
- **Utilidades:** Dayjs / Date-fns para manejo de fechas.

---

## 📂 Arquitectura del Proyecto

El proyecto sigue un patrón de _Modularización por Dominio_ para maximizar la mantenibilidad:

```
src/
 ├── app/             # Rutas y Layouts (Next.js)
 ├── features/        # Módulos de Negocio (Lógica encapsulada)
 │    ├── finance/    # Acciones, Hooks y Componentes de Finanzas
 │    ├── stock/      # Gestión de productos e inventario
 │    ├── moves/      # Lógica de movimientos y remitos
 │    └── dashboard/  # Widgets y KPIs del panel principal
 ├── shared/          # UI Components (Shadcn), Hooks globales y Libs
 └── lib/             # Clientes de Supabase y utilidades core
```

**Patrones aplicados:**

- **Modular UI:** Formularios complejos divididos en componentes atómicos (`InvoiceGeneralData`, `InvoiceItemsTable`).
- **Separación de Concernimientos:** La lógica de negocio reside en Custom Hooks (`useCreateInvoice`), desacoplada de la vista.
- **Server Actions:** Todas las mutaciones de datos se realizan mediante acciones del lado del servidor para mayor seguridad.

---

## 📂 Estructura de Base de Datos (Resumen)

El modelo de datos refleja los dos mundos del sistema: la logística y la producción.

- `products`: Catálogo maestro de insumos con control de stock.
- `movements`: Tabla transaccional de entradas y salidas.
- `warehouses`: Definición de depósitos físicos (Galpones).
- `invoices`: Cabecera de facturas y cuentas corrientes.
- `suppliers`: Base de datos de proveedores y contratistas.
- `lots` & `crop_cycles`: Definición de tierras y campañas productivas.

---

## ⚙️ Instalación y Configuración

**Clonar el repositorio:**

```bash
git clone https://github.com/tu-usuario/el-tolar-gestion.git
cd el-tolar-gestion
```

**Instalar dependencias:**

```bash
npm install
```

**Variables de Entorno (`.env.local`):**

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

**Configuración de Supabase:**

- Crear un bucket en Storage llamado `invoices` para los comprobantes.
- Asegurar que las políticas RLS estén activas para las tablas de negocio.

---

## 🔮 Roadmap

- [ ] **Sincronización Offline:** Caché local para permitir registros en zonas sin señal de celular.
- [ ] **Reportes en Excel:** Exportación masiva de movimientos para contabilidad externa.
- [ ] **Gestión de Maquinaria:** Seguimiento de horas/motor y mantenimiento preventivo.

---

_Desarrollado para la optimización de la cadena agroalimentaria de El Tolar SA. 🚜🌾_
