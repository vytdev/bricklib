import * as bricklib from '../bricklib/index.js';

/**
 * @class
 * Parsing context.
 */
export class ParseContext
{
  /**
   * @private
   */
  private _current: ParseState;
  private _states: ParseState[] = [];

  /**
   * @constructor
   * Creates a new parser.
   * @param args The args to work with.
   */
  constructor(args: string[])
  {
    this._current = {
      position: 0,
      tokens: args,
    };
  }

  /**
   * Save the current state. Useful for trial parsing.
   * @returns Itself.
   */
  public pushState(): this
  {
    this._states.push(this._current);
    this._current = {
      position: this._current.position,
      tokens: [...this._current.tokens],
    };
    return this;
  }

  /**
   * Restore the previous state, discarding the current one.
   * Useful if trial parsing fails.
   * @returns Itself.
   */
  public restoreState(): this
  {
    this._current = this._states.pop();
    return this;
  }

  /**
   * Discards the previous state. This could signal a successful
   * trial parsing.
   * @returns Itself.
   */
  public completeState(): this
  {
    this._states.pop();
    return this;
  }

  /**
   * Returns the current state.
   * @returns The current state.
   */
  public getCurrentState(): ParseState
  {
    return this._current;
  }

  /**
   * Whether it is the end of the token stream.
   */
  public get isEndOfTokens(): boolean
  {
    return this._current.position >= this._current.tokens.length;
  }

  /**
   * The current token string.
   */
  public get currentToken(): string
  {
    return this._current.tokens[this._current.position] ?? null;
  }

  /**
   * Returns the current token and advance the position pointer.
   * @returns The current token string.
   */
  public consumeToken(): string
  {
    if (this.isEndOfTokens)
      return null;
    return this._current.tokens[this._current.position++];
  }

  /**
   * Insert a token into the current position of the current stream.
   * This replaces the value of `currentToken`.
   * @param tok The token to insert.
   * @returns Itself.
   */
  public insertToken(tok: string): this
  {
    this._current.tokens.splice(this._current.position, 0, tok);
    return this;
  }

  /**
   * Replace the token at the current position of the current stream.
   * This also replaces the value of `currentToken`.
   * @param tok The token to be substituted.
   * @returns Itself.
   */
  public replaceToken(tok: string): this
  {
    this._current.tokens.splice(this._current.position, 1, tok);
    return this;
  }
}

/**
 * @class
 * The parsing result.
 */
export class ParseResult<T extends Record<PropertyKey, any> = any>
    implements Iterable<bricklib.utils.EntryOf<T>>
{
  /**
   * @private
   */
  private _result: T = Object.create(null) as T;

  /**
   * Lookups a result key.
   * @param key The key.
   * @returns The value assigned to key.
   */
  public get<K extends keyof T>(key: K): T[K]
  {
    return this._result[key];
  }

  /**
   * Sets a value for `key`.
   * @param key The key.
   * @param val The value to set.
   */
  public set<K extends keyof T>(key: K, val: T[K]): void
  {
    this._result[key] = val;
  }

  /**
   * Check whether a key exists.
   * @param key The key to check.
   * @returns True if the key exists.
   */
  public has<K extends keyof T>(key: K): boolean
  {
    return key in this._result;
  }

  /**
   * Delete a key from the result record.
   * @param key The key to delete.
   */
  public del<K extends keyof T>(key: K): boolean
  {
    return this.has(key) ? delete this._result[key] : false;
  }

  /**
   * Clear the result record.
   */
  public clear(): void
  {
    this._result = Object.create(null) as T;
  }

  /**
   * Get the keys that's been set onto the record.
   * @returns Array of keys.
   */
  public keys(): (keyof T)[]
  {
    return Reflect.ownKeys(this._result);
  }

  /**
   * Returns the entries of the current record in an array.
   * @returns The entries.
   */
  public entries(): bricklib.utils.EntryOf<T>[]
  {
    return this.keys().map(k => [k, this._result[k]]);
  }

  /**
   * Merge another result record into the current one.
   * @param other The other result record.
   */
  public merge(other: ParseResult<T>): void
  {
    for (const k in other._result)
      this._result[k] = other._result[k];
  }

  /**
   * Get the raw result map. (I trust you!)
   * @returns The result map.
   */
  public getMap(): T
  {
    return this._result;
  }

  /**
   * Allows this class to be used in for..of
   * @returns An iterable iterator.
   */
  public [Symbol.iterator](): Iterator<bricklib.utils.EntryOf<T>>
  {
    return this.entries()[Symbol.iterator]();
  }
}

/**
 * Parser state.
 */
export type ParseState = {
  /**
   * Stream position.
   */
  position: number,
  /**
   * Token stream.
   */
  tokens: string[],
  /**
   * If we're currently processing an option, the name of that option.
   */
  optionName?: string,
  /**
   * If we're currently processing an option, set this to true to require
   * the first option argument.
   */
  reqFirstOptArg?: boolean,
  /**
   * Whether to stop parsing options.
   */
  stopOptions?: boolean,
};
