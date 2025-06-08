/**
 * Persistent storage for Minecraft.
 */

import { Entity, ItemStack, Player, world } from '@minecraft/server';
import * as utils from './utils.js';


/**
 * Prefix used in bricklib database IDs.
 */
export const ID_PREFIX = 'bricklib-db:';

/**
 * The default database ID.
 */
export const DEFAULT_ID = 'default';

/**
 * The max size of a database.
 */
export const MAX_SIZE = 32767;

/**
 * Defines a dynamic property source.
 */
export interface DynamicPropertySource
{
  getDynamicProperty: typeof world.getDynamicProperty,
  setDynamicProperty: typeof world.setDynamicProperty,
}

/**
 * @class
 * Bricklib persisting storage for Minecraft.
 */
export class Database<T extends Record<string, any>>
    implements Iterable<utils.EntryOf<T>>
{
  /**
   * @private
   */
  private _src: DynamicPropertySource;
  private _data: T;

  /**
   * @constructor
   * Make a new database descriptor.
   * @param src The Minecraft dynamic property source. Can be either the
   * {@link world} object, a {@link Player} instance, an {@link Entity}
   * instance, {@link ItemStack}, or anything that includes a get and set
   * dynamic property method.
   */
  constructor(src: DynamicPropertySource)
  {
    this._src = src;
    this.clear();
  }

  /**
   * Load database from source. Do nothing if the database doesn't exist.
   * @param [id] The database ID.
   * @throws This can throw errors.
   */
  public load(id?: string): void
  {
    if (typeof id !== 'string')
      id = DEFAULT_ID;

    const val = this._src.getDynamicProperty(ID_PREFIX + id);
    if (typeof val !== 'string')
      return;

    /* Deserialize and load the data. */
    const obj = JSON.parse(val) as T;
    if (typeof obj !== 'object')
      throw new Error('Could not deserialize database');

    for (const k of Object.getOwnPropertyNames(obj))
      this._data[k as Extract<keyof T, string>] = obj[k];
  }

  /**
   * Save the current staging.
   * @param [id] The database ID.
   * @throws This can throw errors.
   */
  public save(id?: string): void
  {
    if (typeof id !== 'string')
      id = DEFAULT_ID;

    const str = JSON.stringify(this._data);
    if (typeof str !== 'string')
      throw new Error('Could not serialize database');
    if (str.length > MAX_SIZE)
      throw new Error('Database too large!');

    this._src.setDynamicProperty(ID_PREFIX + id, str);
  }

  /**
   * Get the value of a key.
   * @param key The key.
   * @returns The value. Undefined if the key is not set.
   */
  public get<K extends Extract<keyof T, string>>(key: K): T[K] | undefined
  {
    return this._data[key];
  }

  /**
   * Set value to a key.
   * @param key The key to change.
   * @param val The value to set.
   */
  public set<K extends Extract<keyof T, string>>(key: K, val: T[K]): void
  {
    this._data[key] = val;
  }

  /**
   * Check whether a key is set.
   * @param key The key to check.
   * @returns True if key is set.
   */
  public has<K extends Extract<keyof T, string>>(key: K): boolean
  {
    return Object.prototype.hasOwnProperty.call(this._data, key);
  }

  /**
   * Delete a key.
   * @param key The key to delete.
   * @returns True if the key is set and has been successfuly deleted.
   */
  public del<K extends Extract<keyof T, string>>(key: K): boolean
  {
    if (this.has(key)) {
      delete this._data[key];
      return !this.has(key);
    }
    return false;
  }

  /**
   * Returns an array of set keys.
   * @returns An array of strings.
   */
  public keys(): Extract<keyof T, string>[]
  {
    return Object.getOwnPropertyNames(this._data) as Extract<keyof T, string>[];
  }

  /**
   * Clear the open database. This does not reflect changes to the dynamic
   * property source until {@link Database.save} is called.
   */
  public clear(): void
  {
    this._data = Object.create(null) as T;
  }

  /**
   * Get key-value pairs of all keys from the database.
   * @returns An array of key-value pairs.
   */
  public entries(): utils.EntryOf<T>[]
  {
    return this.keys().map(k => [k, this._data[k]]);
  }

  /**
   * Iterate through database's entries.
   * @returns An iterator.
   */
  public [Symbol.iterator](): IterableIterator<utils.EntryOf<T>>
  {
    return this.entries()[Symbol.iterator]();
  }

  /**
   * Remove database from source.
   * @param src Where to remove the database.
   * @param [id] The ID of the daatabase to remove.
   * @throws This can throw errors.
   */
  public static reset(src: DynamicPropertySource, id?: string): void
  {
    if (typeof id !== 'string')
      id = DEFAULT_ID;
    src.setDynamicProperty(ID_PREFIX + id);
  }

  /**
   * Check if a database exists from source.
   * @param src The source of the database.
   * @param [id] The name of the database to check.
   * @returns True if the database exists.
   * @throws This can throw errors.
   */
  public static hasDB(src: DynamicPropertySource, id?: string): boolean
  {
    if (typeof id !== 'string')
      id = DEFAULT_ID;
    return typeof src.getDynamicProperty(ID_PREFIX + id) !== 'undefined';
  }
}
