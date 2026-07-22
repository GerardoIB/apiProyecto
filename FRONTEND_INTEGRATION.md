# Guía de Integración Frontend ⚛️ 🔌 💧

Esta guía explica cómo conectar el proyecto frontend `WereableWater` (React + Vite) con el backend `wereablewater-api` (Express + Prisma + MySQL).

---

## 📌 Resumen de Cambios

| Módulo | En Modo Demo (Anterior) | Con el Backend Real (Actual) |
|--------|-------------------------|-------------------------------|
| **Autenticación** | `localStorage` con usuarios ficticios | JWT mediante `POST /api/auth/login` y `POST /api/auth/register` |
| **Cabeceras HTTP** | Ninguna o API key local | `Authorization: Bearer <jwt_token>` en todas las peticiones protegidas |
| **Gestión de Dispositivos** | Lista estática de tinacos | API `/api/devices` (vincular con `claimCode`, listar, rotar token, revocar) |
| **Telemetría / Dashboard** | Polling simulación o MQTT directo público | Queries a `/api/nivel`, `/api/estado`, `/api/historial` y `/api/config` filtrados por usuario |

---

## ⚙️ 1. Configuración de Variables de Entorno (`.env`) en el Frontend

En el proyecto del frontend (`WereableWater`), crea o actualiza tu archivo `.env`:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_DEMO_MODE=false
```

---

## 🔐 2. Autenticación (`AuthContext.jsx` / `apiClient.js`)

### Cliente HTTP Centralizado (`src/services/apiClient.js`)

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('ww_jwt_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('ww_jwt_token');
    window.location.href = '/login';
    throw new Error('Sesión expirada o no autorizada');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
}
```

### Funciones de Login y Registro (`src/services/auth.js`)

```javascript
import { fetchWithAuth } from './apiClient';

export async function loginUser(email, password) {
  const data = await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  // Guardar JWT en localStorage
  localStorage.setItem('ww_jwt_token', data.token);
  return data.user;
}

export async function registerUser(name, email, password) {
  const data = await fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

  localStorage.setItem('ww_jwt_token', data.token);
  return data.user;
}

export async function getCurrentUser() {
  return await fetchWithAuth('/auth/me');
}
```

---

## 📱 3. Gestión de Dispositivos (`src/services/devices.js`)

```javascript
import { fetchWithAuth } from './apiClient';

// Vincular nuevo dispositivo usando el código QR / claimCode
export async function claimDevice(claimCode, name) {
  // Retorna { device, deviceToken } -> Mostrar deviceToken al usuario 1 SOLA VEZ
  return await fetchWithAuth('/devices/claim', {
    method: 'POST',
    body: JSON.stringify({ claimCode, name }),
  });
}

// Obtener mis dispositivos
export async function getMyDevices() {
  return await fetchWithAuth('/devices');
}

// Obtener detalle + última lectura
export async function getDeviceDetail(deviceId) {
  return await fetchWithAuth(`/devices/${deviceId}`);
}

// Rotar token del dispositivo (en caso de compromiso de seguridad)
export async function rotateDeviceToken(deviceId) {
  return await fetchWithAuth(`/devices/${deviceId}/rotate-token`, {
    method: 'POST',
  });
}

// Desvincular dispositivo
export async function revokeDevice(deviceId) {
  return await fetchWithAuth(`/devices/${deviceId}`, {
    method: 'DELETE',
  });
}
```

---

## 📊 4. Consumo de Lecturas en el Dashboard (`src/services/readings.js`)

```javascript
import { fetchWithAuth } from './apiClient';

// Obtener estado actual (nivel, bomba, lastSeenAt)
export async function getEstadoDispositivo(deviceId) {
  return await fetchWithAuth(`/estado?deviceId=${deviceId}`);
}

// Obtener historial de lecturas para la gráfica
export async function getHistorialLecturas(deviceId, from, to) {
  let url = `/historial?deviceId=${deviceId}`;
  if (from) url += `&from=${encodeURIComponent(from)}`;
  if (to) url += `&to=${encodeURIComponent(to)}`;
  return await fetchWithAuth(url);
}

// Obtener configuración de umbrales del tinaco
export async function getConfigDispositivo(deviceId) {
  return await fetchWithAuth(`/config?deviceId=${deviceId}`);
}

// Actualizar umbrales
export async function updateConfigDispositivo(deviceId, configData) {
  return await fetchWithAuth(`/config?deviceId=${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify(configData),
  });
}
```

---

## 🔄 5. Estrategia de Actualización en Tiempo Real

Para reflejar los cambios de nivel de agua en el Dashboard del usuario, el frontend puede utilizar dos enfoques:

1. **Polling HTTP con Polling (Simple & Eficiente):**
   ```javascript
   useEffect(() => {
     if (!selectedDeviceId) return;

     const interval = setInterval(async () => {
       const estado = await getEstadoDispositivo(selectedDeviceId);
       setNivelActual(estado.nivel);
       setBombaActiva(estado.bomba);
       setLastSeen(estado.lastSeenAt);
     }, 5000); // Consulta cada 5 segundos

     return () => clearInterval(interval);
   }, [selectedDeviceId]);
   ```

2. **Suscripción MQTT WebSockets (Opcional):**
   Si se habilita el listener de WebSockets en Mosquitto (`listener 9001` con `protocol ws`), la app React puede conectarse vía MQTT.js directo al broker al topic `wereablewater/${deviceId}/telemetry`.

---

## ✅ Checklist de Validación

- [ ] ¿El registro crea el usuario en MySQL y devuelve un JWT válido?
- [ ] ¿El login rechaza contraseñas incorrectas y guarda el JWT en `localStorage`?
- [ ] ¿La pantalla de Vincular Dispositivo acepta `DEMO0001` y muestra el `deviceToken` una única vez?
- [ ] ¿El Dashboard muestra la información del dispositivo seleccionado únicamente si pertenece al usuario en sesión?
