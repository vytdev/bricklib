/**
 * Manage concurrent tasks.
 */

import { system } from '@minecraft/server';
import config from './config.js';
import * as utils from './utils.js';

/**
 * A queue of active thread tasks.
 */
const queue: Thread[] = [];

/**
 * Cofunction generic type.
 */
export type CoFunc<
    Args extends any[],
    Yield = unknown,
    Return = any,
    Next = any,
    This = never,
  > = (this: This, ...args: Args) => Generator<Yield, Return, Next>;

/*
   state     isRunning     isTaskComplete
   -----     ---------     --------------
   paused      false         false
     ??        true          true
   queued      true          false
   no task     false         true
 */

/**
 * @class
 * Custom multi-threading support.
 */
export class Thread<A extends any[] = any[], R = any>
{
  /**
   * @private
   */
  private _fn: CoFunc<A, unknown, R, any, this>;

  _task: Generator<unknown, R, any> = null;
  _return: (arg: R) => void;
  _throw: (arg: any) => void;

  /**
   * @constructor
   * Creates a new thread instance.
   * @param fn The generator function for this thread.
   */
  constructor(fn: CoFunc<A, unknown, R, any, Thread<A, R>>)
  {
    this._fn = fn;
  }

  /**
   * Whether this thread is currently running (i.e.: thread task is in
   * the scheduler queue). Note: `isRunning` is always set to false when
   * accessed from the generator function.
   * @returns Boolean.
   */
  get isRunning(): boolean
  {
    return queue.includes(this);
  }

  /**
   * Whether this thread's task is complete (i.e.: there's no active task).
   * Note: `isTaskComplete` is always set to false when accessed from
   * the generator function.
   * @returns Boolean.
   */
  get isTaskComplete(): boolean
  {
    return !this._task;
  }

  /**
   * Start and enqueue this thread onto the scheduler.
   * @param args Arguments to pass to the routine.
   * @returns A Promise which is resolved once the thread finishes. Or null
   * if the thread has already started.
   */
  public start(...args: A): Promise<R> | null
  {
    if (this.isRunning)
      return;
    queue.push(this);

    if (!this.isTaskComplete)
      return;
    this._task = this._fn.apply(this, args);

    /* Setup the promise first before `thread.join()`. */
    const prom = new Promise<R>((res, rej) => {
      this._return = res;
      this._throw = rej;
    });

    if (!config.multithreading)
      this.join();
    return prom;
  }

  /**
   * Pause this thread's task on the next yield-point.
   * @returns True if the thread's been running and paused.
   */
  public pause(): boolean
  {
    if (!this.isRunning)
      return false;
    queue.splice(queue.indexOf(this), 1);
    return true;
  }

  /**
   * Resume this thread if it is currently paused.
   * @returns True if the thread is paused and has been resumed.
   */
  public resume(): boolean
  {
    if (this.isRunning || this.isTaskComplete)
      return false;
    queue.push(this);
    return true;
  }

  /**
   * Preemptively stop this thread from its current yield-point.
   * @param ret Return value for the generator.
   * @returns True if the thread's task is incomplete and has been stopped.
   */
  public stop(ret: R): boolean
  {
    if (this.isTaskComplete)
      return false;
    this.pause();      /* Dequeue this thread from the scheduler. */

    /* A finally block might still throw to us. */
    utils.safeCall(() => this._task.return(ret));
    this._return(ret);

    this._task   = null;
    this._return = null;
    this._throw  = null;
    return true;
  }

  /**
   * Finish this thread immediately outside the scheduler. Note that
   * this is a blocking call.
   * @returns The return value of the thread, or undefined if the
   * thread's already complete.
   * @throws This function can throw errors if the thread generator
   * function throws anything.
   */
  public join(): R | undefined
  {
    if (this.isTaskComplete)
      return;
    this.pause();

    let ret: R | any, hasErr;

    /* Finish the thread on ourselves. */
    try {
      let result: IteratorResult<unknown, R>;
      while (!(result = this._task.next()).done)
        continue;
      ret = result.value;
      this._return(ret);
      hasErr = false;
    }
    catch (e) {
      ret = e;
      this._throw(e);
      hasErr = true;
    }

    this._task   = null;
    this._return = null;
    this._throw  = null;
    if (hasErr) throw ret;
    else        return ret;
  }
}

/**
 * Await for a Promise within synchronous generators.
 * @param promise The Promise object.
 * @returns A generator, which you can `yield*` in thread cofuncs.
 */
export function awaitFor<T>(promise: Promise<T>): Generator<void, T, void>
{
  let ret: T | any, err = false, done = false;

  promise
    .then(v => {
      done = true;
      err = false;
      ret = v;
    })
    .catch(v => {
      done = true;
      err = true;
      ret = v;
    });

  return (function *(): Generator<void, T, void> {
    while (!done) yield;
    if (err) throw ret;
    return ret;
  })();
}

/**
 * Wait for a condition to become true.
 * @param cond The function that returns the condition boolean.
 * @returns A generator, which you can `yield*` in thread cofuncs.
 */
export function waitUntil(cond: () => boolean): Generator<void, void, void>
{
  return (function* (): Generator<void, void, void> {
    while (!cond()) yield;
  })();
}


/**
 * Setup the scheduler.
 */
system.runInterval(() => {
  if (!config.multithreading)
    return;
  let cnt = config.numOfThreadTasksPerTick;

  while (queue.length && cnt-- > 0) {
    const thread = queue.shift();

    try {
      const next = thread._task.next();

      /* Thread isn't complete yet. */
      if (!next.done) {
        queue.push(thread);
        continue;
      }

      /* Return for the Promise. */
      thread._return(next.value);
    }
    catch (e) {
      thread._throw(e);
    }

    /* Reset the thread. */
    thread._task   = null;
    thread._return = null;
    thread._throw  = null;
  }
});
