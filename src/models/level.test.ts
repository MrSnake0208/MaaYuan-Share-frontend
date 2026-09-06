import { describe, expect, it } from 'vitest'

import { isLevelWithinTimeRange } from './level'

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
