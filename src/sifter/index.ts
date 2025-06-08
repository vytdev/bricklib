/**
 * Sifter -- A command parser.
 * This plugin is part of the bricklib project.
 */

import * as bricklib from '../bricklib/index.js';

export * from './parser.js';
export * from './state.js';
export type * from './types.ts';


bricklib.plugin.newPlugin('sifter', () => {
  /* no-op */
});
