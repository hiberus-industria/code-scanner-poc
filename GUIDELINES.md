# POC: Implementación de lectura de códigos de barras

**Descripción:** Implementación de un servicio en segundo plano para la lectura de códigos de barras con el dispositivo Honeywell Voyager 1202g (lector láser 1D) + base CCB00-010BT. Aunque el objetivo final es la lectura de códigos 2D (QR/DataMatrix), el hardware disponible limita la POC a simbologías 1D (Code 128, Code 39, EAN, UPC). Se utilizarán protocolos estándares (HID Bar Code Scanner ASCII) para garantizar compatibilidad sin cambios en el código al migrar a hardware 2D (ej. imager Voyager 1450g/1470g) en fases futuras.

## 1. Alcance

**En el ámbito de la POC:**

- Lectura de códigos 1D.
- Ejecución en segundo plano sin interferir con el usuario.
- Emisión de eventos JSON a servicio externo (HTTP/MQTT/AMQP).
- Descubrimiento inteligente HID y reconexión automática.
- Logs y observabilidad básica (INFO/WARN/ERROR, conteo, health check).

**Fuera del ámbito:**

- Lectura 2D.
- UI gráfica (solo CLI/logs y `/health` opcional).
- Seguridad E2E más allá de configuración básica.

## 2. Modos de conexión del lector

El lector Honeywell 1202g se conecta mediante USB y expone diferentes perfiles de dispositivo según su configuración interna (programable vía códigos de barras o software Honeywell). La elección del perfil determina el protocolo de datos, la interacción con el sistema operativo y la capacidad de operar en background sin foco. A continuación se describen técnicamente los modos disponibles, con énfasis en su viabilidad para un servicio daemon multiplataforma y despliegue masivo.

### 2.1. HID Keyboard (Wedge)

- **Descripción técnica:** El lector se presenta como un **HID Keyboard Class Device**. Cada lectura se traduce a una secuencia de eventos de teclado (key down/up) que el sistema inyecta en la ventana con foco actual. El sufijo (CR/LF) se envía como `Enter`.
- **Ventajas:**
  - Integración inmediata con cualquier campo de texto.
  - No requiere drivers ni permisos especiales.
- **Desventajas para la POC:**
  - **Requiere foco activo** en una aplicación GUI.
  - **Interfiere con el usuario** (puede insertar datos en campos no deseados).
  - **No operable en background** ni como servicio sin UI.
  - **Imposible en entornos headless o kioscos sin foco controlado**.
- **Conclusión:** **Descartado** por incompatibilidad con ejecución daemon y no intrusiva.

### 2.2. HID Bar Code Scanner (ASCII) ✅ (modo seleccionado)

- **Descripción técnica:** El lector se presenta como un **HID Usage Page 0x8C (Bar Code Scanner)**, no como teclado. Envía **reportes HID de entrada** con datos en formato ASCII puro, delimitados por un sufijo configurable (por defecto `CR` = 0x0D). No se usan modificadores ni eventos de teclado.
- **Ventajas para la POC:**
  - **Operación 100% en background**: no requiere foco ni ventana.
  - **Baja latencia**: datos disponibles en <50ms tras escaneo.
  - **Formato simple**: texto plano + delimitador → fácil parsing con buffer + `\r`.
  - **Sin configuración de velocidad/paridad** (a diferencia de serial).
  - **Compatibilidad con 2D futura**: lectores imager 2D (como 1470g) usan el mismo perfil HID ASCII.
- **Desventajas:**
  - Requiere apertura explícita del dispositivo HID desde la aplicación (`node-hid`).
  - El `path` del dispositivo puede variar entre sesiones USB.
- **Mitigación:** Descubrimiento automático + caché de `path` por host.
- **Conclusión:** **Modo óptimo** para servicio en segundo plano, portabilidad y escalabilidad.

### 2.3. HID POS/OPOS (perfil POS puro)

- **Descripción técnica:** El lector se presenta como **HID POS Scanner** (Usage Page 0x8C con reportes estructurados). Cada lectura incluye un **prefijo AIM ID** (ej. `]C0` para Code 128), datos codificados y posible sufijo. Requiere parsing de reportes HID y, en algunos casos, envío de _feature reports_ para habilitar eventos.
- **Ventajas:**
  - Incluye **identificador de simbología** en el payload.
  - Estándar en entornos TPV (OPOS/JPOS).
- **Desventajas para la POC:**
  - **Mayor complejidad de parsing** (AIM ID, longitud variable).
  - **Posible necesidad de feature reports** para activar flujo de datos.
  - **No aporta valor** si la simbología se infiere por heurística o no es crítica.
  - **Riesgo de configuración inconsistente** entre dispositivos.
- **Conclusión:** **No seleccionado**. Se mantiene `posParser.ts` como fallback defensivo.

### 2.4. USB CDC/ACM (serial virtual / COM)

- **Descripción técnica:** El lector expone un **puerto COM virtual** (clase CDC-ACM). Los datos se envían como flujo binario a una velocidad fija (ej. 115200 baud, 8N1), con delimitador configurable.
- **Ventajas:**
  - Fácil depuración con herramientas como PuTTY o `screen`.
  - Soporta comandos bidireccionales (ej. configuración remota).
- **Desventajas para la POC:**
  - **Gestión manual de puerto** (COM3, COM5, etc.) → cambia al reconectar.
  - **Configuración de baud/stop/parity** requerida.
  - **Hotplug menos robusto** en Windows (necesita polling o eventos WMI).
  - **No multiplataforma sin abstracción adicional**.
- **Conclusión:** **Descartado** por fragilidad en entornos industriales con reconexiones frecuentes.

