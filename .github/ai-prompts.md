# AI Code Generation Prompts and Best Practices

This document contains curated prompts and examples to guide AI-assisted development in this project.

## General Development Prompts

### Creating New Modules

**Prompt Template:**
```
Create a new TypeScript module for [functionality] in src/[directory]/[filename].ts that:
- Follows strict TypeScript with explicit return types
- Uses ES modules with .js extensions in imports
- Implements error handling with custom error classes
- Includes JSDoc documentation for public APIs
- Is testable with dependency injection
- Follows the project's naming conventions
```

**Example:**
```
Create a new TypeScript module for exponential backoff retry logic in src/utils/backoff.ts that:
- Exports a RetryStrategy class with configurable max retries and base delay
- Uses strict TypeScript with explicit return types
- Includes JSDoc documentation
- Handles edge cases (negative values, zero retries)
```

### Refactoring Existing Code

**Prompt Template:**
```
Refactor [file/function] to:
- Improve type safety (remove any types, add explicit types)
- Follow the project's ESLint rules (no-console, prefer-const, etc.)
- Maintain backward compatibility
- Add proper error handling
- Keep changes minimal and focused
```

**Example:**
```
Refactor src/devices/hidReader.ts to:
- Extract the buffer parsing logic into a separate AsciiParser class
- Add proper TypeScript types for HID events
- Improve error handling for device disconnections
- Maintain the same public API
```

### Adding Features

**Prompt Template:**
```
Add [feature] that:
- Integrates with the existing architecture in src/[directory]
- Uses dependency injection for testability
- Follows conventional commits (feat: description)
- Validates all inputs
- Includes proper logging (no console.log)
- Handles errors gracefully
```

**Example:**
```
Add a device health monitoring feature that:
- Creates a new DeviceMonitor class in src/devices/monitor.ts
- Checks device status every 5 seconds
- Emits events on status changes
- Implements proper cleanup to avoid memory leaks
- Uses the existing logger from src/infra/logger.ts
```

### Bug Fixes

**Prompt Template:**
```
Fix the issue where [problem description]:
- Identify the root cause
- Make minimal changes to fix the issue
- Add validation to prevent future occurrences
- Follow conventional commits (fix: description)
- Update relevant JSDoc if needed
```

**Example:**
```
Fix the issue where USB reconnection fails after 3 attempts:
- Check the reconnection logic in src/devices/hidDiscovery.ts
- Ensure proper cleanup of previous device handles
- Add exponential backoff between retry attempts
- Log meaningful error messages for debugging
```

## TypeScript-Specific Prompts

### Type Definition

**Prompt:**
```
Create comprehensive TypeScript types for [domain concept] that:
- Use interface for object shapes
- Use type for unions, intersections, and utility types
- Export all types with PascalCase names
- Include JSDoc comments explaining the purpose
- Follow the project's strict type checking rules
```

**Example:**
```typescript
/**
 * Information about a connected HID barcode scanner device
 */
export interface DeviceInfo {
  /** USB Vendor ID (e.g., 0x0C2E for Honeywell) */
  vendorId: number;
  /** USB Product ID */
  productId: number;
  /** System-specific device path */
  path: string;
  /** Product name from device descriptor */
  product?: string;
  /** Manufacturer name from device descriptor */
  manufacturer?: string;
  /** Device serial number (for caching) */
  serialNumber?: string;
}
```

### Generic Types

**Prompt:**
```
Create a generic utility type/function for [purpose] that:
- Uses TypeScript generics with meaningful names
- Has proper type constraints
- Includes usage examples in JSDoc
- Handles edge cases with proper type guards
```

**Example:**
```typescript
/**
 * Retries an async operation with exponential backoff
 * @template T - The return type of the operation
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise resolving to the operation result
 * 
 * @example
 * const result = await retry(() => fetchData(), 3);
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries: number
): Promise<T> {
  // Implementation
}
```

## Architecture Prompts

### Creating Services

**Prompt:**
```
Create a new service class for [functionality] that:
- Follows the Single Responsibility Principle
- Uses constructor injection for dependencies
- Implements a clear public API
- Handles all error cases
- Is placed in the appropriate directory (devices/, transport/, infra/)
- Follows the naming pattern [Name]Service or [Name]Manager
```

### Event-Driven Design

**Prompt:**
```
Implement event-driven communication for [feature] that:
- Uses Node.js EventEmitter or custom event system
- Defines clear event types with TypeScript
- Documents all emitted events
- Handles event listener cleanup
- Prevents memory leaks
```

**Example:**
```typescript
export interface ScannerEvents {
  scan: (event: ScanEvent) => void;
  connected: (device: DeviceInfo) => void;
  disconnected: (deviceId: string) => void;
  error: (error: Error) => void;
}

export class HidScanner extends EventEmitter {
  // Strongly-typed emit and on methods
}
```

## Testing Prompts

### Unit Test Creation

**Prompt:**
```
Create unit tests for [module/function] that:
- Test happy path scenarios
- Test error conditions
- Test edge cases (empty inputs, null, undefined)
- Use mocks for dependencies
- Follow AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
```

