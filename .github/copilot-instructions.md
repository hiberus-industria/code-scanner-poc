# Copilot Instructions for code-scanner-poc

## Tech Stack & Tooling

- **Runtime:** Node.js v24.11.0 (locked via `.nvmrc` - use `nvm use`)
- **Package Manager:** Yarn Berry v4.10.3 (via `packageManager` in `package.json` - Corepack enabled)
- **Type System:** TypeScript with **extremely strict** type checking
- **Module System:** ESM only (`"type": "module"`, `NodeNext` resolution)
- **Code Quality:** ESLint flat config + Prettier + Husky pre-commit hooks
- **Commit Messages:** Conventional Commits enforced via `commitlint`

## Development Workflow

```bash
# Install dependencies (Corepack automatically uses correct Yarn version)
yarn install

# Run in watch mode during development
yarn dev

# Check types, lint, and format before committing
yarn typecheck
yarn lint
yarn format

# Build for production
yarn build
```

**Critical:** Always use `yarn dev` for live development - it uses `tsx watch` for instant feedback.

## TypeScript Conventions

This project uses **ultra-strict TypeScript** - respect these settings in `tsconfig.json`:

```typescript
// ✅ Always provide explicit return types for functions
function greet(config: GreetingConfig): string {
  /* ... */
}

// ✅ Use type imports for type-only dependencies
import type { MyType } from './types.js';

// ✅ Handle optional array access (noUncheckedIndexedAccess)
const items = [1, 2, 3];
const first = items[0]; // Type: number | undefined
if (first !== undefined) {
  /* safe to use */
}

// ✅ Always use .js extensions in imports (ESM requirement)
import { helper } from './utils/helper.js';

// ❌ Never use 'any' - it's an error
// ❌ Never use non-null assertions (!) - they're errors
// ❌ Never leave unused variables/parameters (use _prefix if intentional)
```

**Key compiler flags enabled:**

- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns`
- `noPropertyAccessFromIndexSignature` + `noImplicitOverride`

## ESLint Rules

ESLint uses **flat config** (`eslint.config.js`) with type-aware linting:

```typescript
// ✅ Prefer type imports (enforced by @typescript-eslint/consistent-type-imports)
import type { MyType } from './types.js';

// ✅ Console.log is warned - use console.warn/error instead
console.warn('Warning message');
console.error('Error message');

// ✅ Explicit function return types required
export function calculate(value: number): number {
  /* ... */
}

// ✅ Use const for immutable bindings
const result = 42;

// ✅ Use === instead of == (eqeqeq rule)
if (value === null) {
  /* ... */
}
```

**Key rules:**

- `@typescript-eslint/explicit-function-return-type`: warn
- `@typescript-eslint/consistent-type-imports`: error
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/no-non-null-assertion`: error
- `no-console`: warn (allow warn/error)
- `prefer-const`: error
- `eqeqeq`: error

**Max warnings:** Zero tolerance (`--max-warnings 0`). Fix all warnings before committing.

## Code Style (Prettier)

- **Line width:** 100 characters
- **Quotes:** Single quotes
- **Semicolons:** Always
- **Trailing commas:** ES5 style
- **Indentation:** 2 spaces

Prettier runs automatically via `lint-staged` on commit. Format manually with `yarn format`.

## Git Workflow

**Conventional Commits required:**

```bash
# Feature: new functionality
git commit -m "feat: add user authentication"

# Fix: bug fixes
git commit -m "fix: resolve race condition in event handler"

# Docs: documentation only
git commit -m "docs: update API documentation"

# Refactor: code restructuring
git commit -m "refactor: extract validation logic to separate module"

# Chore: maintenance tasks
git commit -m "chore: update dependencies"
```

**Allowed commit types:**

- `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Pre-commit hooks** auto-run ESLint + Prettier on staged files via `lint-staged`. Commits are rejected if:

1. Linting fails or warnings exist
2. Commit message doesn't follow conventional format

## Project Structure

Current structure (minimal POC):

```
src/
└── index.ts              # Main entry point
```

When adding new modules, follow modular architecture principles with clear separation of concerns.
