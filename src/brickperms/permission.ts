/**
 * Base permission parsing and checking.
 */

/*
 Priority levels (e.g.: a.b.c):
 1. negated exact match             (-a.b.c)
 2. exact match                     (a.b.c)
 3. negated close match             (-a.b.*)
 4. close match                     (a.b.*)
 5. more specific negated ancestor  (-a.b)
 6. more specific ancestor          (a.b)
 7. less specific negated ancestor  (-a.*)
 8. less specific ancestor          (a.*)
 */


/**
 * Check if the permission node `perm` is allowed given the constraints in
 * `tagList`.
 * @param perm The perm node.
 * @param tagList Array of perm tags.
 * @returns True when matched, false otherwise.
 */
export function checkPerm(perm: string, tagList: string[]): boolean
{
  const permLvls = splitPermNodeLvls(perm);
  const permDepth = getPermDepth(perm);

  let lastSpec = 0;
  let lastMatched = false;

  for (const tag of tagList) {
    const tagToks = tokenizePermTag(tag);
    const negate = tagToks[0] == '-';

    if (!matchSpecs(permLvls, tagToks))
      continue;    /* unrelated tag (a.c.* has nothing to do with a.x.b) */

    /* exact match */
    if (!hasWildcard(tag) && negate && permDepth == getPermDepth(tag))
      return false;

    const tagSpec = getSpecificity(tagToks);
    if (tagSpec < lastSpec)
      continue;

    lastMatched = tagSpec == lastSpec
        ? (negate ? false : lastMatched) : !negate;
    lastSpec = tagSpec;
  }

  return lastMatched;
}

/**
 * Match permission node `perm` with tag `tag`, regardless of the
 * negation flag. This can match inheritance and wildcards.
 * @param perm The split-ed perm node.
 * @param tag The tokenized perm tag.
 * @returns True if match, false otherwise.
 */
export function matchSpecs(perm: string[], tag: string[]): boolean
{
  if (['+', '-'].includes(tag[0]))
    tag = tag.slice(1);
  if (tag.length > perm.length)
    return false;

  for (let i = 0; i < tag.length; i++) {
    const permLvl = perm[i];
    const tagLvl = tag[i];

    if (tagLvl == '*')
      continue;
    if (permLvl != tagLvl)
      return false;
  }

  return true;
}

/**
 * Check whether a permission tag has a wildcard.
 * @param tag The perm tag.
 * @returns True if tag includes a '*'.
 */
export function hasWildcard(tag: string): boolean
{
  return /(^[+-]?|\.)\*(\.|$)/.test(tag);
}

/**
 * Returns the specificity of a permission tag.
 * @param perm The tokenized perm tag.
 * @returns The specificity.
 */
export function getSpecificity(perm: string[]): number
{
  if (['+', '-'].includes(perm[0]))
    perm = perm.slice(1);
  let val = 0;

  /* 'a.*' > '*.b' */
  perm.forEach((lvl, idx) => {
    if (lvl == '*')
      val += (idx + 1) / (perm.length + 1);
    else
      val += (perm.length + 1) / (idx + 1);
  });

  return val;
}

/**
 * Returns the number of levels a permission node has.
 * @param perm The perm node.
 * @returns The number of levels.
 */
export function getPermDepth(perm: string): number
{
  let num = 1;
  for (const c of perm)
    if (c == '.')
      num++;
  return num;
}

/**
 * Tokenize a permission tag.
 * @param perm The perm tag.
 * @returns An array of perm tag tokens.
 */
export function tokenizePermTag(perm: string): string[]
{
  let result: string[] = [];

  if ('+-'.includes(perm[0])) {
    result = [ perm[0] ];
    perm = perm.slice(1);
  }

  return result.concat(perm.split('.'));
}

/**
 * Split a permission node's levels.
 * @param perm The perm node.
 * @returns An array of perm levels.
 * @throws This can throw errors.
 */
export function splitPermNodeLvls(perm: string): string[]
{
  if (hasWildcard(perm))
    throw new Error('Permission nodes cannot have wildcards');
  return perm.split('.');
}
