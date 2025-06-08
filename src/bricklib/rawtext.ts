/**
 * A RawText builder for Minecraft Bedrock.
 */

/**
 * @class
 * A Minecraft rawtext builder.
 */
export class RawString
{
  /**
   * @private
   */
  private _entries: RawTextObject[];

  /**
   * @constructor
   * Make a new rawtext builder.
   * @param [val] Rawtext object(s) to start with.
   */
  constructor(val?: RawTextObject | RawTextObject[])
  {
    if (!(val instanceof Array))
      val = val?.rawtext;
    this._entries = val ?? [];
  }

  /**
   * Returns an object which you can pass to {@link JSON.stringify}.
   * @returns Object.
   */
  public toJSON(): RawTextObject
  {
    return { rawtext: this._entries };
  }

  /**
   * Returns a string representation of the built rawtext object.
   * @returns A JSON string which you can pass to the `/tellraw` or
   * `/titleraw` command.
   */
  public toString(): string
  {
    return JSON.stringify(this.toJSON());
  }

  /**
   * Concatenates this builder to another {@link RawString}.
   * @param other The other rawtext builder.
   * @returns A new rawtext builder instance.
   */
  public concat(other: RawString): RawString
  {
    return new RawString([...this._entries, ...other._entries]);
  }

  /**
   * Inserts new rawtext entry object to the end of the entry list.
   * @param obj The object to insert.
   * @returns Itself.
   */
  public append(obj: RawTextObject): this
  {
    this._entries.push(obj);
    return this;
  }

  /**
   * Inserts new rawtext entry object to the start of the entry list.
   * @param obj The object to insert.
   * @returns Itself.
   */
  public prepend(obj: RawTextObject): this
  {
    this._entries.unshift(obj);
    return this;
  }

  /**
   * Move the last N elements from the entry list to the start of the
   * entry list.
   * @param [n=1] How many elements to move.
   * @returns Itself.
   */
  public moveToStart(n: number = 1): this
  {
    if (this._entries.length > 0)
      for (let i = 0; i < n; i++)
        this._entries.unshift(this._entries.pop());
    return this;
  }

  /**
   * Appends a text string.
   * @param text The text.
   * @returns Itself.
   */
  public text(text: string): this
  {
    this.append({ text });
    return this;
  }

  /**
   * Appends a score element.
   * @param name The name of the player.
   * @param objective Scoreboard objective.
   * @returns Itself.
   */
  public score(name: string, objective: string): this
  {
    this.append({
      score: { name, objective }
    });
    return this;
  }

  /**
   * Appends an entity selector.
   * @param selector The selector string.
   * @returns Itself.
   */
  public selector(selector: string): this
  {
    this.append({ selector });
    return this;
  }

  /**
   * Appends a translation string.
   * @param key The translation key.
   * @returns Itself.
   */
  public translate(key: string): this
  {
    this.append({ translate: key });
    return this;
  }

  /**
   * Set a {@link RawString} instance as the parameter of the
   * preceeding translate entry.
   * @param param The {@link RawString} instance.
   * @returns Itself.
   */
  public with(param: RawString): this;

  /**
   * Set a {@link RawTextObject} object as the parameter of the preceeding
   * translate entry.
   * @param raw The {@link RawTextObject} object.
   * @returns Itself.
   */
  public with(raw: RawTextObject): this;

  /**
   * Appends string parameters to the preceeding translate entry.
   * @param str The strings to push.
   * @returns Itself.
   */
  public with(...str: string[]): this;

  /* Implementation of `.with()` */
  public with(...args: any[]): this
  {
    const lastEnt = this._entries[this._entries.length - 1];
    if (!('translate' in lastEnt))
      return this;

    const arg0 = args[0];

    if (arg0 instanceof RawString) {
      lastEnt.with = arg0.toJSON();
      return this;
    }

    if ('rawtext' in arg0) {
      lastEnt.with = arg0;
      return this;
    }

    if (!(lastEnt.with instanceof Array))
      lastEnt.with = [];
    lastEnt.with.push(...args);
    return this;
  }
}

/**
 * A rawtext message.
 */
export interface RawTextObject
{
  /**
   * A rawtext entry.
   */
  rawtext?: RawTextObject[],

  /**
   * A plain text.
   */
  text?: string,

  /**
   * A translation key.
   */
  translate?: string,
  /**
   * Optional parameters to pass to the translation key.
   */
  with?: string[] | RawTextObject,

  /**
   * A selector which outputs a string in format
   * `Name1, Name2, and Name3`.
   */
  selector?: string,

  /**
   * Scoreboard stats.
   */
  score?: {
    /**
     * Name of the player or a dummy scoreboard player.
     */
    name?: string,
    /**
     * Name of the scoreboard objective to match.
     */
    objective?: string,
  }
}
