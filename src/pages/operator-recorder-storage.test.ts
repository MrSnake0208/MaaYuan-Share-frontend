import { describe, expect, it, vi } from 'vitest'

import {
  getOperatorRecorderStorageKey,
  loadOperatorRecorderActiveBoxId,
  saveOperatorRecorderActiveBoxId,
} from './operator-recorder-storage'

describe('operator recorder storage', () => {
  it('stores and restores the active Box per user', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }

    saveOperatorRecorderActiveBoxId('user/name', 'box-a', storage)

    expect(values.get(getOperatorRecorderStorageKey('user/name'))).toBe(
      JSON.stringify({ activeBoxId: 'box-a', version: 2 }),
    )
    expect(loadOperatorRecorderActiveBoxId('user/name', storage)).toBe('box-a')
  })

  it.each([
    null,
    '{',
    JSON.stringify({ version: 1, operatorNames: ['密探甲'] }),
    JSON.stringify({ activeBoxId: 1, version: 2 }),
  ])('ignores invalid or legacy data: %s', (value) => {
    expect(
      loadOperatorRecorderActiveBoxId('user-1', {
        getItem: vi.fn(() => value),
      }),
    ).toBe('')
  })

  it('does not fail when storage rejects writes', () => {
    expect(() =>
      saveOperatorRecorderActiveBoxId('user-1', 'box-a', {
        setItem: () => {
          throw new Error('unavailable')
        },
      }),
    ).not.toThrow()
  })
})
