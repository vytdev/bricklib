/**
 * Plugin manager for bricklib.
 */

const registry: Map<string, Plugin> = new Map();

/**
 * @class
 * Plugin instance class.
 */
export class Plugin
{
  /**
   * @constructor
   * Make a new Plugin instance.
   * @param fn The setup function.
   */
  constructor(fn: PluginFunc)
  {
    this.setup = fn;
  }

  /**
   * The identifier of the plugin (if registered).
   */
  public id: string = null;

  /**
   * The function to execute when loading the plugin.
   */
  public setup: PluginFunc = null;

  /**
   * The function to execute when unloading the plugin.
   */
  public teardown: PluginFunc = null;

  /**
   * Whether the plugin is already loaded (don't modify).
   */
  public loaded: boolean = false;

  /**
   * Add this plugin to the registry.
   * @returns Itself.
   * @throws This function can throw errors.
   */
  public register(id: string): this
  {
    if (this.id != null)
      throw new Error('Plugin already registered!');
    if (doesExist(id))
      throw new Error('Plugin already exists: ' + id);
    registry.set(id, this);
    this.id = id;
    return this;
  }

  /**
   * Remove this plugin from the registry.
   * @returns Itself.
   */
  public deregister(): this
  {
    if (this.id != null && getPlugin(this.id) === this)
      registry.delete(this.id);
    return this;
  }
}

/**
 * Loads a plugin. You may use this if your plugin depends on another plugin,
 * to make sure everything is properly initialized.
 * @param id The plugin's identifier.
 * @throws This function can throw errors.
 */
export function loadPlugin(id: string): void
{
  const plg = registry.get(id);
  if (!plg) throw new ReferenceError('No such plugin: ' + id);
  if (plg.loaded) return;
  plg.loaded = true;
  plg.setup(plg);
}

/**
 * Unloads a plugin by calling its teardown function.
 * @param id The plugin's identifier.
 * @throws This function can throw errrors.
 */
export function unloadPlugin(id: string): void
{
  const plg = registry.get(id);
  if (!plg) throw new ReferenceError('No such plugin: ' + id);
  if (!plg.loaded) return;
  plg.teardown?.(plg);
  plg.loaded = false;
}

/**
 * Checks if a plugin exists on the registry.
 * @param id The plugin identifier to lookup.
 * @returns True if the plugin exists, false otherwise.
 */
export function doesExist(id: string): boolean
{
  return registry.has(id);
}

/**
 * Get the plugin instance of a plugin with identifier `id`.
 * @param id The plugin's identifier.
 * @returns The Plugin instance or null.
 */
export function getPlugin(id: string): Plugin | null
{
  return registry.get(id) ?? null; /* null, not undefined */
}

/**
 * Make and register new plugin.
 * @param id The identifier of the plugin.
 * @param fn The setup function.
 * @returns The plugin instance.
 * @throws This function can throw errors.
 */
export function newPlugin(id: string, fn: PluginFunc): Plugin
{
  return new Plugin(fn).register(id);
}

/**
 * A plugin function.
 */
export type PluginFunc = (self: Plugin) => void;
