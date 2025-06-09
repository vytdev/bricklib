import { ParseContext, ParseResult } from './state.js';
import type { CmdArgument, CmdOption, CmdVerb } from './types.ts';

/**
 * Parse argument. This will throw an error if there's no at least 1
 * argument left on the token stream. This will not mutate `result`
 * on transformation error.
 * @param ctx The parsing context.
 * @param result Where to set the result.
 * @param argDef The argument definition.
 * @throws This function can throw errors.
 */
export function parseArgument(ctx: ParseContext, result: ParseResult,
    argDef: CmdArgument): void
{
  if (ctx.isEndOfTokens)
    throw 'Insufficient arguments';
  result.set(argDef.id, argDef.type(ctx));
}

/**
 * Parse option arguments. This will parse all the required arguments
 * mandatorily. Optional arguments will parse until one fails. After
 * a failed optional argument, only the defaults will be set. It will
 * also require parsing the first argument if `reqFirstOptArg` is set.
 * @param ctx The parsing context.
 * @param result Where to set the results.
 * @param optArgDefs The option-argument definitions.
 * @throws This function can throw errors.
 */
export function parseOptionArguments(ctx: ParseContext, result: ParseResult,
    optArgDefs: CmdArgument[]): void
{
  const state = ctx.getCurrentState();
  if (state.reqFirstOptArg && !optArgDefs?.length)
    throw `Option ${state.optionName} does not need any argument`;

  let doArgs = true;
  optArgDefs?.forEach((argDef, idx) => {

    if (doArgs)
      try {
        ctx.pushState();
        parseArgument(ctx, result, argDef);
        ctx.completeState();
        return;
      }
      catch (e) {
        if (!argDef.optional || (state.reqFirstOptArg && idx == 0))
          throw e;
        ctx.restoreState();
        doArgs = false;
      }

    result.set(argDef.id, argDef.default);
  });
}

/**
 * Parse long options.
 * @param ctx The parsing context.
 * @param result Where to set the results.
 * @param optDefs Where to lookup option defs.
 * @throws This function can throw errors.
 */
export function parseLongOption(ctx: ParseContext, result: ParseResult,
    optDefs: CmdOption[]): void
{
  const state = ctx.getCurrentState();
  if (state.stopOptions || ctx.isEndOfTokens)
    return;

  const tok = ctx.currentToken;
  if (!tok.startsWith('--'))
    return;
  ctx.consumeToken();

  /* extract '--flag' and 'val' from '--flag=val' */
  const eqIdx = tok.indexOf('=');
  const optName = eqIdx == -1 ? tok : tok.slice(0, eqIdx);
  const eqArg = eqIdx == -1 ? null : tok.slice(eqIdx + 1);

  state.optionName = optName;
  state.reqFirstOptArg = eqIdx != -1;

  /* eq arg has to be separate */
  if (eqIdx != -1)
    ctx.insertToken(eqArg);

  const optDef = findOption(optDefs, optName);

  /* count the occurences of the option */
  result.count(optDef.id);
  parseOptionArguments(ctx, result, optDef.args);
}

/**
 * Parse short options.
 * @param ctx The parsing context.
 * @param result Where to set the results.
 * @param optDefs Where to lookup option defs.
 * @throws This function can throw errors.
 */
export function parseShortOption(ctx: ParseContext, result: ParseResult,
    optDefs: CmdOption[]): void
{
  const state = ctx.getCurrentState();
  if (state.stopOptions || ctx.isEndOfTokens)
    return;

  const tok = ctx.currentToken;
  if (!tok.startsWith('-'))
    return;
  ctx.consumeToken();

  /* loop through each char */
  for (let i = 1; i < tok.length; i++) {
    const ch = tok[i];
    const optName = '-' + ch;

    const optDef = findOption(optDefs, optName);

    result.count(optDef.id);
    if (!optDef.args?.length)
      continue;

    /* option def has arguments */
    const adjArg = tok.slice(i+1);
    state.optionName = optName;
    state.reqFirstOptArg = !!adjArg.length;

    /* option args must be in a separate token */
    if (adjArg.length)
      ctx.insertToken(adjArg);

    parseOptionArguments(ctx, result, optDef.args);
    break;
  }
}

/**
 * Get a long/short option definition.
 * @param optDefs The option defs list.
 * @param optName The name of the option.
 * @returns Option def.
 * @throws When the option's not found.
 */
export function findOption(optDefs: CmdOption[], optName: string): CmdOption
{
  const def = optDefs.find(def => def.names.includes(optName));
  if (!def) throw 'Unknown option: ' + optName;
  return def;
}


declare const scriptArgs: string[];

const info: CmdOption[] = [
  {
    id: 'opt',
    names: ['--opt', '--bac', '-o'],
    args: [
      {
        id: 'num',
        type: (ctx) => +ctx.consumeToken(),
      },
      {
        id: 'hello',
        type: (ctx) => ctx.consumeToken(),
        default: 1,
        optional: true,
      }
    ]
  },
  {
    id: 'another',
    names: ['--another', '--ano', '-a'],
    args: [
      {
        id: 'val',
        type: (ctx) => {
          const tok = ctx.consumeToken();
          if (!/^[+-]?[0-9]+(?:\.[0-9]+)?$/.test(tok))
            throw 'invalid number: ' + tok;
          return +tok;
        },
        optional: true,
        default: 0,
      }
    ]
  },
  {
    id: 'verbose',
    names: ['-v', '--verbose'],
  }
];

const ctx = new ParseContext(scriptArgs.slice(1));
const result = new ParseResult();

while (!ctx.isEndOfTokens) {
  parseLongOption(ctx, result, info);
  if (ctx.currentToken?.[1] != '-')
    parseShortOption(ctx, result, info);
}
console.log(JSON.stringify(result.getMap()));
