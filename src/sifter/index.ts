/**
 * Sifter -- A command parser.
 * This plugin is part of the bricklib project.
 */

import { Player } from '@minecraft/server';
import * as bricklib from '../bricklib/index.js';
import { parseVerb } from './parser.js';
import { ParseContext, ParseResult } from './state.js';
import type { CmdVerb } from './types.ts';

export * from './parser.js';
export * from './state.js';
export * from './transforms.js';
export type * from './types.ts';


bricklib.plugin.newPlugin('sifter', () => {
  /* no-op */
});


/**
 * Parse a command definition.
 * @param cmdDef The parsing rules.
 * @param args The tokenized arguments.
 * @returns The parsing result.
 */
export function parseCommand(cmdDef: CmdVerb, args: string[]): ParseResult
{
  const ctx = new ParseContext(args);
  ctx.consumeToken();     /* skip the first arg (name of the cmd) */
  const res = new ParseResult();
  parseVerb(ctx, res, cmdDef);
  return res;
}

/**
 * Register a custom command using sifter as its parser.
 * @param mgr The bricklib custom command manager.
 * @param cmdDef The command parsing definition.
 * @param fn The callback function.
 * @returns The registered names for the cmd.
 */
export function registerCommand(
    mgr: bricklib.command.CommandManager, cmdDef: CmdVerb,
    fn: (args: ParseResult, src: Player) => number): string[]
{
  let names = [cmdDef.name];
  if (cmdDef.aliases)
    names = names.concat(cmdDef.aliases);
  mgr.registerCommand(names,
      (src, args) => fn(parseCommand(cmdDef, args), src));
  return names;
}
