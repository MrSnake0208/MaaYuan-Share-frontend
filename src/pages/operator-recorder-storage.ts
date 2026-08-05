const STORAGE_VERSION = 2
const STORAGE_KEY_PREFIX = 'maa-copilot-operator-recorder'

interface StoredOperatorRecorderState {
  activeBoxId: string
  version: typeof STORAGE_VERSION
}

export function getOperatorRecorderStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${encodeURIComponent(userId)}`
}

export function loadOperatorRecorderActiveBoxId(
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
      !('activeBoxId' in parsed) ||
      typeof parsed.activeBoxId !== 'string'
    ) {
      return ''
    }
    return parsed.activeBoxId
  } catch {
    return ''
  }
}

export function saveOperatorRecorderActiveBoxId(
  userId: string,
  activeBoxId: string,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  const value: StoredOperatorRecorderState = {
    activeBoxId,
    version: STORAGE_VERSION,
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
