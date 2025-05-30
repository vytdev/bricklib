import { Player } from '@minecraft/server';
import { CommandCallback, CommandManager } from '../command.js';
import { parseVerb } from './parser.js';
import { ArgTokenStream } from './tokens.js';
import type { CmdVerb, ParseResult } from './defs.ts';

export type * from './defs.ts';
export * from './parser.js';
export * from './tokens.js';
export * as parsers from './types.js';

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
  return parseVerb(def, toks, []);
}

/**
 * Make a command def that you can pass to
 * {@link CommandManager.registerCommand}.
 * @param def The command definition.
 * @param fn The callback.
 * @returns Array of args.
 * @example
 * ```ts
 * import * as bricklib from './bricklib/index.js';
 * const def = {
 *   id: 'echo',
 *   name: 'echo',
 *   args: [
 *     {
 *      id: 'text',
 *      type: bricklib.args.parsers.string(),
 *     }
 *   ]
 * };
 *
 * mgr.registerCommand(...bricklib.args.makeCommand(def, (args, src) => {
 *   src.sendMessage(args.text);
 *   return 0;
 * }));
 * ```
 */
export function makeCommand<T = any>(
    def: CmdVerb,
    fn: (args: ParseResult<T>, src: Player) => number
  ): [string[], CommandCallback]
{
  const out: [string[], CommandCallback] = [null, null];
  out[0] = [def.name];
  if (def.aliases)
    out[0] = out[0].concat(def.aliases);
  out[1] = (src, args) => {
      const result = parseCommand(def, args);
      return fn(result, src);
    };
  return out;
}
