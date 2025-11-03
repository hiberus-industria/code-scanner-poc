# code-scanner-poc

PoC para escaneo de códigos de barras y QR usando dispositivos HID en Node.js con TypeScript.
Ver [GUIDELINES.md](./GUIDELINES.md) para consultar qué se pretende con este proyecto, estándares de calidad de código y flujo de trabajo.

## Características

- **Node.js v24.11.0**: Versión fijada mediante `.nvmrc`
- **Yarn Berry (v4.10.3)**: Gestor de paquetes moderno con soporte zero-installs (deshabilitado)
- **TypeScript**: Configuración robusta con verificación de tipos estricta
- **ESLint**: Configuración flat moderna (eslint.config.js) con soporte TypeScript
- **Prettier**: Formateo de código con reglas estándar de la industria
- **Git Hooks con Husky**: Comprobaciones automáticas de calidad de código antes de los commits
- **Conventional Commits**: Formato de mensajes de commit obligatorio con commitlint
- **Scripts**: Scripts de desarrollo, construcción, linting y formateo

## Requisitos previos

- Node.js v24.11.0
- Corepack habilitado (viene con Node.js 16.10+)

## Instalación

El proyecto usa Yarn Berry (v4.10.3) como gestor de paquetes, que está bloqueado mediante el campo `packageManager` en `package.json`. Esto asegura que todos los colaboradores usen la misma versión.

```bash
# Corepack usará automáticamente la versión correcta de Yarn
yarn install
```

Si no tienes Corepack habilitado:

```bash
corepack enable
yarn install
```

## Scripts

Todos los scripts usan Yarn Berry:

### Desarrollo

```bash
yarn dev
```

Ejecuta la aplicación en modo watch usando tsx. Los cambios en los archivos fuente reiniciarán automáticamente la aplicación.

### Construcción

```bash
yarn build
```

Compila TypeScript a JavaScript en el directorio `dist/`.

### Inicio

```bash
yarn start
```

Ejecuta la aplicación compilada desde el directorio `dist/`. Asegúrate de construir primero.

### Linting

```bash
yarn lint
```

Ejecuta ESLint con tolerancia cero a advertencias.

```bash
yarn lint:fix
```

Corrige automáticamente los problemas de linting donde sea posible.

### Formateo

```bash
yarn format
```

Formatea todos los archivos TypeScript, JavaScript y JSON usando Prettier.

```bash
yarn format:check
```

Verifica si todos los archivos están formateados según las reglas de Prettier.

### Verificación de tipos

```bash
yarn typecheck
```

Verifica los tipos del proyecto sin emitir archivos.

## Estructura del proyecto

```
.
├── src/              # Archivos fuente TypeScript
│   └── index.ts      # Punto de entrada principal
├── dist/             # Salida compilada (generada)
├── .yarn/            # Caché de Yarn Berry (gitignored)
├── .yarnrc.yml       # Configuración de Yarn
├── yarn.lock         # Archivo de bloqueo de dependencias de Yarn
├── .nvmrc            # Especificación de versión de Node
├── tsconfig.json     # Configuración de TypeScript
├── eslint.config.js  # Configuración flat de ESLint
├── .prettierrc       # Configuración de Prettier
└── package.json      # Dependencias y scripts del proyecto
```

## Configuración

### Gestor de paquetes (Yarn Berry)

El proyecto usa Yarn Berry v4.10.3 (LTS) con la siguiente configuración:

- **Node Linker**: `node-modules` (más compatible, usa node_modules tradicional)
- **Immutable Installs**: Deshabilitado para flexibilidad en desarrollo
- **Global Cache**: Deshabilitado (solo caché local)
- **Version Locking**: Mediante el campo `packageManager` en package.json

Esto asegura que todos los colaboradores usen exactamente la misma versión de Yarn automáticamente.

### TypeScript (tsconfig.json)

- Modo estricto habilitado
- Target ES2022
- Resolución de módulos NodeNext
- Source maps y declaraciones generados
- Flags de verificación de tipos exhaustivos

### ESLint (eslint.config.js)

- Formato de configuración flat moderno
- TypeScript-ESLint con reglas recomendadas
- Integración con Prettier
- Reglas personalizadas para calidad de código
- Linting con conciencia de tipos

### Prettier (.prettierrc)

- Ancho de línea de 100 caracteres
- Comillas simples
- Punto y coma
- Indentación de 2 espacios
- Comas finales (ES5)

## Flujo de trabajo de desarrollo

1. Asegúrate de tener Node.js v24.11.0 instalado (recomendado usar un gestor de versiones como nvm, fnm, etc.)
2. Habilita Corepack si no está ya habilitado: `corepack enable`
3. Instala las dependencias: `yarn install`
4. Haz cambios en los archivos de `src/`
5. Ejecuta `yarn dev` para desarrollo en vivo
6. Ejecuta `yarn lint` para verificar problemas
7. Ejecuta `yarn format` para formatear el código
8. Ejecuta `yarn build` para compilar
9. Ejecuta `yarn start` para ejecutar el código compilado

## Calidad de código

Este proyecto impone estándares de alta calidad de código:

- **Seguridad de tipos**: TypeScript estricto con verificaciones exhaustivas
- **Linting**: ESLint con tolerancia cero a advertencias
- **Formateo**: Formateo automático de código con Prettier
- **Consistencia**: Configuración estandarizada en todo el proyecto

### Git Hooks

El proyecto usa Husky para imponer estándares de calidad de código automáticamente:

#### Hook de pre-commit

Antes de cada commit, las siguientes comprobaciones se ejecutan automáticamente en los archivos modificados:

- **ESLint**: Hace linting y auto-corrige archivos JavaScript/TypeScript
- **Prettier**: Formatea el código según las reglas del proyecto

Si algún problema no puede corregirse automáticamente, el commit se bloqueará hasta que los resuelvas.

#### Hook de mensaje de commit

Todos los mensajes de commit deben seguir el formato [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <description>

[optional body]

[optional footer]
```

**Tipos permitidos:**

- `feat`: Una nueva funcionalidad
- `fix`: Una corrección de error
- `docs`: Cambios solo en la documentación
- `style`: Cambios que no afectan el significado del código (espacios en blanco, formateo, etc.)
- `refactor`: Cambio de código que no corrige un error ni añade una funcionalidad
- `perf`: Mejoras de rendimiento
- `test`: Añadir pruebas faltantes o corregir pruebas existentes
- `build`: Cambios en el sistema de construcción o dependencias
- `ci`: Cambios en archivos de configuración y scripts de CI
- `chore`: Otros cambios que no modifican archivos src o test
- `revert`: Revierte un commit anterior

**Ejemplos:**

```bash
git commit -m "feat: add barcode scanner support"
git commit -m "fix: resolve USB reconnection issue"
git commit -m "docs: update installation instructions"
git commit -m "refactor: improve HID device discovery logic"
```

Los mensajes de commit inválidos serán rechazados antes de que se cree el commit.
