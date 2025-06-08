/**
 * Server utilities.
 */

import {
  world,
  system,
  CommandResult,
  Dimension,
  Entity,
  Player,
} from '@minecraft/server';

import config from './config.js';


/**
 * Timestamp of the last tick.
 */
export let lastTick = Date.now();

/**
 * How long did the last tick took.
 */
export let tickDeltaTime = 0;

/**
 * The current ticks-per-second of the server.
 */
export let currentTps = 20;


/* Update perf metrics. */
system.runInterval(() => {
  const currTick = Date.now();
  tickDeltaTime = currTick - lastTick;
  lastTick = currTick;
  currentTps = 1000 / tickDeltaTime;
});


/* Commands that executes every tick. */
const cmdQueue: Function[] = [];
system.runInterval(() => {
  let buffer = config.commandBuffer;
  while (cmdQueue.length && buffer-- > 0)
    cmdQueue.shift()?.();
});

/**
 * Queue a minecraft command.
 * @param cmd The command.
 * @param [target] The target.
 * @returns A Promise.
 */
export async function queueMcCommand(
          cmd: string, target?: Entity | Dimension
       ): Promise<CommandResult>
{
  return new Promise<CommandResult>(resolve => cmdQueue.push(resolve))
    .then(() => runMcCommand(cmd, target));
}

/**
 * Run a Minecraft command.
 * @param cmd The command.
 * @param [target] The target.
 * @returns The command result.
 */
export function runMcCommand(
          cmd: string, target?: Entity | Dimension
       ): CommandResult
{
  return (target ?? world.getDimension('overworld')).runCommand(cmd);
}

/**
 * Execute all the queued Minecraft commands from the buffer.
 */
export function flushMcCommandQueue(): void
{
  while (cmdQueue.length)
    cmdQueue.shift()?.();
}

/**
 * Broadcast a message to the world, or to specific player(s).
 * @param msg The message.
 * @param [target] Player(s).
 */
export function broadcast(msg: string, target?: Player | Player[]): void
{
  if (target instanceof Player)
    target.sendMessage(msg);
  else if (target instanceof Array)
    target.forEach(plr => plr.sendMessage(msg));
  else
    world.sendMessage(msg);
}

/**
 * Send a message to players, while still allowing them to hide the it
 * using the 'Mute' toggle.
 * @param msg The message.
 * @param [target] Player(s).
 */
export function message(msg: string, target?: Player | Player[]): void
{
  const cmd = `tellraw @s {'rawtext':[{'text':${JSON.stringify(msg)}}]}`;
  if (target instanceof Player)
    queueMcCommand(cmd, target);
  else if (target instanceof Array)
    target.forEach(plr => queueMcCommand(cmd, plr));
  else
    world.getAllPlayers()?.forEach(plr => queueMcCommand(cmd, plr));
}

/**
 * Get Player class by name.
 * @param name The name of player to find.
 * @returns Player class or null.
 */
export function getPlayerByName(name: string): Player | null
{
  return world.getAllPlayers()?.find(v => v.name == name);
}
