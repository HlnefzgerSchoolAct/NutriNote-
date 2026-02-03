/**
 * Development Logger Utility
 * Only logs in development environment, silent in production
 */

const isDev = process.env.NODE_ENV === "development";

export const devLog = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
};

export default devLog;