**Decisión final:** **HID Bar Code Scanner (ASCII)** es el modo seleccionado por su simplicidad técnica, robustez en background, baja latencia y compatibilidad directa con hardware 2D futuro. Permite una arquitectura limpia basada en `node-hid` + buffer de líneas, sin dependencias de sistema operativo más allá del acceso HID.

## 3. Requisitos funcionales

1. **Lectura en background:** Servicio/daemon sin UI ni foco.
2. **Detección automática:** Identificar y abrir HID sin hardcodear paths.
3. **Recepción de lecturas:** Procesar ASCII delimitado por CR/LF.
4. **Publicación de eventos:** Por lectura, payload mínimo: `{ code, symbology?, timestamp, deviceId }`.
5. **Reintentos:** En fallos del servicio destino.
6. **Reconexión automática:** Ante desconexiones/hotplug.
7. **Logs:** Trazabilidad de lecturas, errores y reconexiones.

## 4. Requisitos no funcionales

- **Tecnologías:** Node.js LTS, TypeScript, Yarn.
- **Arquitectura:** Modular, mantenible, separación de capas (ver sección 6).
- **Portabilidad:** Windows (principal), Linux (opcional).
- **Instalación como servicio:** Windows (script), Linux (systemd/PM2 opcional).
- **Observabilidad:** Métricas básicas o `/health` HTTP local (opcional).

## 5. Criterios de aceptación

- **CA-1:** Detección automática y lecturas <200ms en 3 PCs distintos.
- **CA-2:** Operación sin inyección de teclado ni foco requerido.
- **CA-3:** 10 reconexiones simuladas sin intervención.
- **CA-4:** >99.5% éxito en 500 escaneos Code 128 impresos.
- **CA-5:** 500 eventos publicados con reintentos ante cortes.
- **CA-6:** Documentación y scripts de despliegue entregados.

## 6. Arquitectura propuesta

```
app/
├─ src/
│  ├─ main.ts               # Bootstrap y DI ligera
│  ├─ config/
│  │   └─ index.ts          # Carga .env / defaults (broker URL, timeouts)
│  ├─ devices/
│  │   ├─ hidDiscovery.ts   # Enumeración HID, heurística, caché paths
│  │   ├─ hidReader.ts      # Apertura HID, lectura ASCII + CR/LF
│  │   └─ posParser.ts      # Fallback parser AIM ID
│  ├─ domain/
│  │   └─ models.ts         # Tipos: ScanEvent, DeviceInfo, Metrics
│  ├─ transport/
│  │   ├─ eventBus.ts       # Salida HTTP/MQTT/AMQP con cola/reintentos
│  │   └─ health.ts         # Endpoint /health (opcional)
│  ├─ infra/
│  │   ├─ logger.ts         # Pino/winston
│  │   └─ storage.ts        # Caché JSON paths por host
│  └─ utils/
│      └─ backoff.ts        # Reintentos exponenciales
├─ test/                    # Pruebas unitarias/mocks
├─ .env.example             # Configuración ejemplo
└─ package.json
```

**Puntos clave:**

- **`hidDiscovery`:** `node-hid` + heurísticas (VID 0C2E, "barcode"); apertura paralela; caché JSON.
- **`hidReader`:** Buffer + split por `\r`; evento `onScan`.
- **`eventBus`:** Pluggable; HTTP POST por defecto; cola en memoria + backoff.

**Tipos mínimos (TypeScript):**

```ts
export type DeviceInfo = {
  vendorId: number;
  productId: number;
  path: string;
  product?: string;
  manufacturer?: string;
};
export type ScanEvent = { code: string; symbology?: string; deviceId: string; ts: string };
```

**Secuencia:**

1. `main` → `hidDiscovery.resolve()` → `DeviceInfo`.
2. `hidReader.open(device)` → eventos `scan`.
3. `eventBus.publish(ScanEvent)` → retry/cola.

## 7. Configuración del lector

- **Interfaz:** USB HID Bar Code Scanner (no Keyboard/POS).
- **Sufijo:** CR (0x0D).
- **Code ID:** Deshabilitado.
- **Simbologías:** Code 128, Code 39, EAN, UPC.
- **Reinicio:** Desconectar/reconectar base tras cambios.

## 8. Contrato de eventos (payload)

```json
{
  "code": "6JUN495097156253924763",
  "symbology": "code128",
  "deviceId": "VID_0C2E_PID_0A27_MI00",
  "ts": "2025-10-31T10:15:30.123Z"
}
```

## 9. Entregables

1. Repositorio TS + tests + README.
2. Scripts Yarn: `dev`, `build`, `start`, `test`.
3. `.env.example`.
4. Instalación como servicio (Windows/Linux).
5. Resultados de pruebas (CA-1 a CA-6).

## 10. Plan de pruebas

- 500 escaneos Code 128 → latencia.
- 10 ciclos hotplug.
- 3 PCs → caché paths.
- Fallos de red → reintentos.
- 5 escaneos rápidos → orden/duplicados.

## 11. Dependencias sugeridas

- `node-hid`, `pino`, `axios`/`undici`, `dotenv`, `zod`, `ts-node`, `typescript`.

## 12. Riesgos y mitigaciones

- **HID POS residual:** Reenumerar USB tras configuración.
- **Permisos Linux:** Reglas udev.
- **Path variable:** Caché + descubrimiento.
- **1D en pantallas:** Imprimir códigos; 2D en futuro.

## 13. Criterio de go/no-go

- Lectura estable, sin interferencia, eventos fiables.
- Código modular, documentado, desplegable.

## 14. Anexos

**Checklist:**

1. Conectar base + lector.
2. Escanear perfil HID Bar Code Scanner + CR.
3. `yarn dev` → logs.
4. Instalar servicio → arranque auto.

**Migración 2D:** Cambiar hardware → mismo código (HID ASCII).
