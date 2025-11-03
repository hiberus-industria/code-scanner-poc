# code-scanner-poc

A professional Node.js + TypeScript project with modern ESLint, Prettier, and Yarn Berry configuration.

## Features

- **Node.js v24.11.0**: Version fixed via `.nvmrc`
- **Yarn Berry (v4.10.3)**: Modern package manager with zero-installs support (disabled)
- **TypeScript**: Robust configuration with strict type checking
- **ESLint**: Modern flat config (eslint.config.js) with TypeScript support
- **Prettier**: Code formatting with industry-standard rules
- **Git Hooks with Husky**: Automated code quality checks before commits
- **Conventional Commits**: Enforced commit message format with commitlint
- **Scripts**: Development, build, linting, and formatting scripts

## Prerequisites

- Node.js v24.11.0 (use nvm: `nvm use`)
- Corepack enabled (comes with Node.js 16.10+): `corepack enable`

## Installation

The project uses Yarn Berry (v4.10.3) as its package manager, which is locked via the `packageManager` field in `package.json`. This ensures all contributors use the same version.

```bash
# Corepack will automatically use the correct Yarn version
yarn install
```

If you don't have Corepack enabled:

```bash
corepack enable
yarn install
```

## Scripts

All scripts use Yarn Berry:

### Development

```bash
yarn dev
```

Runs the application in watch mode using tsx. Changes to source files will automatically restart the application.

### Build

```bash
yarn build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Start

```bash
yarn start
```

Runs the compiled application from the `dist/` directory. Make sure to build first.

### Linting

```bash
yarn lint
```

Runs ESLint with zero warnings tolerance.

```bash
yarn lint:fix
```

Automatically fixes linting issues where possible.

### Formatting

```bash
yarn format
```

Formats all TypeScript, JavaScript, and JSON files using Prettier.

```bash
yarn format:check
```

Checks if all files are formatted according to Prettier rules.

### Type Checking

```bash
yarn typecheck
```

Type-checks the project without emitting files.

## Project Structure

```
.
├── src/              # TypeScript source files
│   └── index.ts      # Main entry point
├── dist/             # Compiled output (generated)
├── .yarn/            # Yarn Berry cache (gitignored)
├── .yarnrc.yml       # Yarn configuration
├── yarn.lock         # Yarn dependency lockfile
├── .nvmrc            # Node version specification
├── tsconfig.json     # TypeScript configuration
├── eslint.config.js  # ESLint flat config
├── .prettierrc       # Prettier configuration
└── package.json      # Project dependencies and scripts
```

## Configuration

### Package Manager (Yarn Berry)

The project uses Yarn Berry v4.10.3 (LTS) with the following configuration:

- **Node Linker**: `node-modules` (most compatible, uses traditional node_modules)
- **Immutable Installs**: Disabled for development flexibility
- **Global Cache**: Disabled (local cache only)
- **Version Locking**: Via `packageManager` field in package.json

This ensures all contributors use the exact same Yarn version automatically.

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

1. Ensure you have Node.js v24.11.0 installed (`nvm use`)
2. Enable Corepack if not already enabled: `corepack enable`
3. Install dependencies: `yarn install`
4. Make changes to files in `src/`
5. Run `yarn dev` for live development
6. Run `yarn lint` to check for issues
7. Run `yarn format` to format code
8. Run `yarn build` to compile
9. Run `yarn start` to execute the compiled code

## Code Quality

This project enforces high code quality standards:

- **Type Safety**: Strict TypeScript with comprehensive checks
- **Linting**: ESLint with zero warnings tolerance
- **Formatting**: Automatic code formatting with Prettier
- **Consistency**: Standardized configuration across the project

### Git Hooks

The project uses Husky to enforce code quality standards automatically:

#### Pre-commit Hook

Before each commit, the following checks are automatically run on staged files:

- **ESLint**: Lints and auto-fixes JavaScript/TypeScript files
- **Prettier**: Formats code according to project rules

If any issues cannot be auto-fixed, the commit will be blocked until you resolve them.

#### Commit Message Hook

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer]
```

**Allowed types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (white-space, formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

**Examples:**

```bash
git commit -m "feat: add barcode scanner support"
git commit -m "fix: resolve USB reconnection issue"
git commit -m "docs: update installation instructions"
git commit -m "refactor: improve HID device discovery logic"
```

Invalid commit messages will be rejected before the commit is created.
