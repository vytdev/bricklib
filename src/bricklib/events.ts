/**
 * An event manager.
 */

/**
 * An event listener callback function.
 */
export type ListenerCallback<A extends any[]> = (...args: A) => void;

/**
 * @interface
 * Event listener info.
 */
export interface ListenerInfo<T extends PropertyKey, A extends any[]>
{
  callback: ListenerCallback<A>,
  event: T,
  once: boolean,
};

/**
 * @class
 * A custom event manager.
 */
export class EventManager<T extends Record<PropertyKey, any[]>>
{
  /**
   * @private
   * List of event listener.
   */
  private _listeners: ListenerInfo<keyof T, any[]>[] = [];

  /**
   * Adds a new event listener.
   * @param event The event to listen for.
   * @param callback The function to execute when `event` fires.
   * @param [once] Whether to only listen once.
   */
  public addListener<K extends keyof T>(
      event: K,
      callback: ListenerCallback<T[K]>,
      once: boolean = false
    ): ListenerInfo<K, T[K]>
  {
    const listener: ListenerInfo<K, T[K]> = {
      once: !!once,
      event,
      callback
    };
    this._listeners.push(listener);
    return listener;
  }

  /**
   * Removes an event listener.
   * @param listener The listener info object.
   * @returns True when the listener was found and removed.
   */
  public removeListener<K extends keyof T>(
      listener: ListenerInfo<K, T[K]>): boolean
  {
    const idx = this._listeners.indexOf(listener);
    if (idx == -1)
      return false;
    this._listeners.splice(idx, 1);
    return true;
  }

  /**
   * Fires an event.
   * @param event The name of the event.
   * @param args Arguments to pass to the listeners.
   * @returns The number of listeners ran.
   */
  public dispatchEvent<K extends keyof T>(
      event: K, ...args: T[K]): number
  {
    let num = 0;

    for (let i = this._listeners.length - 1; i >= 0; i--) {
      const l = this._listeners[i];

      if (l.event !== event)
        continue;
      num++;

      try {
        l.callback?.apply(this, args);
      }
      catch (e) {
        let msg = 'bricklib: Uncaught exception from an event listener';
        if (e?.stack)
          msg += '\n' + e.stack;
        console.error(msg);
      }

      if (l.once)
        this._listeners.splice(i, 1);
    }

    return num;
  }

  /**
   * Clear the listener queue.
   */
  public resetQueue(): void
  {
    this._listeners = [];
  }

  /**
   * Get the event names queued listeners are listening to.
   * @returns A list of event names.
   */
  public getEventNames(): (keyof T)[]
  {
    return Array.from(new Set(this._listeners.map(v => v.event)));
  }

  /**
   * Get the number of listeners of an event.
   * @param [event] The event name.
   * @returns The number of listeners of `event`, or the total number
   * of listeners in the queue if `event` is not given.
   */
  public numOfListeners(event?: keyof T): number
  {
    if (event == null || typeof event === 'undefined')
      return this._listeners.length;
    let num = 0;
    this._listeners.forEach(v => {
      if (v.event == event)
        num++;
    });
    return num;
  }

  /**
   * Alias for `this.addListener(event, callback, false)`.
   * @param event
   * @param callback
   * @returns ListenerCallback
   */
  public on<K extends keyof T>(
      event: K, callback: ListenerCallback<T[K]>): ListenerInfo<K, T[K]>
  {
    return this.addListener(event, callback, false);
  }

  /**
   * Alias for `this.addListener(event, callback, true)`.
   * @param event
   * @param callback
   * @returns ListenerCallback
   */
  public once<K extends keyof T>(
      event: K, callback: ListenerCallback<T[K]>): ListenerInfo<K, T[K]>
  {
    return this.addListener(event, callback, true);
  }

  /**
   * Alias for `this.removeListener(listener)`.
   * @param listener
   * @returns boolean
   */
  public off<K extends keyof T>(
      listener: ListenerInfo<K, T[K]>): boolean
  {
    return this.removeListener(listener);
  }

  /**
   * Alias for `this.dispatchEvent(event, ...args)`.
   * @param event
   * @param args
   * @returns number
   */
  public emit<K extends keyof T>(
      event: K, ...args: T[K]): number
  {
    return this.dispatchEvent(event, ...args);
  }
}
