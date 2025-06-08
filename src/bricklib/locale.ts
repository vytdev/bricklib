/**
 * Localisation helpers.
 */

import * as utils from './utils.js';


/**
 * A function that returns a formatted string.
 */
export type LocaleText = (...args: any[]) => string;

/**
 * A collection of translation texts.
 */
export type LocaleMap = Record<string, LocaleText>;

/**
 * @class
 * A localisation manager.
 * @example
 * ```ts
 * const map = {
 *   'hello.world': (a: string, b: string) => `${a}, ${b}!`,
 * };
 *
 * const langs: Record<string, Language<any>> = {};
 * langs['en-US'] = new Language<typeof map>('en-US').load(map);
 *
 * // Client-specific language settings:
 * const currLang = 'en-US';
 *
 * const fmt = langs[currLang].getKey('hello.world');
 * fmt('hello', 'world');
 * ```
 */
export class Language<T extends LocaleMap = LocaleMap>
{
  /**
   * @private
   */
  private _map: T = Object.create(null) as T;
  private _name: string;

  /**
   * @constructor
   * Make a new language instance.
   */
  constructor(name: string)
  {
    this._name = name;
  }

  /**
   * Loads a translation map.
   * @param map The map.
   * @returns Itself.
   */
  public load(map: T): this
  {
    for (const k in map)
      this._map[k] = map[k];
    return this;
  }

  /**
   * Get a translation key.
   * @param key The translation keyx
   * @returns A translation format function. Or undefined.
   */
  public getKey<K extends keyof T>(key: K): T[K]
  {
    return this._map[key];
  }

  /**
   * Update a translation key.
   * @param key The key to update.
   * @param val The format function.
   */
  public setKey<K extends keyof T>(key: K, val: T[K]): void
  {
    this._map[key] = val;
  }

  /**
   * Delete a translation key.
   * @param key The key to delete.
   * @returns True if the key exists and has been deleted.
   */
  public delKey<K extends keyof T>(key: K): boolean
  {
    if (!this.getKey(key))
      return false;
    delete this._map[key];
    return true;
  }

  /**
   * Returns all the translation keys.
   * @returns An array of string keys.
   */
  public keys(): (keyof T)[]
  {
    return Object.keys(this._map);
  }

  /**
   * Returns an array of key-value pairs of each translation key in
   * the translation map.
   * @returns An array of key-value pairs.
   */
  public entries(): utils.EntryOf<T>[]
  {
    return this.keys().map(k => [k, this._map[k]]);
  }

  /**
   * Returns a string representation of this class.
   * @returns A string.
   */
  public toString(): string
  {
    return `Language(${this._name})`;
  }
}
