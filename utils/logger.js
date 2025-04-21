// utils/logger.js
import winston from 'winston';

// Determine log level based on environment, default to 'info'
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Log stack traces
    winston.format.splat(),
    winston.format.json() // Log in JSON format for production/parsing
  ),
  defaultMeta: { service: 'astrology-backend' },
  transports: [
    // Console transport - format differently for development for readability
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          // Optionally include metadata if present
          if (metadata && Object.keys(metadata).length > 0 && metadata.constructor === Object) {
             // Avoid logging the defaultMeta 'service' key repeatedly if not needed
             const metaString = JSON.stringify(metadata, (key, value) => key === 'service' ? undefined : value);
             if (metaString !== '{}') {
                 msg += ` ${metaString}`;
             }
          }
          if (stack) {
            msg += `\n${stack}`;
          }
          return msg;
        })
      ),
      level: logLevel // Use the determined log level
    }),

    // --- Optional File Transports for Production ---
    // Uncomment and configure if needed
    // new winston.transports.File({
    //   filename: 'logs/error.log',
    //   level: 'error',
    //   maxsize: 5242880, // 5MB
    //   maxFiles: 5,
    // }),
    // new winston.transports.File({
    //   filename: 'logs/combined.log',
    //   maxsize: 5242880, // 5MB
    //   maxFiles: 5,
    // }),
  ],
  // Do not exit on handled exceptions
  exitOnError: false,
});

// Create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: (message) => {
    // Use the 'info' level for HTTP request logging
    logger.info(message.trim());
  },
};


export default logger;
