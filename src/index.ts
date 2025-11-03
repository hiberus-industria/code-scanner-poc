/**
 * Main entry point for the application
 */

interface GreetingConfig {
  name: string;
  formal?: boolean;
}

/**
 * Generates a greeting message
 * @param config - Configuration for the greeting
 * @returns A greeting string
 */
function greet(config: GreetingConfig): string {
  const { name, formal = false } = config;
  if (formal) {
    return `Good day, ${name}. How do you do?`;
  }
  return `Hello, ${name}!`;
}

/**
 * Main application function
 */
function main(): void {
  const message = greet({ name: 'World' });
  // eslint-disable-next-line no-console
  console.log(message);

  const formalMessage = greet({ name: 'Distinguished Guest', formal: true });
  // eslint-disable-next-line no-console
  console.log(formalMessage);
}

// Run the application
main();
