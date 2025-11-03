import snakeCaseKeys from 'snakecase-keys'

/**
 * Wrapper around `snakecase-keys` that prevents it from stripping out non-ASCII keys.
 *
 * Note: no need to do this for `camelcase-keys`, it works fine.
 */
export const snakeCaseKeysUnicode = ((
  input: any,
  options?: snakeCaseKeys.Options,
) => {
  // a regex that is supposed to match nothing, which prevents `snake-case` from
  // using its default regex to strip out non-word characters (including non ASCII characters)
  // see: https://github.com/blakeembrey/change-case/blob/040a079f007879cb0472ba4f7cc2e1d3185e90ba/packages/no-case/src/index.ts#L14
  const unmatchableRegex = /^\x00\x01/ // eslint-disable-line no-control-regex

  return snakeCaseKeys(input, {
    ...options,
    parsingOptions: {
      ...options?.parsingOptions,
      stripRegexp: unmatchableRegex,
    },
  })
}) as typeof snakeCaseKeys

/**
 * Like snakeCaseKeysUnicode but stops recursion for specified subtree keys.
 * Default excluded keys: actions / simingActions / siming_actions.
 */
export const snakeCaseKeysUnicodeExceptSubtrees = (
  input: any,
  excludedKeys: readonly string[] = ['actions', 'simingActions', 'siming_actions'],
): any => {
  const excluded = new Set(excludedKeys)

  const isPlainObject = (v: any) =>
    typeof v === 'object' && v !== null && !Array.isArray(v)

  const transform = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map((item) => (isPlainObject(item) || Array.isArray(item) ? transform(item) : item))
    }
    if (!isPlainObject(value)) return value

    // only snake current level keys; handle children manually so we can stop under excluded keys
    const shallowSnaked = snakeCaseKeysUnicode(value, { deep: false }) as Record<string, any>
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(shallowSnaked)) {
      if (excluded.has(k)) {
        // Special case: if actions is an array, keep transforming children to maintain field casing
        if (k === 'actions' && Array.isArray(v)) {
          out[k] = transform(v)
        } else {
          out[k] = v
        }
      } else if (isPlainObject(v) || Array.isArray(v)) {
        out[k] = transform(v)
      } else {
        out[k] = v
      }
    }
    return out
  }

  return transform(input)
}
