import { Player } from '@minecraft/server';
import { checkPerm } from './permission.js';
import * as bricklib from '../bricklib/index.js';
export * from './permission.js';

bricklib.plugin.newPlugin('brickperms', () => {
  /* no-op */
});


/**
 * Returns an array of permission tags a player has.
 * @param plr The player.
 * @returns Permission tags of the player.
 */
export function getPermTags(plr: Player): string[]
{
  return plr
    .getTags()?.filter(t => t.startsWith('p:')).map(v => v.slice(2)) ?? [];
}

/**
 * Check if a player has a certain permission.
 * @param perm The permission to check.
 * @param plr The player to check for.
 * @returns True if the player has permission.
 */
export function hasPermission(perm: string, plr: Player): boolean
{
  return checkPerm(perm, getPermTags(plr));
}

/**
 * Asserts if a player has permission.
 * @param perm The perm node.
 * @param plr The player.
 * @throws This will throw an error if the player doesn't have permission.
 */
export function assertPermission(perm: string, plr: Player): void
{
  if (!hasPermission(perm, plr))
    throw 'brickperms: no permission: ' + perm;
}
