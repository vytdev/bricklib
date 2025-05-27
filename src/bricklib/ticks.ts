import { system } from '@minecraft/server';
import * as utils from './utils.js';


let uptime: number = 0;

/**
 * An opaque identifier returned by the `setTickTimeout` and `setTickInterval`
 * functions.
 */
export type TickFuncHandle = number;


interface TickTimeout
{
  func: (...args: any[]) => void,
  args: any[],
  cntdown: number,
}

interface TickInterval
{
  func: (...args: any[]) => void,
  args: any[],
  interval: number,
  curr: number,
}

const funcs = new Map<TickFuncHandle, TickTimeout | TickInterval>();
let idCntr = 0;


/**
 * Set a function to run at a future time.
 * @param fn The function.
 * @param [delay] Time in ticks.
 * @param [args] Args to pass to the function.
 * @returns An opaque identifier which you can pass to `clearTickHandle`.
 */
export function setTickTimeout<A extends any[]>(
    fn: (...args: A) => void, delay?: number, ...args: A): TickFuncHandle
{
  const data = {
    func: fn,
    args: args,
    cntdown: delay ?? 1,
  };
  funcs.set(idCntr, data);
  return idCntr++;
}

/**
 * Set a function to run every N tick intervals.
 * @param fn The function.
 * @param [iv] Interval in ticks.
 * @param [args] Args to pass to the function.
 * @returns An opaque identifier which you can pass to `clearTickHandle`.
 */
export function setTickInterval<A extends any[]>(
    fn: (...args: A) => void, iv?: number, ...args: A): TickFuncHandle
{
  const data = {
    func: fn,
    args: args,
    interval: iv ?? 1,
    curr: 0,
  };
  funcs.set(idCntr, data);
  return idCntr;
}

/**
 * Remove a callback from scheduling.
 * @param id The opaque handle of the callback.
 * @returns True if the callback is found and removed, false otherwise.
 */
export function clearTickHandle(id: TickFuncHandle): boolean
{
  if (!funcs.has(id))
    return false;
  funcs.delete(id);
  return true;
}

/**
 * Sleep by a certain amount of time. For async functions.
 * @param ticks How long should we sleep, in ticks.
 * @returns A Promise which is resolved once the timeout has expired.
 */
export async function sleep(ticks: number): Promise<void>
{
  return new Promise(r => setTickTimeout(r, ticks));
}

/**
 * Returns the current tick stamp since the world has been created.
 * @returns The tick count.
 */
export function getCurrTick(): number
{
  return system.currentTick;
}

/**
 * Returns how many ticks has elapsed since the world has been loaded.
 * @returns The tick count.
 */
export function getTickUptime(): number
{
  return uptime;
}

/* Do the scheduling.. */
system.runInterval(() => {
  uptime++;

  for (const [id, func] of funcs) {

    if ('interval' in func && --func.curr <= 0) {
      utils.safeCall(func.func.apply, {}, func.args);
      func.curr = func.interval;
    }

    if ('cntdown' in func && --func.cntdown <= 0) {
      utils.safeCall(func.func.apply, {}, func.args);
      clearTickHandle(id);
    }
  }
});


/**
 * @class
 * A real-time timer.
 */
export class Timer
{
  /**
   * @private
   */
  private _start: number = 0;
  private _end: number = 0;
  private _isStopped: boolean = true;

  /**
   * Start the timer
   * @returns Itself.
   */
  public start(): this
  {
    this._start = this.getCurrTime();
    this._end = 0;
    this._isStopped = false;
    return this;
  }

  /**
   * End the timer.
   * @returns Itself.
   */
  public stop(): this
  {
    this._end = this.getCurrTime();
    return this;
  }

  /**
   * Get the total elapsed time from start to now/end.
   * @returns Elapsed time.
   */
  public getElapsed(): number
  {
    if (!this._isStopped)
      return this.getCurrTime() - this._start;
    return this._end - this._start;
  }

  /**
   * Returns the current time.
   * @returns Time in milliseconds.
   */
  public getCurrTime(): number
  {
    return Date.now();
  }
}

/**
 * @class
 * A tick-based timer.
 */
export class TickTimer extends Timer
{
  /**
   * Returns the current time.
   * @returns Time in ticks.
   */
  public override getCurrTime(): number
  {
    return getTickUptime();
  }
}
