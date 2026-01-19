# Sistema de Gestión Agro - MVP

Este es un sistema de gestión de stock, logística y finanzas desarrollado a medida para administración de depósitos agrícolas.

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router)
- **UI Framework:** Shadcn UI
- **Database & Auth:** Supabase (PostgreSQL)
- **PDF Generation:** React-PDF
- **Icons:** Lucide React

## 🚀 Instalación y Setup

1.  **Clonar repositorio e instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno:**
    Crear un archivo `.env.local` en la raíz con las credenciales de Supabase:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
    ```

3.  **Correr el proyecto:**
    ```bash
    npm run dev
    ```

## 📂 Estructura de Base de Datos (Supabase)

El sistema cuenta con las siguientes tablas principales (ver script SQL en `/docs`):

- `products`: Catálogo de insumos (con trigger automático de stock).
- `movements`: Historial de entradas y salidas.
- `invoices`: Registro de facturas de compra (Cuentas Corrientes).
- `suppliers`: Base de proveedores.

## ✨ Funcionalidades Clave

1.  **Control de Stock:** Actualización automática mediante Triggers de SQL.
2.  **Generación de Remitos:** Creación de PDF para transporte legal.
3.  **Módulo Financiero:** Tracking de vencimientos de facturas y pagos parciales.
4.  **Seguridad:** Row Level Security (RLS) habilitado.

## 📝 Notas de Desarrollo

- **Mantine:** Se utiliza `@mantine/core` para todos los componentes visuales.
- **Fechas:** Se utiliza `dayjs` para el manejo de vencimientos.
- **PDF:** Los componentes de PDF están aislados para evitar errores de renderizado en el servidor (SSR).

---
Desarrollado para gestión privada.