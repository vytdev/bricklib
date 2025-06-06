/**
 * A simple logging wrapper.
 */

/**
 * Format placeholder for the log message.
 */
export const MSG_PLACEHOLDER = '{msg}';

/**
 * Format placeholder for the log type.
 */
export const TYPE_PLACEHOLDER = '{type}';

/**
 * @class
 * Logging wrapper class.
 */
export class Logger
{
  /**
   * @constructor
   * Makes a new logger instance.
   * @param fmt The logger format.
   */
  constructor(fmt?: string)
  {
    this._format = fmt ?? MSG_PLACEHOLDER;
  }

  /**
   * @private
   */
  private _format: string;

  /**
   * Whether to print verbose logs.
   */
  public verboseMode: boolean = false;

  /**
   * Whether to print debugging logs.
   */
  public debugMode: boolean = false;

  /**
   * Format a log string.
   * @param fmt The format.
   * @param msg The message.
   * @param type The log type.
   * @returns Formatted string.
   */
  public static formatLog(fmt: string, msg: string, type: string): string
  {
    return fmt
      .replace(MSG_PLACEHOLDER, msg)
      .replace(TYPE_PLACEHOLDER, type);
  }

  /**
   * Make a log text, printed onto console.
   * @param type The log type.
   * @param msg The message strings.
   * @returns A formatted string.
   */
  public makeLog(type: string, ...msg: string[]): string
  {
    return Logger.formatLog(this._format, msg.join(' '), type);
  }

  /**
   * Print debug logs (if debugMode is set).
   * @param msg
   * @returns Itself.
   */
  public debug(...msg: string[]): this
  {
    if (this.debugMode)
      console.debug(this.makeLog('debug', ...msg));
    return this;
  }

  /**
   * Print verbose logs (if verboseMode is set).
   * @param msg
   * @returns Itself.
   */
  public verbose(...msg: string[]): this
  {
    if (this.verboseMode)
      console.log(this.makeLog('verbose', ...msg));
    return this;
  }

  /**
   * Print logs.
   * @param msg
   * @returns Itself.
   */
  public log(...msg: string[]): this
  {
    console.log(this.makeLog('log', ...msg));
    return this;
  }

  /**
   * Print info logs.
   * @param msg
   * @returns Itself.
   */
  public info(...msg: string[]): this
  {
    console.info(this.makeLog('info', ...msg));
    return this;
  }

  /**
   * Print warnings.
   * @param msg
   * @returns Itself.
   */
  public warn(...msg: string[]): this
  {
    console.warn(this.makeLog('warn', ...msg));
    return this;
  }

  /**
   * Print errors.
   * @param msg
   * @returns Itself.
   */
  public error(...msg: string[]): this
  {
    console.error(this.makeLog('error', ...msg));
    return this;
  }
}
