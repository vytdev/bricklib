/**
 * Sift -- A flexible command parser for bricklib.
 * This plugin is part of the bricklib project.
 */

/* TODO: help-text gen, cmd builder, and more type parsers... */

import * as bricklib from '../bricklib/index.js';
import { Player } from '@minecraft/server';
import { parseVerb } from './parser.js';
import { ArgTokenStream } from './tokens.js';
import type { CmdVerb, ParseResult } from './defs.ts';


export type * from './defs.ts';
export * from './parser.js';
export * from './tokens.js';
export * as parsers from './types.js';

bricklib.plugin.newPlugin('sift', () => {
  /* no-op */
});


/**
 * Parse a custom command.
 * @param def The command parsing definition.
 * @param args Array of token streams.
 * @returns The parsing result.
 * @throws This function can throw errors.
 */
export function parseCommand(def: CmdVerb, args: string[]): ParseResult
{
  const toks = new ArgTokenStream(args);
  toks.consume();      /* skip the command name */
  return parseVerb(def, toks, []);
}

/**
 * Make a command def that you can pass to
 * {@link bricklib.command.CommandManager.registerCommand}.
 * @param def The command definition.
 * @param fn The callback.
 * @returns Array of args.
 * @example
 * ```ts
 * import * as sift from './sift/index.js';
 * const def = {
 *   id: 'echo',
 *   name: 'echo',
 *   args: [
 *     {
 *      id: 'text',
 *      type: sift.parsers.string(),
 *     }
 *   ]
 * };
 *
 * mgr.registerCommand(...sift.makeCommand(def, (args, src) => {
 *   src.sendMessage(args.text);
 *   return 0;
 * }));
 * ```
 */
export function makeCommand<T = any>(
    def: CmdVerb,
    fn: (args: ParseResult<T>, src: Player) => number
  ): [string[], bricklib.command.CommandCallback]
{
  const out: [string[], bricklib.command.CommandCallback] = [null, null];
  out[0] = [def.name];
  if (def.aliases)
    out[0] = out[0].concat(def.aliases);
  out[1] = (src, args) => {
      const result = parseCommand(def, args);
      return fn(result, src);
    };
  return out;
}
