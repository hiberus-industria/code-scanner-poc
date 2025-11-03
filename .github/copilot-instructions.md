# GitHub Copilot Instructions

This document provides guidelines for GitHub Copilot to generate code that follows this project's standards and best practices.

## Project Overview

This is a **Node.js + TypeScript** project implementing a barcode scanner service for HID devices. The project emphasizes:

- **Type safety**: Strict TypeScript with comprehensive checks
- **Code quality**: ESLint with zero warnings tolerance
- **Consistent formatting**: Prettier with standardized rules
- **Conventional commits**: Enforced commit message format
- **Modern tooling**: Yarn Berry v4.10.3, Node.js v24.11.0

## TypeScript Guidelines

### Strict Type Checking

Always follow strict TypeScript practices as configured in `tsconfig.json`:

```typescript
// ✅ GOOD: Explicit types, no any
function processBarcode(code: string, deviceId: string): ScanEvent {
  return {
    code,
    deviceId,
    timestamp: new Date().toISOString(),
  };
}

// ❌ BAD: Using 'any' type
function processBarcode(code: any): any {
  return { code };
}
```

### Type Imports

Use inline type imports as configured in ESLint:

```typescript
// ✅ GOOD: Inline type imports
import { type DeviceInfo, type ScanEvent } from './types.js';

// ❌ BAD: Separate type import
import type { DeviceInfo } from './types.js';
import { ScanEvent } from './types.js';
```

### Function Return Types

Explicitly declare return types for functions (ESLint warns if missing):

```typescript
// ✅ GOOD: Explicit return type
function calculateTimeout(retries: number): number {
  return Math.min(1000 * Math.pow(2, retries), 30000);
}

// ⚠️ ALLOWED: Type expressions and inline functions
const handler = (event: Event) => console.log(event);
```

### No Unused Variables

Follow the pattern for intentionally unused parameters:

```typescript
// ✅ GOOD: Prefix with underscore
function setupDevice(_options: DeviceOptions): void {
  // Implementation doesn't use options yet
}

// ❌ BAD: Unused parameter without prefix
function setupDevice(options: DeviceOptions): void {
  // ESLint error if not used
}
```

### Avoid Non-Null Assertions

Do not use non-null assertions (`!`). Use proper type guards instead:

```typescript
// ✅ GOOD: Type guard
if (device && device.path) {
  openDevice(device.path);
}

// ❌ BAD: Non-null assertion
openDevice(device!.path);
```

### No Explicit Any

Never use `any` type. Use `unknown` when type is truly unknown:

```typescript
// ✅ GOOD: Using unknown with type guard
function parseData(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  throw new Error('Invalid data type');
}

// ❌ BAD: Using any
function parseData(data: any): string {
  return data;
}
```

## Code Style Guidelines

### Formatting (Prettier)

The project uses Prettier with these settings:

- **Line width**: 100 characters
- **Quotes**: Single quotes (`'`)
- **Semicolons**: Always required
- **Indentation**: 2 spaces (no tabs)
- **Trailing commas**: ES5 style (in arrays/objects, not in function parameters)
- **Arrow functions**: Always use parentheses around parameters
- **Line endings**: LF (Unix-style)

```typescript
// ✅ GOOD: Follows Prettier rules
const config = {
  timeout: 5000,
  retries: 3,
  exponentialBackoff: true,
};

const calculateDelay = (attempt: number): number => {
  return Math.pow(2, attempt) * 1000;
};

// ❌ BAD: Wrong style
const config = {
  timeout: 5000,
  retries: 3,
  exponentialBackoff: true
}

const calculateDelay = attempt => Math.pow(2, attempt) * 1000
```

### Console Statements

Only `console.warn` and `console.error` are allowed. Use proper logging for other cases:

```typescript
// ✅ GOOD: Using allowed console methods
console.warn('Device reconnection attempt failed');
console.error('Fatal error:', error);

// ❌ BAD: Using console.log
console.log('Debug message');

// ✅ GOOD: Use proper logger instead
import { logger } from './infra/logger.js';
logger.info('Device connected successfully');
```

### Equality Checks

Always use strict equality (`===` and `!==`):

