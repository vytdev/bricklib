import { ParseContext } from './state.js';
import type { Transformer } from './types.ts';

/**
 * A raw string parser.
 * @returns A cmd token transformer.
 */
export function stringType()
{
  return (ctx: ParseContext): string => {
    return ctx.consumeToken();
  };
}

/**
 * A float parser.
 * @returns A cmd token transformer.
 */
export function floatType()
{
  return (ctx: ParseContext): number => {
    let tok = ctx.consumeToken();
    const sign = tok[0] == '-' ? -1 : 1;
    if ('+-'.includes(tok[0]))
      tok = tok.slice(1);

    if (tok == 'inf') return sign * Infinity;
    if (tok == 'nan') return NaN;

    if (!/^[0-9]*(\.[0-9]+)?$/.test(tok))
      throw 'invalid float: ' + tok;

    const val = parseFloat(tok);
    if (isNaN(val))
      throw 'couldn\'t parse float: ' + tok;
    return val * sign;
  };
}

/**
 * A boolean parser.
 * @returns A cmd token transformer.
 */
export function boolType()
{
  return (ctx: ParseContext): boolean => {
    let tok = ctx.consumeToken();
    const idx = ['false', 'true'].indexOf(tok);

    if (idx == -1)
      throw 'invalid boolean: ' + tok;
    return !!idx;
  };
}

/**
 * An integer parser.
 * @returns A cmd token transformer.
 */
export function intType()
{
  return (ctx: ParseContext): number => {
    const tok = ctx.consumeToken();
    const val = parseInt(tok);

    if (isNaN(val))
      throw 'invalid integer: ' + tok;
    return val;
  };
}

/**
 * A rest argument parser.
 * @param parser The parser to transform values.
 * @returns A cmd token transformer.
 */
export function restType<T>(parser: Transformer<T>)
{
  return (ctx: ParseContext): T[] => {
    const vals: T[] = [];

    while (!ctx.isEndOfTokens)
      vals.push(parser(ctx));
    return vals;
  };
}

/**
 * An enumeration parser.
 * @param opts The enum options.
 * @returns The selected value.
 */
export function enumType(...opts: string[])
{
  return (ctx: ParseContext): any => {
    const tok = ctx.consumeToken();

    if (opts.includes(tok))
      throw 'unknown enum option: ' + tok + '\n' +
            'expected one of: ' + opts.join(', ');

    return tok;
  };
}
