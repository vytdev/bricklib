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

  /* extract '--flag' and 'val' from '--flag=val' */
  const eqIdx = tok.indexOf('=');
  const optName = eqIdx == -1 ? tok : tok.slice(0, eqIdx);
  const eqArg = eqIdx == -1 ? null : tok.slice(eqIdx + 1);

  state.optionName = optName;
  state.reqFirstOptArg = eqIdx != -1;

  /* split the tokens from the token stream */
  ctx.replaceToken(optName);
  ctx.consumeToken();
  if (eqIdx != -1)
    ctx.insertToken(eqArg);

  const optDef = optDefs.find(def => def.names.includes(optName));
  if (!optDef)
    throw 'Unknown option: ' + optName;

  /* count the occurences of the option */
  result.set(optDef.id, (result.get(optDef.id) ?? 0) + 1);
  if (optDef.args)
    parseOptionArguments(ctx, result, optDef.args);
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
  }
];

const ctx = new ParseContext(scriptArgs.slice(1));
const result = new ParseResult();

while (!ctx.isEndOfTokens)
  parseLongOption(ctx, result, info);
console.log(JSON.stringify(result.getMap()));