```typescript
// ✅ GOOD: Strict equality
if (status === 'connected') {
  // ...
}

// ❌ BAD: Loose equality
if (status == 'connected') {
  // ESLint error
}
```

### Variable Declarations

Use `const` by default, `let` only when reassignment is needed. Never use `var`:

```typescript
// ✅ GOOD: Using const
const maxRetries = 5;
let currentRetry = 0;

// ❌ BAD: Using var
var maxRetries = 5;
```

## Module System

This project uses **ES Modules** (type: "module" in package.json):

### File Extensions

Always include `.js` extension in imports (even for `.ts` files):

```typescript
// ✅ GOOD: Includes .js extension
import { type DeviceInfo } from './types.js';
import { HidReader } from './devices/hidReader.js';

// ❌ BAD: Missing extension
import { DeviceInfo } from './types';
```

### Module Resolution

Project uses `NodeNext` module resolution. Follow these patterns:

```typescript
// ✅ GOOD: Relative imports with extension
import { config } from '../config/index.js';

// ✅ GOOD: Node built-ins don't need extensions
import { EventEmitter } from 'node:events';
import * as path from 'node:path';

// ✅ GOOD: External packages
import HID from 'node-hid';
```

## Commit Message Format

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer]
```

### Allowed Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring (no functional changes)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration
- **chore**: Other changes (maintenance, etc.)
- **revert**: Reverts a previous commit

### Examples

```bash
# ✅ GOOD: Clear, conventional commits
feat: add HID device auto-discovery
fix: resolve USB reconnection timeout issue
docs: update barcode scanner configuration guide
refactor: extract event bus to separate module
test: add unit tests for ASCII parser

# ✅ GOOD: With scope
feat(devices): implement exponential backoff for reconnection
fix(parser): handle empty scan codes correctly

# ❌ BAD: Not following convention
Added new feature
fixed bug
Update README
```

## Project Architecture

### Directory Structure

Follow the established architecture:

```
src/
├── main.ts                 # Application bootstrap
├── config/                 # Configuration management
│   └── index.ts
├── devices/                # HID device management
│   ├── hidDiscovery.ts    # Device enumeration and discovery
│   ├── hidReader.ts       # HID reading and ASCII parsing
│   └── posParser.ts       # Fallback POS parser
├── domain/                 # Domain models and types
│   └── models.ts
├── transport/              # Event publishing and health
│   ├── eventBus.ts
│   └── health.ts
├── infra/                  # Infrastructure concerns
│   ├── logger.ts          # Logging setup
│   └── storage.ts         # Persistence (device cache)
└── utils/                  # Utility functions
    └── backoff.ts         # Retry logic
```

### Naming Conventions

- **Files**: camelCase (e.g., `hidReader.ts`, `eventBus.ts`)
- **Classes**: PascalCase (e.g., `HidReader`, `EventBus`)
- **Interfaces/Types**: PascalCase (e.g., `DeviceInfo`, `ScanEvent`)
- **Functions/Variables**: camelCase (e.g., `calculateDelay`, `maxRetries`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)

```typescript
// ✅ GOOD: Following naming conventions
export const MAX_RETRY_ATTEMPTS = 10;

export interface DeviceConfig {
  vendorId: number;
  productId: number;
}

export class HidDeviceReader {
  private retryCount: number = 0;

  public async readBarcode(): Promise<string> {
    // Implementation
  }
}

// ❌ BAD: Inconsistent naming
const max_retry_attempts = 10;

interface deviceConfig {
  VendorID: number;
  product_id: number;
}

class hidDeviceReader {
  private RetryCount: number = 0;
}
```

## Error Handling

### Use Proper Error Types

```typescript
// ✅ GOOD: Specific error types
class DeviceNotFoundError extends Error {
  constructor(deviceId: string) {
    super(`Device not found: ${deviceId}`);
    this.name = 'DeviceNotFoundError';
  }
}

