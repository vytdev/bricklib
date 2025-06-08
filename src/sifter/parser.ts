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
 * @param result Where to set the result.
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


declare const scriptArgs: string[];

const info: CmdOption = {
  id: 'opt',
  names: ['--opt', '-o'],
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
};

const ctx = new ParseContext(scriptArgs.slice(1));
const result = new ParseResult();

parseOptionArguments(ctx, result, info.args);
console.log(JSON.stringify(result.getMap()));
