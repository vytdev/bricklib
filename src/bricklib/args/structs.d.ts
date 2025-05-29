import type { ArgTokenStream } from './tokens.js';
import type { RawString } from '../rawtext.js';

/**
 * A command argument parser.
 */
export type TypeParser<T> = (def: CmdArgument, args: ArgTokenStream) => T;

/**
 * Result of parsing.
 */
export type ParseResult<T extends {} = Record<PropertyKey, any>> = T;

/**
 * A positional/option-argument definition.
 */
export interface CmdArgument<T = any>
{
  id:          PropertyKey,
  help?:       string | RawString,
  name?:       string,

  type:        TypeParser<T>,
  optional?:   boolean,
  default?:    T,

  [k: PropertyKey]: any,
}

/**
 * A flag/option.
 */
export interface CmdOption
{
  id:          PropertyKey,
  help?:       string | RawString,

  long?:       string[],
  short?:      string,
  args?:       CmdArgument[],
}

/**
 * A command/sub-command.
 */
export interface CmdVerb
{
  id:          PropertyKey,
  help?:       string | RawString,

  name:        string,
  aliases?:    string[],

  args?:       CmdArgument[],
  options?:    CmdOption[],
  subcmds?:    CmdVerb[],
}
