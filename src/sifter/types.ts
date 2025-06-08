import type { ParseContext } from './state.ts';

/**
 * A token transformer.
 */
export type Transformer<T = any> = (ctx: ParseContext) => T;

/**
 * Command argument definition.
 */
export type CmdArgument<T = any> = {
  /**
   * Identifier for the arg.
   */
  id: PropertyKey,
  /**
   * The token transformer to parse types.
   */
  type: Transformer<T>,
  /**
   * Whether this argument is optional.
   */
  optional?: boolean,
  /**
   * Default value if this arg is optional.
   */
  default?: T,
};

/**
 * Command option definition.
 */
export type CmdOption = {
  /**
   * Identifier for the option.
   */
  id: PropertyKey,
  /**
   * Names used to identify this option. '--name' to define long a name,
   * '-o' to define a short name.
   */
  names: string[],
  /**
   * Option arguments.
   */
  args?: CmdArgument[],
};

/**
 * Command verb definition.
 */
export type CmdVerb = {
  /**
   * Identifier for the option.
   */
  id: PropertyKey,
  /**
   * Name of the verb.
   */
  name: string,
  /**
   * Optional verb name aliases.
   */
  aliases?: string[],
  /**
   * Verb positional arguments.
   */
  args?: CmdArgument[],
  /**
   * Verb-specific options.
   */
  options?: CmdOption[],
  /**
   * Sub-verbs.
   */
  subverbs?: CmdVerb[],
};
