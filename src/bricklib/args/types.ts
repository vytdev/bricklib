import type { CmdArgument, TypeParser } from './defs.ts';
import { ArgTokenStream } from './tokens.js';

export function string(): TypeParser<string>
{
  return (_: CmdArgument, args: ArgTokenStream): string => {
    const arg = args.current;
    args.consume();
    return arg;
  };
}

export function float(): TypeParser<number>
{
  return (_: CmdArgument, args: ArgTokenStream): number => {
    const arg = args.current;
    args.consume();
    /* try parse float */
    const val = parseFloat(arg);
    if (isNaN(val))
      throw 'invalid float: ' + arg;
    return val;
  };
}

export function bool(): TypeParser<boolean>
{
  return (_: CmdArgument, args: ArgTokenStream): boolean => {
    const arg = args.current;
    args.consume();
    if (arg == 'true')  return true;
    if (arg == 'false') return false;
    throw 'invalid boolean: ' + arg;
  };
}

export function int(): TypeParser<number>
{
  return (_: CmdArgument, args: ArgTokenStream): number => {
    const arg = args.current;
    args.consume();
    const val = parseInt(arg);
    if (isNaN(val))
      throw 'invalid integer: ' + arg;
    return val;
  };
}

export function variadic<T>(fn: TypeParser<T>): TypeParser<T[]>
{
  return (def: CmdArgument, args: ArgTokenStream): T[] => {
    const vals = [];
    while (!args.isEnd)
      vals.push(fn(def, args));
    return vals;
  };
}

export function strenum<T extends string>(vals: T[]): TypeParser<T>
{
  return (_: CmdArgument, args: ArgTokenStream): T => {
    const arg = args.current as T;
    args.consume();
    if (!vals.includes(arg))
      throw 'expected any of: ' + vals.join(', ') + '. got: ' + arg;
    return arg;
  };
}
