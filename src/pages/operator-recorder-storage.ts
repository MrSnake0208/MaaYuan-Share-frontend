const STORAGE_VERSION = 1
const STORAGE_KEY_PREFIX = 'maa-copilot-operator-recorder'

interface StoredOperatorSelection {
  version: typeof STORAGE_VERSION
  operatorNames: string[]
}

export function getOperatorRecorderStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${encodeURIComponent(userId)}`
}

export function loadOperatorRecorderSelection(
  userId: string,
  storage: Pick<Storage, 'getItem'> = window.localStorage,
) {
  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(getOperatorRecorderStorageKey(userId)) ?? 'null',
    )
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('version' in parsed) ||
      parsed.version !== STORAGE_VERSION ||
      !('operatorNames' in parsed) ||
      !Array.isArray(parsed.operatorNames)
    ) {
      return []
    }

    return Array.from(
      new Set(
        parsed.operatorNames.filter(
          (name): name is string =>
            typeof name === 'string' && name.length > 0,
        ),
      ),
    )
  } catch {
    return []
  }
}

export function saveOperatorRecorderSelection(
  userId: string,
  operatorNames: string[],
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  const value: StoredOperatorSelection = {
    version: STORAGE_VERSION,
    operatorNames: Array.from(new Set(operatorNames)),
  }

  try {
    storage.setItem(
      getOperatorRecorderStorageKey(userId),
      JSON.stringify(value),
    )
  } catch {
    // Storage may be unavailable in private browsing or embedded environments.
  }
}
