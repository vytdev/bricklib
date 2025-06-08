/**
 * Bricklib -- A wrapper library built on top of Minecraft:
 * Bedrock Edition's scripting API.
 */

import { system } from '@minecraft/server';

/**
 * Current version of bricklib.
 */
export const VERSION = '0.1.0-beta';

/* modules */
export { default as config } from './config.js';
export * as command     from './command.js';
export * as database    from './database.js';
export * as events      from './events.js';
export * as format      from './format.js';
export * as forms       from './forms.js';
export * as glyphs      from './glyphs.js';
export * as locale      from './locale.js';
export * as logger      from './logger.js';
export * as plugin      from './plugin.js';
export * as rawtext     from './rawtext.js';
export * as server      from './server.js';
export * as thread      from './thread.js';
export * as ticks       from './ticks.js';
export * as utils       from './utils.js';

/* Prevents the server from crashing. */
system.beforeEvents.watchdogTerminate.subscribe(ev => {
  ev.cancel = true;
  console.error('Watchdog: ' + ev.terminateReason);
});
