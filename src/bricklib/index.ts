import { system } from '@minecraft/server';

/**
 * Current version of bricklib.
 */
export const VERSION = '0.1.0-beta';

/* modules */
export { default as config } from './config.js';
export * from './command.js';
export * from './database.js';
export * from './events.js';
export * from './format.js';
export * from './glyphs.js';
export * from './server.js';
export * from './thread.js';
export * from './ticks.js';
export * from './utils.js';

/* Prevents the server from crashing. */
system.beforeEvents.watchdogTerminate.subscribe(ev => {
  ev.cancel = true;
  console.error('Watchdog: ' + ev.terminateReason);
});
