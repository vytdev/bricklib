/**
 * Formatting codes.
 * reference: https://minecraft.fandom.com/wiki/Formatting_codes
 */

/**
 * Enum of format codes.
 */
export const enum formats {
  /* colors */
  black = '\u00A70',
  dark_blue = '\u00A71',
  dark_green = '\u00A72',
  dark_aqua = '\u00A73',
  dark_red = '\u00A74',
  dark_purple = '\u00A75',
  gold = '\u00A76',
  gray = '\u00A77',
  dark_gray = '\u00A78',
  blue = '\u00A79',
  green = '\u00A7a',
  aqua = '\u00A7b',
  red = '\u00A7c',
  light_purple = '\u00A7d',
  yellow = '\u00A7e',
  white = '\u00A7f',
  
  /* bedrock only */
  minecoin_gold = '\u00A7g',
  material_quartz = '\u00A7h',
  material_iron = '\u00A7i',
  material_netherite = '\u00A7j',
  material_redstone = '\u00A7m',
  material_copper = '\u00A7n',
  material_gold = '\u00A7p',
  material_emerald = '\u00A7q',
  material_diamond = '\u00A7s',
  material_lapis = '\u00A7t',
  material_amethyst = '\u00A7u',

  /* formatting */
  obfuscate = '\u00A7k',
  bold = '\u00A7l',
  italic = '\u00A7o',
  reset = '\u00A7r',
  /* java only */
  strikethrough = '\u00A7m',
  underline = '\u00A7n',

  /* custom */
  notosans = '\u00A7\u00B6', /* force noto sans font */
}

/**
 * Remove all format codes in a string.
 * @param text The string.
 * @return The string with format codes removed.
 */
export function removeFormatCodes(text: string): string {
  return text.replace(/\u00A7./g, '');
}
