/**
 * General utility functions.
 */

/**
 * Helper type for iterators.
 */
export type EntryOf<T> = { [K in keyof T]: [K, T[K]] }[keyof T];


/**
 * Calls a function and ignore exceptions.
 */
export function safeCall<A extends any[], R extends any>(
    fn: (...args: A) => R, ...args: A): R
{
  try {
    return fn(...args);
  } catch (e) {
    console.error(e);
  }
}

/**
 * Converts milliseconds (from Date.now()) to a human-friendly
 * time span string.
 * @param ms The milliseconds value.
 * @returns The span string.
 */
export function msToString(ms: number): string
{
  /* scale:
     sec           1,000 ms            1e+3
     min           60,000 ms           6e+4
     hour          3,600,000 ms        3.6e+6
     day           86,400,000 ms       8.64e+7
     week          604,800,000 ms      6.048e+8
     month  30d    2,592,000,000 ms    2.592e+9
     year   365d   31,536,000,000 ms   3.1536e+10
  */

  let txt = '';

  [
    { name: 'y',  ms: 3.1536e+10 },
    { name: 'mo', ms: 2.592e+9 },
    { name: 'w',  ms: 6.048e+8 },
    { name: 'd',  ms: 8.64e+7 },
    { name: 'h',  ms: 3.6e+6 },
    { name: 'm',  ms: 6e+4 },
    { name: 's',  ms: 1e+3 }
  ].forEach(v => {
      if (ms < v.ms) return;
      txt += ' ' + Math.floor(ms / v.ms) + v.name;
      ms = ms % v.ms;
    });

  return txt.slice(1);
}

/**
 * Compress a number into a short string.
 * @param n The number.
 * @returns The string.
 */
export function compressNumber(n: number): string
{
  if (!n)
    return '0';
  const prefixes = [ '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'R', 'Q' ];

  /* how many groups of 3 decimal places are there? */
  const magnitude = Math.floor(Math.log10(Math.abs(n)) / 3);
  const scaled = n / (10 ** (magnitude * 3));

  return scaled.toFixed(1) + prefixes[magnitude];
}

/**
 * Format a number with commas.
 * @param n The number.
 * @returns The string.
 */
export function formatNumber(n: number): string
{
  /* thx: https://stackoverflow.com/questions/2901102 */
  return n.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Convert a number into a roman numeral string.
 * @param n The number.
 * @returns The string.
 */
export function toRomanNumeral(num: number): string
{
  /* NOTES:
     - no negative
     - no decimals
     - no zeros
  */

  if (num > 3999 || num < 0)
    return num.toString();

  let txt = '';

  [
    { n: 1000, txt: 'M'  },
    { n:  900, txt: 'CM' },
    { n:  500, txt: 'D'  },
    { n:  400, txt: 'CD' },
    { n:  100, txt: 'C'  },
    { n:   90, txt: 'XC' },
    { n:   50, txt: 'L'  },
    { n:   40, txt: 'XL' },
    { n:   10, txt: 'X'  },
    { n:    9, txt: 'IX' },
    { n:    5, txt: 'V'  },
    { n:    4, txt: 'IV' },
    { n:    1, txt: 'I'  },
  ].forEach(v => {
      while (num >= v.n) {
        txt += v.txt;
        num -= v.n;
      }
    });

  return txt;
}

/**
 * Escape regular expression in strings.
 * @param string The string.
 * @returns String with regex escaped.
 */
export function escapeRegExp(str: string): string
{
  /* thx: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping */
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /* $& means the whole matched string */
}

/**
 * Generates a unique identifier (not meant for security-related stuff).
 * @returns A string.
 */
export function getUID(): string
{
  /* This is around: 2.273 x 10^57... */
  const charset = '0123456789' +
      'abcdefghijklmnopqrstuvwxyz' +
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let str = '';
  for (let i = 0; i < 32; i++)
    str += charset[Math.floor(Math.random() * charset.length)];
  return str;
}

/**
 * A regex for validating urls. Useful for whether filtering urls on chats,
 * or just highlighting them automatically. E-mails can match too! But it
 * isn't fully compliant with the RFC 3986 standard thing.
 *
 * Explanation:
 *
 * scheme
 * (?:[\w\d-]+:\/\/)?
 *
 * username
 * (?:[\w\d+_\.~-]+@)?
 *
 * host (dns and ipv4 part)
 * (?:(?:[\w\d_-]+\.)+[\w\d_-]+|
 *
 * host (ipv6 part)
 * \[[0-9a-fA-F:]+\])
 *
 * port
 * (?::\d+)?
 *
 * start of path
 * (?:\/
 *
 * dirs
 * (?:[^\s\/$.?#]+\/)*
 *
 * file
 * [^\s\/$.?#]*
 *
 * query (?a=b&c=d)
 * (?:\?(?:[^\s\/$.?#=]+\=[^\s\/$.?#=]+)+(?:&[^\s\/$.?#=]+=[^\s\/$.?#=]+)*)?
 *
 * fragment
 * (?:#[^\s\/$.?#]*)?
 *
 * end of path
 * )?
 *
 * @author me (vytdev)
 */
export const urlRegex = /(?:[\w\d-]+:\/\/)?(?:[\w\d+_\.~-]+@)?(?:(?:[\w\d_-]+\.)+[\w\d_-]+|\[[0-9a-fA-F:]+\])(?::\d+)?(?:\/(?:[^\s\/$.?#]+\/)*[^\s\/$.?#]*(?:\?(?:[^\s\/$.?#=]+\=[^\s\/$.?#=]+)+(?:&[^\s\/$.?#=]+=[^\s\/$.?#=]+)*)?(?:#[^\s\/$.?#]*)?)?/gi;
