/**
 * @class
 * A stream of argument tokens.
 */
export class ArgTokenStream
{
  /**
   * @private
   */
  private _args: string[] = [];
  private _pos: number = 0;
  private _state: { pos: number, args: string[] }[] = [];

  /**
   * @constructor
   * Creates a new ArgTokenStream instance.
   * @param args The arg array.
   */
  constructor(args: string[])
  {
    this._args = args;
  }

  /**
   * Get a copy of the arg array.
   * @returns A copy of the arg array.
   */
  public getCopy(): string[]
  {
    return [...this._args];
  }

  /**
   * Consume the current arg.
   * @returns Itself.
   */
  public consume(): this
  {
    if (this._pos < this._args.length)
      this._pos++;
    return this;
  }

  /**
   * Insert a token at the current position.
   * @param tok The token to insert.
   * @returns Itself.
   */
  public insert(tok: string): this
  {
    this._args.splice(this._pos, 0, tok);
    return this;
  }

  /**
   * Get the current arg.
   * @returns The current arg.
   */
  public get current(): string
  {
    return this._args[this._pos];
  }

  /**
   * Whether there are no more tokens left.
   * @returns True if there's no more tokens.
   */
  public get isEnd(): boolean
  {
    return this._pos >= this._args.length;
  }

  /**
   * Push the current pos state.
   * @returns Itself.
   */
  public push(): this
  {
    this._state.push({
      pos: this._pos,
      args: this.getCopy(),
    });
    return this;
  }

  /**
   * Complete the subparsing.
   * @returns itself.
   */
  public complete(): this
  {
    this._state.pop();
    return this;
  }

  /**
   * Pop pos state.
   * @returns Itself.
   */
  public pop(): this
  {
    if (this._state.length) {
      const state = this._state.pop();
      this._pos = state.pos;
      this._args = state.args;
    }
    return this;
  }
}
