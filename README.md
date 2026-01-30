# 🚜 AgroGestión - Sistema de Logística y Administración Agrícola

Plataforma de gestión integral desarrollada a medida para productores agropecuarios. El sistema nació con el objetivo principal de digitalizar el control de stock en galpones y la logística de insumos, evolucionando para integrar módulos financieros y, recientemente, la planificación productiva de lotes.

Reemplaza el uso de planillas dispersas y talonarios manuales por una interfaz centralizada, moderna y con soporte para múltiples depósitos.

## 🚀 Funcionalidades Principales

### 1. 📦 Logística y Control de Stock (Core)

El corazón del sistema. Permite saber exactamente qué hay en cada galpón y cómo se mueve.

- **Multi-Depósito:** Gestión de inventario dividido por ubicaciones físicas (Galpones).
- **Movimientos:** Registro de Ingresos (compras con factura) y Egresos (consumo/venta).
- **Remitos Digitales (PDF):** Generación automática de remitos de salida con formato legal para transporte, listos para imprimir o enviar.
- **Alertas:** Notificaciones automáticas de "Bajo Stock" para reposición de insumos críticos.

### 2. 💰 Módulo Financiero y Compras

Administración de cuentas corrientes con proveedores y flujo de caja.

- **Registro de Facturas:** Carga de comprobantes de compra que alimentan la deuda.
- **Gestión de Deuda:** Visualización clara de Deuda Total, Vencimientos del Mes y Deuda Exigible (Vencida).
- **Multimoneda:** Soporte para seguimiento de cuentas y pagos en Pesos (ARS) y Dólares (USD).
- **Historial de Pagos:** Tabla detallada con estado (Pendiente/Pagado), fechas de vencimiento, proveedor y funcionalidad para marcar facturas como pagadas.

### 3. 📊 Dashboard y Panel de Control

Un centro de mando para el día a día del productor.

- **Agenda/Calendario:** Organización visual de tareas, vencimientos y fechas clave.
- **Información en Tiempo Real:** Integración con APIs externas para mostrar Clima (ubicación actual) y Cotización del Dólar (Oficial/Blue).
- **KPIs:** Tarjetas de resumen con deuda pendiente, alertas de stock y valoración del capital inmovilizado.
- **Personalización:** Soporte nativo para Tema Claro y Oscuro según preferencia del usuario.

### 4. 🌱 Planificación y Gestión de Lotes (Nuevo)

Módulo agronómico para el seguimiento de la producción (en integración progresiva con stock y finanzas).

- **Ciclo de Cultivos:** Trazabilidad de campañas (Planificado, En Curso, Cosechado).
- **Costos y Labores:** Imputación de labores e insumos a lotes específicos para calcular el costo de producción.
- **Análisis de Margen:** Cierre de campaña con cálculo de Rinde (Tn/Ha), Ingreso Bruto y ROI por lote.

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

## 📂 Estructura de Base de Datos (Resumen)

El modelo de datos refleja los dos mundos del sistema: la logística y la producción.

- `products`: Catálogo maestro de insumos con control de stock.
- `movements`: Tabla transaccional de entradas y salidas.
- `warehouses`: Definición de depósitos físicos (Galpones).
- `invoices`: Cabecera de facturas y cuentas corrientes.
- `suppliers`: Base de datos de proveedores y contratistas.
- `lots` & `crop_cycles`: Definición de tierras y campañas productivas.
- `labors`: Registro de actividades a campo.

---

## 🚀 Instalación y Setup

1.  **Clonar repositorio:**

    ```bash
    git clone [https://github.com/tu-usuario/agro-gestion.git](https://github.com/tu-usuario/agro-gestion.git)
    ```

2.  **Instalar dependencias:**

    ```bash
    npm install
    ```

3.  **Variables de Entorno:**
    Configurar `.env.local` con las credenciales de Supabase y APIs externas (Clima/Dólar):

    ```bash
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    ```

4.  **Correr el proyecto:**
    ```bash
    npm run dev
    ```

---

## 🔮 Roadmap / Próximos Pasos

- **Integración Finanzas-Lotes:** Unificar el costo de las labores cargadas en el módulo de Lotes con el flujo de caja del módulo Financiero.
- **Reportes Avanzados:** Exportación de movimientos de stock a Excel.

---

_Desarrollado para gestión privada eficiente._ 🚜🌾
