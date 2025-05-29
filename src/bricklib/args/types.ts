import type { CmdArgument } from './defs.ts';
import { ArgTokenStream } from './tokens.js';

export const parsers = {
  'string': (_: CmdArgument, args: ArgTokenStream) => {
    const arg = args.current;
    args.consume();
    return arg;
  },

  'number': (_: CmdArgument, args: ArgTokenStream) => {
    const arg = args.current;
    args.consume();
    /* try parse number */
    const val = parseFloat(arg);
    if (isNaN(val))
      throw 'not-a-number: ' + arg;
    return val;
  },

  'boolean': (_: CmdArgument, args: ArgTokenStream) => {
    const arg = args.current;
    args.consume();
    if (arg == 'true')  return true;
    if (arg == 'false') return false;
    throw 'invalid boolean: ' + arg;
  }
};
