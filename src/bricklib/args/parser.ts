import type {
  CmdArgument,
  CmdVerb,
  CmdOption,
  ParseResult,
} from './defs.ts';
import { ArgTokenStream } from './tokens.js';

/**
 * Parse args.
 * @param argDef The argument definition.
 * @param args The token stream.
 * @returns Parse result.
 * @throws This function can throw errors.
 */
export function parseArg<R extends any>(
    argDef: CmdArgument<R>, args: ArgTokenStream): R
{
  if (args.isEnd && !argDef.optional)
    throw 'Unexpected end of input';
  return argDef.type(argDef, args);
}

/**
 * Parse the arguments of an option.
 * @param defs The arg defs of an option.
 * @param args The token stream. This function will only set the
 * default values of option-arg defs when this parameter is null.
 * @param result Where to set the results.
 * @param isAdj Force the first arg to succed parsing. This is useful
 * when the first arg in the option is adjacent (--opt=VAL, -mVAL).
 * @param name Name of the argument (for better error reporting).
 * @throws This function can throw errors.
 */
export function parseLooseArgs(
    argDefs: CmdArgument[], args: ArgTokenStream, result: ParseResult,
    isAdj: boolean, name: string): void
{
  if (!argDefs?.length && isAdj)
    throw 'Option ' + name + ' does not need any argument';

  let stopArgs = !args;
  argDefs?.forEach((argDef, idx) => {
    /* process optional args that didn't match */
    if (stopArgs) {
      result[argDef.id] = argDef.default;
      checkArgDefOrder(argDef, true);
      return;
    }

    /* process required args */
    try {
      args.push();
      result[argDef.id] = parseArg(argDef, args);
      args.complete();
    }
    catch (e) {
      if (!argDef.optional || (isAdj && idx == 0))
        throw e;
      stopArgs = true;
      args.pop();
    }
  });
}

/**
 * Parse a long option.
 * @param defs The options list.
 * @param args The token stream.
 * @param result Where to set the results.
 * @throws This function can throw errors.
 */
export function parseLongOption(
    optDefs: CmdOption[], args: ArgTokenStream, result: ParseResult): void
{
  const arg = args.current;

  if (!arg.startsWith('--'))
    return;
  args.consume();

  const [optName, eqArg] = arg.slice(2).split('=');
  const optDef = optDefs?.find(v => v.long?.includes(optName));

  if (!optDef)
    throw 'Unrecognized flag: --' + optName;

  /* handle: --flag=arg */
  if (typeof eqArg === 'string')
    args.insert(eqArg);

  /* found option! */
  if (typeof result[optDef.id] !== 'number')
    result[optDef.id] = 0;
  result[optDef.id]++;

  parseLooseArgs(optDef.args, args, result,
                  typeof eqArg === 'string', '--' + optName);
}

/**
 * Parse a short option.
 * @param defs The options list.
 * @param args The token stream.
 * @param result Where to set the results.
 * @throws This function can throw errors.
 */
export function parseShortOption(
    optDefs: CmdOption[], args: ArgTokenStream, result: ParseResult): void
{
  const arg = args.current;

  if (!arg.startsWith('-'))
    return;
  args.consume();

  for (let i = 1; i < arg.length; i++) {
    const char = arg[i];
    const optDef = optDefs?.find(v => v.short?.includes(char));

    if (!optDef)
      throw 'Unrecognized flag: -' + char;

    /* found option! */
    if (typeof result[optDef.id] !== 'number')
      result[optDef.id] = 0;
    result[optDef.id]++;

    if (!optDef.args?.[0])
      continue;

    /* handle: -mVALUE (where -m is the current opt) */
    const nearArg = arg.slice(i+1);
    if (nearArg.length)
      args.insert(nearArg);

    parseLooseArgs(optDef.args, args, result,
                    nearArg.length > 0, '-' + char);
    break;
  }
}

/**
 * Parse a command/sub-command.
 * @param def The command/sub-command definition.
 * @param args The token stream. This function will only set the
 * default values of positional-arg defs when this parameter is null.
 * @param upOpts Starting option list. Can be used to inherit options
 * from a parent command.
 * @returns The parsing result.
 * @throws This function can throw errors.
 */
