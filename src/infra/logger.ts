import pino from 'pino';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  base: null,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
