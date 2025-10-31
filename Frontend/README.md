# Proyecto de Gestión - React + Vite + TypeScript

Este proyecto ha sido creado como un ejemplo de aplicación de múltiples páginas (SPA con enrutamiento) utilizando las siguientes tecnologías:

*   **Framework:** React
*   **Build Tool:** Vite
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS
*   **Navegación:** React Router DOM

El objetivo es proporcionarte una estructura de proyecto completa para que puedas continuar tu aprendizaje.

## Estructura del Proyecto

La estructura de archivos sigue una convención estándar de React:

```
proyecto-gestion/
├── src/
│   ├── components/       # Componentes reutilizables (ej: AbonoForm)
│   │   └── AbonoForm.tsx
│   ├── pages/            # Componentes que representan páginas completas
│   │   ├── AbonoPage.tsx     # Contiene el componente AbonoForm (tu HTML convertido)
│   │   ├── ClientePage.tsx
│   │   ├── CobroPage.tsx
│   │   ├── LoginPage.tsx     # Página de inicio de sesión
│   │   ├── MenuPage.tsx      # Menú principal con las opciones
│   │   └── ReportePage.tsx
│   ├── App.tsx           # Configuración principal del enrutamiento (React Router)
│   ├── main.tsx          # Punto de entrada de la aplicación
│   └── index.css         # Archivo principal de estilos (incluye Tailwind)
├── tailwind.config.js    # Configuración de Tailwind CSS
├── postcss.config.js     # Configuración de PostCSS
└── package.json          # Lista de dependencias y scripts
```

## 🚀 Guía de Instalación y Uso

Sigue estos pasos para descargar, instalar y ejecutar el proyecto en tu computadora.

### 1. Requisitos Previos

Necesitas tener instalado **Node.js** (versión 18 o superior) en tu sistema. Esto incluye `npm` (Node Package Manager).

### 2. Descargar y Descomprimir

Descarga el archivo `proyecto-gestion.zip` que se adjunta y descomprímelo.

### 3. Instalar Dependencias

Abre tu terminal o línea de comandos, navega hasta la carpeta del proyecto (`proyecto-gestion`) y ejecuta el siguiente comando:

```bash
npm install
```

Este comando descargará todas las librerías necesarias (React, TypeScript, Tailwind, React Router, etc.).

### 4. Ejecutar el Proyecto

Una vez que las dependencias estén instaladas, puedes iniciar el servidor de desarrollo:

```bash
npm run dev
```

El servidor se iniciará y te proporcionará una URL (generalmente `http://localhost:5173`). Abre esta URL en tu navegador.

## 🔑 Acceso al Sistema

El sistema te dirigirá automáticamente a la página de **Login**.

*   **Usuario de Acceso Fácil:** `admin`
*   **Contraseña de Acceso Fácil:** `1234`

Una vez dentro, podrás navegar a la página de **Abono (Tu Página HTML)** para ver tu código convertido.

## 📝 Comentarios en el Código

Todos los archivos clave (`App.tsx`, `LoginPage.tsx`, `MenuPage.tsx`, `AbonoForm.tsx`) contienen **comentarios detallados en español** explicando:

*   La función de cada componente.
*   Cómo funciona el enrutamiento (`<Route>`, `<Link>`).
*   La lógica de simulación de login (`localStorage`).
*   Las conversiones realizadas del HTML original a JSX.

¡Mucha suerte con tu proyecto! Si tienes alguna duda sobre el código, no dudes en preguntar.