// ✅ GOOD: Type-safe error handling
try {
  await openDevice(deviceId);
} catch (error) {
  if (error instanceof DeviceNotFoundError) {
    logger.warn('Device not found, retrying...');
    return;
  }
  throw error;
}
```

### Avoid Silent Failures

```typescript
// ✅ GOOD: Log and handle errors appropriately
function processBarcode(code: string): ScanEvent | null {
  if (!code || code.trim().length === 0) {
    logger.warn('Received empty barcode');
    return null;
  }
  return { code, timestamp: new Date().toISOString() };
}

// ❌ BAD: Silent failure
function processBarcode(code: string): ScanEvent | null {
  if (!code) {
    return null; // No indication why it failed
  }
  return { code, timestamp: new Date().toISOString() };
}
```

## Asynchronous Code

### Use async/await

Prefer async/await over raw promises:

```typescript
// ✅ GOOD: async/await
async function connectDevice(deviceId: string): Promise<void> {
  try {
    await discovery.findDevice(deviceId);
    await reader.open(deviceId);
    logger.info('Device connected');
  } catch (error) {
    logger.error('Connection failed', error);
    throw error;
  }
}

// ❌ BAD: Promise chains
function connectDevice(deviceId: string): Promise<void> {
  return discovery
    .findDevice(deviceId)
    .then(() => reader.open(deviceId))
    .then(() => logger.info('Device connected'))
    .catch((error) => {
      logger.error('Connection failed', error);
      throw error;
    });
}
```

### Handle Promise Rejections

Always handle promise rejections, don't leave them floating:

```typescript
// ✅ GOOD: Handled promise
publishEvent(event).catch((error) => {
  logger.error('Failed to publish event', error);
  queueForRetry(event);
});

// ❌ BAD: Unhandled promise
publishEvent(event); // Will cause unhandled rejection if it fails
```

## Documentation

### JSDoc Comments

Add JSDoc comments for public APIs:

```typescript
/**
 * Discovers HID barcode scanner devices on the system
 * @param vendorId - Optional vendor ID filter (e.g., 0x0C2E for Honeywell)
 * @returns Array of discovered device information
 * @throws {Error} If HID enumeration fails
 */
export async function discoverDevices(vendorId?: number): Promise<DeviceInfo[]> {
  // Implementation
}
```

### Inline Comments

Use inline comments sparingly, only when code logic is not self-explanatory:

```typescript
// ✅ GOOD: Comment explains non-obvious business logic
// HID paths can change between USB reconnections, so we cache by serial number
const cachedPath = await storage.getDevicePath(serialNumber);

// ❌ BAD: Comment states the obvious
// Loop through devices
for (const device of devices) {
  // ...
}
```

## Testing Considerations

While this project doesn't have test infrastructure yet, write code that is testable:

```typescript
// ✅ GOOD: Testable - dependencies injected
export class EventPublisher {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly logger: Logger
  ) {}

  async publish(event: ScanEvent): Promise<void> {
    await this.httpClient.post('/events', event);
  }
}

