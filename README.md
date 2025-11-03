# code-scanner-poc

A professional Node.js + TypeScript project with modern ESLint and Prettier configuration.

## Features

- **Node.js v24.11.0**: Version fixed via `.nvmrc`
- **TypeScript**: Robust configuration with strict type checking
- **ESLint**: Modern flat config (eslint.config.js) with TypeScript support
- **Prettier**: Code formatting with industry-standard rules
- **Scripts**: Development, build, linting, and formatting scripts

## Prerequisites

- Node.js v24.11.0 (use nvm: `nvm use`)

## Installation

```bash
npm install
```

## Scripts

### Development

```bash
npm run dev
```

Runs the application in watch mode using tsx. Changes to source files will automatically restart the application.

### Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Start

```bash
npm start
```

Runs the compiled application from the `dist/` directory. Make sure to build first.

### Linting

```bash
npm run lint
```

Runs ESLint with zero warnings tolerance.

```bash
npm run lint:fix
```

Automatically fixes linting issues where possible.

### Formatting

```bash
npm run format
```

Formats all TypeScript, JavaScript, and JSON files using Prettier.

```bash
npm run format:check
```

Checks if all files are formatted according to Prettier rules.

### Type Checking

```bash
npm run typecheck
```

Type-checks the project without emitting files.

## Project Structure

```
.
├── src/              # TypeScript source files
│   └── index.ts      # Main entry point
├── dist/             # Compiled output (generated)
├── .nvmrc            # Node version specification
├── tsconfig.json     # TypeScript configuration
├── eslint.config.js  # ESLint flat config
├── .prettierrc       # Prettier configuration
└── package.json      # Project dependencies and scripts
```

## Configuration

### TypeScript (tsconfig.json)

- Strict mode enabled
- ES2022 target
- NodeNext module resolution
- Source maps and declarations generated
- Comprehensive type checking flags

### ESLint (eslint.config.js)

- Modern flat config format
- TypeScript-ESLint with recommended rules
- Prettier integration
- Custom rules for code quality
- Type-aware linting

### Prettier (.prettierrc)

- 100 character line width
- Single quotes
- Semicolons
- 2-space indentation
- Trailing commas (ES5)

## Development Workflow

1. Make changes to files in `src/`
2. Run `npm run dev` for live development
3. Run `npm run lint` to check for issues
4. Run `npm run format` to format code
5. Run `npm run build` to compile
6. Run `npm start` to execute the compiled code

## Code Quality

This project enforces high code quality standards:

- **Type Safety**: Strict TypeScript with comprehensive checks
- **Linting**: ESLint with zero warnings tolerance
- **Formatting**: Automatic code formatting with Prettier
- **Consistency**: Standardized configuration across the project
