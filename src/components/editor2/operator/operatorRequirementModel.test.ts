import { describe, expect, it } from 'vitest'

import {
  getMaxEliteForLevel,
  OPERATOR_LEVEL_MAX,
  OPERATOR_LEVEL_MIN,
} from './operatorRequirementModel'

describe('getMaxEliteForLevel', () => {
  it.each([
    [1, 0],
    [19, 0],
    [20, 1],
    [80, 13],
    [90, 15],
    [100, 17],
  ])('maps level %i to elite max %i', (level, expected) => {
    expect(getMaxEliteForLevel(level)).toBe(expected)
  })

  it('clamps out-of-range levels before calculating the cap', () => {
    expect(getMaxEliteForLevel(Number.NEGATIVE_INFINITY)).toBe(
      getMaxEliteForLevel(OPERATOR_LEVEL_MIN),
    )
    expect(getMaxEliteForLevel(Number.POSITIVE_INFINITY)).toBe(
      getMaxEliteForLevel(OPERATOR_LEVEL_MAX),
    )
  })
})