// ❌ BAD: Hard to test - hard-coded dependencies
export class EventPublisher {
  async publish(event: ScanEvent): Promise<void> {
    await fetch('http://api.example.com/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }
}
```

## Performance Considerations

### Buffer Management

When working with HID data streams, manage buffers efficiently:

```typescript
// ✅ GOOD: Efficient buffer handling
class AsciiParser {
  private buffer: string = '';

  parse(chunk: Buffer): string[] {
    this.buffer += chunk.toString('ascii');
    const lines = this.buffer.split('\r');
    
    // Keep last incomplete line in buffer
    this.buffer = lines.pop() ?? '';
    
    return lines.filter((line) => line.length > 0);
  }
}
```

### Avoid Memory Leaks

Clean up event listeners and timers:

```typescript
// ✅ GOOD: Proper cleanup
export class DeviceMonitor {
  private checkInterval?: NodeJS.Timeout;

  start(): void {
    this.checkInterval = setInterval(() => this.checkDevice(), 5000);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }
}
```

## Security Considerations

### Input Validation

Always validate external input:

```typescript
// ✅ GOOD: Input validation
function validateBarcode(code: string): boolean {
  if (typeof code !== 'string') {
    return false;
  }
  
  // Validate reasonable length (1-100 characters)
  if (code.length < 1 || code.length > 100) {
    logger.warn('Barcode length out of range', { length: code.length });
    return false;
  }
  
  // Validate allowed characters (alphanumeric + common barcode symbols)
  if (!/^[A-Za-z0-9\-._/ ]+$/.test(code)) {
    logger.warn('Barcode contains invalid characters');
    return false;
  }
  
  return true;
}
```

### Avoid Logging Sensitive Data

```typescript
// ✅ GOOD: Sanitized logging
logger.info('Event published', {
  eventId: event.id,
  deviceId: maskDeviceId(event.deviceId),
});

// ❌ BAD: Potentially exposing sensitive data
logger.info('Event published', event);
```

## MCP (Model Context Protocol) Integration

### What is MCP?

MCP (Model Context Protocol) is an open protocol that enables secure connections between AI assistants and external data sources/tools. It's particularly useful for:

- Connecting to local development tools (linters, formatters, debuggers)
- Accessing project-specific documentation and APIs
- Integrating with build systems and test runners
- Providing real-time code intelligence

**Note**: MCP is an emerging technology. Verify the latest documentation and available servers at [modelcontextprotocol.io](https://modelcontextprotocol.io/) as implementations may evolve.

### Recommended MCP Servers for This Project

The following are examples of MCP servers that could enhance AI capabilities. Check availability and compatibility before implementation:

#### 1. Filesystem MCP Server
**Purpose**: Give AI context about project structure and files

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/code-scanner-poc"]
    }
  }
}
```

**Benefits**:
- AI can read project files directly
- Better understanding of codebase structure
- Can suggest changes based on existing patterns

#### 2. GitHub MCP Server
**Purpose**: Integrate with GitHub for issues, PRs, and repository management

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

**Benefits**:
- Create issues and PRs directly from AI conversations
- Reference existing issues in code suggestions
- Check commit history and PR reviews

#### 3. Git MCP Server
**Purpose**: Interact with local Git repository

```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/path/to/code-scanner-poc"]
    }
  }
}
```

**Benefits**:
- Check git status and diff
- Understand recent changes
- Suggest appropriate commit messages following conventional commits

#### 4. Memory MCP Server
**Purpose**: Provide persistent memory across AI sessions

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Benefits**:
- Remember project-specific decisions
- Track technical debt and TODOs
- Maintain context across multiple coding sessions

### Custom MCP Server Ideas

Consider building custom MCP servers for:

1. **ESLint/Prettier Integration**: Real-time linting feedback
2. **TypeScript Language Server**: Advanced type checking and refactoring
3. **Project Documentation**: Serve GUIDELINES.md and other project docs
4. **HID Device Simulator**: Test barcode scanner logic without hardware

### Configuration File

Create `.github/copilot-mcp.json` to configure MCP servers:

```json
{
  "version": "1.0.0",
  "servers": {
    "filesystem": {
      "enabled": true,
      "allowedPaths": [
        "/path/to/code-scanner-poc/src",
        "/path/to/code-scanner-poc/docs"
      ]
    },
    "github": {
      "enabled": true,
      "repository": "jblascoisazac/code-scanner-poc"
    }
  }
}
```

### Integration with GitHub Copilot Workspace

When using GitHub Copilot Workspace, MCP servers can:
- Provide context about coding standards (this file)
- Access linting/formatting tools
- Check test coverage
- Validate conventional commits
- Suggest architecture improvements based on GUIDELINES.md

## Summary

When generating code for this project, always:

1. ✅ Use strict TypeScript with explicit types
2. ✅ Follow Prettier formatting rules (100 chars, single quotes, semicolons)
3. ✅ Include `.js` extensions in imports
4. ✅ Use inline type imports
5. ✅ Avoid `any`, non-null assertions, and `console.log`
6. ✅ Use conventional commit format
7. ✅ Write self-documenting code with proper naming
8. ✅ Handle errors explicitly and appropriately
9. ✅ Validate inputs and avoid security issues
10. ✅ Consider using MCP servers for enhanced AI capabilities

This ensures code is maintainable, type-safe, and follows industry best practices while integrating seamlessly with the project's existing tooling and standards.
