import { Player, world } from '@minecraft/server';
import config from './config.js';


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

const registry: Map<string, CommandCallback> = new Map();
let cmdNotFoundHandler: CommandCallback = () => 1;
let cmdPrefix: string = config.cmdPrefix;


/**
 * Register a custom command. This may override existing cmds.
 * @param names The names you want to use for the command.
 * @param fn The handler function.
 */
export function registerCommand(names: string[], fn: CommandCallback): void
{
  for (const name of names)
    registry.set(name, fn);
}


/**
 * Set the handler when a command isn't found.
 * @param fn The command not found handler.
 */
export function setCmdNotFoundHandler(fn: CommandCallback): void
{
  cmdNotFoundHandler = fn;
}


/**
 * Get the current cmd not found handler.
 * @returns The command handler.
 */
export function getCmdNotFoundHandler(): CommandCallback
{
  return cmdNotFoundHandler;
}


/**
 * Change the command prefix.
 * @param prefix
 */
export function changeCmdPrefix(prefix: string): void
{
  cmdPrefix = prefix;
}


/**
 * Get the current cmd prefix.
 * @returns The current prefix.
 */
export function getCmdPrefix(): string
{
  return cmdPrefix;
}


/**
 * Returns true if a command exists.
 * @param name The name of the command.
 */
export function doesCommandExist(name: string): boolean
{
  return registry.has(name);
}


/**
 * Get the command callback if the command with `name` exists.
 * Otherwise, return `null`.
 * @param name The name of the command.
 * @returns The command callback.
 */
export function getCommand(name: string): CommandCallback | null
{
  return registry.get(name) || null;
}


/**
 * Calls a command.
 * @param args The args to pass.
 * @param src The initiator.
 * @returns Status code.
 * @throws This function can throw errors.
 */
export function dispatchCommand(
          args: string[],
          src: CommandSource
        ): CommandStatus
{
  if (args.length < 1 || !doesCommandExist(args[0]))
    return cmdNotFoundHandler(src, args);
  return getCommand(args[0])(src, args);
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
  let isQuoted = false;

  function pushTok() {
    if (!hasToken)
      return;
    result.push(currToken);
    currToken = '';
    hasToken = false;
  }

  /* Remove leading and trailing whitespace. */
  cmd = cmd.trim();

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

    if (char == '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (!isQuoted && /\s/.test(char)) {
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


/**
 * Register a custom command handler.
 */
world.beforeEvents.chatSend.subscribe(ev => {
  const msg = ev.message;
  if (!msg.startsWith(cmdPrefix))
    return;
  ev.cancel = true;

  /* Dispatch the command. */
  try {
    dispatchCommand(
      tokenizeCommand(msg.slice(cmdPrefix.length)),
      ev.sender);
  }
  catch (e) {
    let msg: string = '' + e;
    if (e instanceof Error || e.stack)
      msg += '\n' + e.stack;
    ev.sender.sendMessage(msg);
  }
});


/**
 * Set the default command-not-found handler.
 */
setCmdNotFoundHandler(() => {
  throw 'bricklib: command not found';
});
