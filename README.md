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

## AI-Assisted Development

This project includes comprehensive guidelines for using GitHub Copilot and other AI tools effectively while maintaining code quality and consistency.

### AI Guidelines and Configuration

The `.github/` directory contains several files to help AI tools understand and follow project standards:

- **[copilot-instructions.md](.github/copilot-instructions.md)**: Comprehensive guidelines covering TypeScript, code style, architecture, security, and best practices
- **[copilot.yml](.github/copilot.yml)**: GitHub Copilot configuration with quick reference to project rules
- **[ai-prompts.md](.github/ai-prompts.md)**: Ready-to-use prompt templates for common development tasks
- **[copilot-mcp.json](.github/copilot-mcp.json)**: Model Context Protocol (MCP) server configuration for advanced AI integration
- **[README.md](.github/README.md)**: Complete guide to using AI tools with this project

### Using GitHub Copilot

GitHub Copilot will automatically read the configuration files in `.github/` and provide suggestions that follow project standards. Key things Copilot knows about this project:

✅ **Strict TypeScript** with explicit return types and no `any`  
✅ **ES Modules** with `.js` extensions in imports  
✅ **Prettier formatting** (100 chars, single quotes, semicolons)  
✅ **ESLint rules** (zero warnings tolerance)  
✅ **Conventional commits** format  
✅ **Project architecture** and naming conventions  
✅ **Security best practices** and input validation  

### Quick Start with AI

1. **Read the guidelines**: Start with [.github/copilot-instructions.md](.github/copilot-instructions.md)
2. **Use prompt templates**: Reference [.github/ai-prompts.md](.github/ai-prompts.md) for common tasks
3. **Review suggestions**: Always review and test AI-generated code
4. **Follow standards**: Ensure code passes linting, type checking, and formatting

### Example AI Prompts

```
# Creating a new module
Create a TypeScript module for retry logic in src/utils/retry.ts that:
- Uses exponential backoff with configurable max retries
- Includes explicit return types and proper error handling
- Follows the project's ESLint and Prettier rules

# Refactoring code
Refactor src/devices/hidReader.ts to:
- Extract buffer parsing into a separate AsciiParser class
- Add proper TypeScript types for all functions
- Maintain backward compatibility

# Adding tests
Create unit tests for src/utils/backoff.ts that:
- Test happy path and error conditions
- Use descriptive test names following AAA pattern
- Mock dependencies appropriately
```

### MCP Integration (Advanced)

For enhanced AI capabilities, consider setting up Model Context Protocol (MCP) servers:

- **Filesystem Server**: Access project files and structure
- **GitHub Server**: Integrate with issues and pull requests
- **Git Server**: Interact with repository history
- **Memory Server**: Maintain context across sessions

See [.github/README.md](.github/README.md#mcp-server-setup) for detailed setup instructions.

### Best Practices

- ✅ Always review AI-generated code against project standards
- ✅ Run `yarn lint` and `yarn typecheck` after AI suggestions
- ✅ Use conventional commit messages
- ✅ Test all changes thoroughly
- ✅ Provide clear context when prompting AI tools
- ❌ Don't blindly accept suggestions without understanding them
- ❌ Don't skip code review for AI-generated code
- ❌ Don't bypass linting or type checking
