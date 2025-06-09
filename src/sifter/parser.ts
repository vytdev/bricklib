import { ParseContext, ParseResult } from './state.js';
import type { CmdArgument, CmdOption, CmdVerb } from './types.ts';

/**
 * Parse argument.
 * @param ctx The parsing context.
 * @param result Where to set the result.
 * @param argDef The argument definition.
 * @throws This function can throw errors.
 */
export function parseArgument(ctx: ParseContext, result: ParseResult,
    argDef: CmdArgument): void
{
  result.set(argDef.id, argDef.type(ctx));
}

/**
 * Parse option arguments.
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
  if (ctx.isEndOfTokens)
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
  if (ctx.isEndOfTokens)
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
  const def = optDefs?.find(def => def.names.includes(optName));
  if (!def) throw 'Unknown option: ' + optName;
  return def;
}

/**
 * Parse a verb.
 * @param ctx The parsing context.
 * @param result Where to set the results.
 * @param verbDef The verb's definition.
 * @throws This function can throw errors.
 */
export function parseVerb(ctx: ParseContext, result: ParseResult,
    verbDef: CmdVerb): void
{
  let stopOptions = false;
  let argIdx = 0;

  while (!ctx.isEndOfTokens) {
    const tok = ctx.currentToken;

    if (tok[0] == '-' && tok.length >= 2 && !stopOptions) {
      /* short opts */
      if (tok[1] != '-') {
        parseShortOption(ctx, result, verbDef.options);
        continue;
      }
      /* end-of-options delimeter */
      if (tok.length == 2) {
        stopOptions = true;
        ctx.consumeToken();
        continue;
      }
      /* long opts */
      parseLongOption(ctx, result, verbDef.options);
      continue;
    }

    /* positional arguments */
    if (argIdx < verbDef.args?.length) {
      const argDef = verbDef.args[argIdx++];
      parseArgument(ctx, result, argDef);
      continue;
    }

    /* try subcommands */
    if (verbDef.subverbs?.length) {
      parseSubVerb(ctx, result, verbDef.subverbs);
      break;
    }

    throw 'Too many arguments';
  }

  /* set the defaults of other optional positional params */
  while (argIdx < verbDef.args?.length) {
    const argDef = verbDef.args[argIdx++];
    if (!argDef.optional)
      throw 'Insufficient arguments';
    result.set(argDef.id, argDef.default);
  }
}

/**
 * Parse a subverb.
 * @param ctx The parsing context.
 * @param result Where to set the results.
 * @param verbDefs Where to lookup subverb defs.
 * @throws This function can throw errors.
 */
export function parseSubVerb(ctx: ParseContext, result: ParseResult,
    verbDefs: CmdVerb[]): void
{
  const subName = ctx.consumeToken();
  const verbDef = verbDefs.find(def =>
      def.name == subName || def.aliases?.includes(subName));

  if (!verbDef)
    throw 'Unknown subcommand: ' + subName;

  const subRes = new ParseResult();
  parseVerb(ctx, subRes, verbDef);
  result.set(verbDef.id, subRes);
}