export function parseVerb(
    cmdDef: CmdVerb, args: ArgTokenStream, upOpts: CmdOption[]): ParseResult
{
  const result: ParseResult = Object.create(null);
  let argIdx = 0;
  let hasSubCmd = false;      /* whether we had processed a subcmd */
  let stopOpts = false;       /* stop parsing of flags/options */
  let endReqArgs = false;     /* end of required args (no more
                                 required args are expected) */
  if (cmdDef.options)
    upOpts = upOpts.concat(cmdDef.options);

  /* process options, positional args, and subverbs */
  while (args && !args.isEnd) {
    const arg = args.current;

    if (arg[0] == '-' && !stopOpts) {
      /* a short option */
      if (arg[1] != '-') {
        parseShortOption(upOpts, args, result);
        continue;
      }
      /* double-dash (--) */
      if (arg.length == 2) {
        args.consume();
        stopOpts = true;
        continue;
      }
      parseLongOption(upOpts, args, result);
      continue;
    }

    /* parse positional parameters */
    if (argIdx < cmdDef.args?.length) {
      const argDef = cmdDef.args[argIdx++];
      endReqArgs = checkArgDefOrder(argDef, endReqArgs);
      result[argDef.id] = parseArg(argDef, args);
      continue;
    }

    /* process subcmds */
    if (cmdDef.subcmds?.length) {
      parseSubVerb(cmdDef.subcmds, args, result, upOpts);
      hasSubCmd = true;
      break;
    }

    throw 'Too many arguments: ' + arg;
  }

  /* no more tokens left... */
  setVerbDefaults(cmdDef, result, argIdx, !hasSubCmd, endReqArgs, new Set());

  /* yey! verb has been processed successfuly! */
  result[cmdDef.id] = true;
  return result;
}

/**
 * Helper function to assert whether there are required args after
 * the optional ones
 * @param argDef The current argument definition to check.
 * @param endReqArgs Whether there are no more required positionals
 * that is expected.
 * @returns The new value for endReqArgs
 * @throws This function *will* throw an error if it finds
 * a required positional argument after the optional ones.
 */
export function checkArgDefOrder(
    argDef: CmdArgument, endReqArgs: boolean): boolean
{
  if (!argDef.optional && endReqArgs)
    throw new Error('Parse definition error: Required arguments must ' +
                    'not come after optional ones');
  return !!argDef.optional;
};

/**
 * Set the defaults of a command. (i.e., there are no more tokens but
 * there are still optional arg defs).
 * @param cmdDef The command definution.
 * @param result Where to set the results.
 * @param argIdx The index of the start of the unprocessed
 * positional arg defs.
 * @param doSubCmds Whether you ran out of tokens without
 * yet parsing subcommands.
 * @param endReqArgs Whether there are no more required
 * args that is expected.
 * @param processedSubs A set which contains all the
 * subcommands whose defaults are already set.
 * @throws This function can throw errors.
 */
export function setVerbDefaults(
    cmdDef: CmdVerb, result: ParseResult, argIdx: number,
    doSubCmds: boolean, endReqArgs: boolean, processedSubs: Set<CmdVerb>): void
{
  /* prevents infinite recursion on nested cyclic subcmds */
  processedSubs.add(cmdDef);

  /* set the defaults of other positional args */
  while (argIdx < cmdDef.args?.length) {
    const argDef = cmdDef.args[argIdx++];
    endReqArgs = checkArgDefOrder(argDef, endReqArgs);
    if (!argDef.optional)        /* need more args!! */
      throw 'Insufficient arguments';
    result[argDef.id] = argDef.default;
  }

  /* no subcmd found. set the defaults of unnamed subcmds */
  if (doSubCmds && cmdDef.subcmds?.length)
    for (const verbDef of cmdDef.subcmds) {
      if (verbDef.name?.length || !isAllArgsOptional(verbDef.args))
        continue;
      /* find the first subverb where *all* positionals are optional.
         we don't wanna set the defaults of unnamed subs that requires
         user input */
      if (!processedSubs.has(verbDef))
        setVerbDefaults(verbDef, result, 0, true, true, processedSubs);
      break;
    }

  /* this has optionals, and we parsed it successfuly! */
  result[cmdDef.id] = true;
}

/**
 * Parse subcommands.
 * @param cmdDefs Subcommand definitions.
 * @param args The token stream.
 * @param result Where to write the results.
 * @param upOpts Unnamed sub-commands has to inherit its parent's
 * options.
 * @throws This function can throw errors.
 */
export function parseSubVerb(
    cmdDefs: CmdVerb[], args: ArgTokenStream, result: ParseResult,
    upOpts: CmdOption[]): void
{
  if (!cmdDefs)
    return;
  const name = args.current;
  const unNamedSubs = [];

  for (const verbDef of cmdDefs) {
    /* collect unnamed subcmds */
    if (!verbDef.name?.length) {
      unNamedSubs.push(verbDef);
      continue;
    }

    if (verbDef.name != name && !verbDef.aliases?.includes(name))
      continue;
    args.consume();

    /* exact match found */
    result[verbDef.id] = parseVerb(verbDef, args, []);
    return;
  }

  /* there's really no match */
  if (!unNamedSubs.length)
    throw 'Unknown subcommand: ' + name;

  /* trial parsing for unnamed subs */
  let err;
  for (const verbDef of unNamedSubs) {
    try {
      args.push();
      result[verbDef.id] = parseVerb(verbDef, args, upOpts);
      args.complete();
      return;
    }
    catch (e) {
      args.pop();
      if (!err)
        err = e;
    }
  }
  throw err;
}

/**
 * Check whether all the arg defs in the given list is optional.
 * @param argDefs List of arg definitions.
 * @returns True if all args are optional.
 */
export function isAllArgsOptional(argDefs: CmdArgument[]): boolean
{
  return (argDefs ?? []).every(def => !!def.optional);
}
