import { Player, world } from '@minecraft/server';


/**
 * The command source. Can be `null` if ran through the APIs.
 */
export type CommandSource = Player | null;

/**
 * The command result. Any integer.
 */
export type CommandStatus = number;

/**
 * Command handler function type. `src` is the command initiator.
 * `args` is the list of parameters that is passed to the command.
 * `args[0]` is the name of the command.
 */
export type CommandCallback = (
              src: CommandSource,
              args: string[]
            ) => CommandStatus;

/**
 * @class
 * Command manager class
 */
export class CommandManager
{
  /**
   * @private
   * Index of all command names and callbacks.
   */
  private _registry: Map<string, CommandCallback>;

  /**
   * Handler to use when a command does not exist.
   */
  public notFoundHandler: CommandCallback;

  /**
   * @constructor
   * Create a new command manager.
   */
  constructor()
  {
    this._registry = new Map();
    this.notFoundHandler = () => { throw 'bricklib: command not found'; };
  }

  /**
   * Register a custom command. This may override existing cmds.
   * @param names The names you want to use for the command.
   * @param fn The handler function.
   */
  public registerCommand(names: string[], fn: CommandCallback): void
  {
    for (const name of names)
      this._registry.set(name, fn);
  }

  /**
   * Deregister commands by name.
   * @param names The names of the commands you want to deregister.
   */
  public deregisterCommand(names: string[]): void
  {
    for (const name of names)
      this._registry.delete(name);
  }

  /**
   * Returns true if a command exists.
   * @param name The name of the command.
   */
  public isRegistered(name: string): boolean
  {
    return this._registry.has(name);
  }

  /**
   * Get the command callback if the command with `name` exists.
   * Otherwise, return the command-not-found handler.
   * @param name The name of the command.
   * @returns The command callback.
   */
  public getCommand(name: string): CommandCallback
  {
    return this._registry.get(name) || this.notFoundHandler;
  }

  /**
   * Calls a command.
   * @param args The args to pass.
   * @param src The initiator.
   * @returns Status code.
   * @throws This function can throw errors.
   */
  public dispatchCommand(args: string[], src: CommandSource): CommandStatus
  {
    if (args.length < 1)
      return this.notFoundHandler(src, args);
    return this.getCommand(args[0])(src, args);
  }
}

/**
 * Enable custom chat commands for `prefix`.
 * @param mgr The command manager where we'll look up commands.
 * @param prefix Prefix to use in chats.
 * @returns A handle which you can pass to {@link disableCustomChatCmds}.
 */
export function enableCustomChatCmds(mgr: CommandManager, prefix: string): any
{
  return world.beforeEvents.chatSend.subscribe(ev => {
    const msg = ev.message;
    if (!msg.startsWith(prefix))
      return;
    ev.cancel = true;

    /* Dispatch the command. */
    try {
      mgr.dispatchCommand(
        tokenizeCommand(msg.slice(prefix.length)),
        ev.sender);
    }
    catch (e) {
      let msg: string = '' + e;
      if (e instanceof Error || e.stack)
        msg += '\n' + e.stack;
      ev.sender.sendMessage(msg);
    }
  });
}

/**
 * Disable custom chat commands for this handler if it's currently
 * enabled.
 * @param handle The handle that is returned by enableCustomChatCmds.
 */
export function disableCustomChatCmds(handle: any): void
{
  if (handle)
    world.beforeEvents.chatSend.unsubscribe(handle);
}

/**
 * Tokenizes a command string.
 * @param cmd The command string.
 * @returns An array of arg strings.
 */
export function tokenizeCommand(cmd: String): string[]
{
  const result: string[] = [];
  let currToken = '';
  let hasToken = false;
  let escapeChar = false;
  let quote = null;

  function pushTok() {
    if (!hasToken)
      return;
    result.push(currToken);
    currToken = '';
    hasToken = false;
  }

  for (const char of cmd) {

    if (escapeChar) {
      currToken += char;
      escapeChar = false;
      continue;
    }

    if (char == '\\') {
      hasToken = true;
      escapeChar = true;
      continue;
    }

    if (quote ? char == quote : '"\''.includes(char)) {
      quote = quote ? null : char;
      continue;
    }

    if (!quote && /\s/.test(char)) {
      pushTok();
      continue;
    }

    hasToken = true;
    currToken += char;
  }

  /* In-case there's still a token left unpushed. */
  pushTok();

  return result;
}
