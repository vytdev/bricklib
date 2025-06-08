/**
 * Bricklib configuration.
 */

export default {

  /**
   * Whether to enable multithreading.
   */
  multithreading:            true,

  /**
   * Number of thread tasks to execute per tick.
   */
  numOfThreadTasksPerTick:   512,

  /**
   * Number of Minecraft commands to execute from the command queue, each tick.
   */
  commandBuffer:             128,

} as const;
