"use strict";

module.exports = {
  debug(...args) {
    if (process.env.NODE_ENV !== "test") console.debug(...args);
  },
  info(...args) {
    console.info(...args);
  },
  warn(...args) {
    console.warn(...args);
  },
  error(...args) {
    console.error(...args);
  },
};