**Example:**
```
Create unit tests for src/utils/backoff.ts that:
- Test successful retry after failures
- Test max retries exceeded scenario
- Test exponential delay calculation
- Test with zero and negative retry values
- Mock the operation to control success/failure
```

### Integration Test Creation

**Prompt:**
```
Create integration tests for [feature] that:
- Test the interaction between multiple components
- Use real dependencies where possible
- Mock only external systems (HTTP, database, hardware)
- Test realistic scenarios
- Include cleanup to prevent test pollution
```

## Documentation Prompts

### API Documentation

**Prompt:**
```
Document the public API of [module] with:
- JSDoc comments for all exported functions/classes
- Parameter descriptions with types
- Return value descriptions
- Throws clauses for possible errors
- Usage examples
- Links to related functions/types
```

### README Updates

**Prompt:**
```
Update README.md to document [feature] including:
- Brief description of the feature
- Configuration options
- Usage examples
- Common troubleshooting tips
- Links to relevant documentation
```

## Security Prompts

### Input Validation

**Prompt:**
```
Add input validation for [function/endpoint] that:
- Checks types and ranges
- Sanitizes string inputs
- Rejects invalid data with descriptive errors
- Logs validation failures
- Follows fail-fast principle
```

### Security Review

**Prompt:**
```
Review [module] for security issues including:
- SQL injection vulnerabilities (if applicable)
- XSS vulnerabilities (if applicable)
- Command injection risks
- Path traversal issues
- Sensitive data logging
- Unhandled errors leaking information
```

## Performance Prompts

### Optimization

**Prompt:**
```
Optimize [function/module] for performance by:
- Identifying bottlenecks
- Reducing unnecessary allocations
- Caching expensive computations
- Using appropriate data structures
- Maintaining code readability
- Measuring improvements with benchmarks
```

### Memory Management

**Prompt:**
```
Review [module] for memory leaks including:
- Event listener cleanup
- Timer cleanup (setInterval, setTimeout)
- File handle closure
- Stream cleanup
- WeakMap/WeakSet usage for caching
```

## Git and Version Control Prompts

### Commit Message Generation

**Prompt:**
```
Generate a conventional commit message for these changes:
[list changes]

The message should:
- Use one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Include scope if relevant (e.g., feat(devices): ...)
- Have a clear, concise description (50 chars max)
- Include body if needed for context
- Reference issue numbers if applicable
```

### Code Review

**Prompt:**
```
Review this code change for:
- Adherence to project coding standards
- Type safety and explicit types
- Error handling completeness
- Performance implications
- Security concerns
- Breaking changes
- Missing documentation
```

## Common Anti-Patterns to Avoid

### Don't Do This

```typescript
// ❌ Using any type
function process(data: any) {
  return data.value;
}

// ❌ Ignoring errors
try {
  riskyOperation();
} catch (e) {
  // Silently ignore
}

// ❌ Using console.log
console.log('Debug info:', data);

// ❌ Missing file extensions
import { config } from './config';

// ❌ Non-null assertion
const value = possiblyNull!.property;

// ❌ Unhandled promise
fetchData(); // Floating promise
```

### Do This Instead

```typescript
// ✅ Proper typing
function process(data: { value: string }): string {
  return data.value;
}

// ✅ Handle errors appropriately
try {
  riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  throw error;
}

// ✅ Use proper logging
import { logger } from './infra/logger.js';
logger.debug('Debug info:', data);

// ✅ Include file extensions
import { config } from './config.js';

// ✅ Type guards instead of assertions
if (possiblyNull && possiblyNull.property) {
  const value = possiblyNull.property;
}

// ✅ Handle promises
fetchData().catch((error) => logger.error('Fetch failed', error));
```

## AI Collaboration Tips

### Iterative Development

1. **Start Small**: Request small, focused changes
2. **Review**: Always review AI-generated code before committing
3. **Test**: Run linting, type checking, and tests after each change
4. **Refine**: Provide feedback and iterate on the solution

### Providing Context

When asking for help, include:
- The specific file or module you're working on
- The problem you're trying to solve
- Any relevant error messages or stack traces
- Expected vs. actual behavior
- Links to related code or documentation

### Example Good Prompt

```
I'm working on src/devices/hidReader.ts and need to handle device disconnection gracefully.

Currently, when the device is unplugged, the read() method throws an error and crashes the app.

Expected behavior: The reader should emit a 'disconnected' event and attempt to reconnect automatically.

The device info is stored in this.currentDevice (type DeviceInfo).
The reconnection logic exists in src/devices/hidDiscovery.ts.

Please update the error handling to:
1. Catch HID read errors
2. Emit 'disconnected' event
3. Call this.reconnect() method
4. Log the disconnection with logger.warn()
```

## Summary

When working with AI assistance on this project:

1. **Be Specific**: Clear, detailed prompts get better results
2. **Provide Context**: Include relevant information about the codebase
3. **Set Constraints**: Mention the coding standards and rules to follow
4. **Review Everything**: Always review and test AI-generated code
5. **Iterate**: Refine prompts based on the results
6. **Document**: Keep these prompts updated as the project evolves

Following these guidelines will help AI assistants generate code that seamlessly integrates with the project's standards and architecture.
