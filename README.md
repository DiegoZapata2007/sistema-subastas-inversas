# 📉 Plataforma de Subastas Inversas en Vivo

### 🎓 Proyecto Técnico Full-Stack - Portafolio Académico SENATI

Este sistema implementa un modelo de negocio B2B de **subasta inversa** (licitación a la baja) enfocado en la contratación de servicios de infraestructura de redes y TI, donde los proveedores compiten disminuyendo sus cotizaciones en tiempo real.

## 🛠️ Stack Tecnológico Utilizado

* **Frontend:** React.js, Vite, CSS3 adaptativo.
* **Backend:** Node.js, Express, WebSockets (Socket.io).
* **Base de Datos:** PostgreSQL (Arquitectura Relacional de datos persistentes).

## 💡 Características Principales y Lógica de Negocio

* **Arquitectura Limpia:** Separación estricta entre la interfaz de usuario (Cliente) y el servidor (API REST).
* **Flujo en Tiempo Real:** Actualizaciones instantáneas en la pantalla al publicar solicitudes o registrar ofertas económicas competitivas mediante WebSockets, optimizando la experiencia de usuario (UI/UX).
* **Validación Automatizada:** Control algorítmico en el servidor para impedir ofertas por encima del presupuesto límite establecido (Regla de oro de la subasta inversa).

## ⚙️ Cómo Ejecutar el Proyecto Localmente

1. Clona este repositorio en tu computadora.
2. Abre la carpeta `backend`, configura tus credenciales de PostgreSQL en el archivo `.env`, ejecuta `npm install` y luego `npm run dev`.
3. Abre la carpeta `frontend`, ejecuta `npm install` y arranca la interfaz con `npm run dev`.
4. Ingresa a `http://localhost:5173/` en tu navegador.
