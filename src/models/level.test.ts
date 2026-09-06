import { describe, expect, it } from 'vitest'

import { getNextLevelEndTime, isLevelWithinTimeRange } from './level'

describe('isLevelWithinTimeRange', () => {
  const endTime = Date.parse('2026-09-30T23:59:59+08:00')

  it('keeps an operation visible through the end boundary', () => {
    const level = {
      endTime: '2026-09-30T23:59:59+08:00',
    }

    expect(isLevelWithinTimeRange(level, endTime - 1)).toBe(true)
    expect(isLevelWithinTimeRange(level, endTime)).toBe(true)
    expect(isLevelWithinTimeRange(level, endTime + 1)).toBe(false)
  })

  it('keeps unbounded and invalid end times visible', () => {
    expect(isLevelWithinTimeRange({})).toBe(true)
    expect(
      isLevelWithinTimeRange({ endTime: '2026-09-30T23:59:59+08:00' }, endTime),
    ).toBe(true)
    expect(isLevelWithinTimeRange({ endTime: 'invalid' }, endTime)).toBe(true)
    expect(isLevelWithinTimeRange({ endTime: 123 as never }, endTime)).toBe(
      true,
    )
  })
})

describe('getNextLevelEndTime', () => {
  const first = Date.parse('2026-09-30T23:59:59+08:00')
  const second = Date.parse('2026-10-01T00:00:10+08:00')

  it('returns the nearest current or future boundary', () => {
    const levels = [
      { endTime: 'invalid' },
      { endTime: '2026-09-30T23:59:59+08:00' },
      { endTime: '2026-10-01T00:00:10+08:00' },
      {},
    ]

    expect(getNextLevelEndTime(levels, first - 1)).toBe(first)
    expect(getNextLevelEndTime(levels, first)).toBe(first)
    expect(getNextLevelEndTime(levels, first + 1)).toBe(second)
    expect(getNextLevelEndTime(levels, second + 1)).toBeUndefined()
  })
})
