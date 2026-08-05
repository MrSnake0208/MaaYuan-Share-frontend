import { describe, expect, it } from 'vitest'

import type { EditorOperator } from '../types'
import {
  applyOperatorTrainingConfig,
  operatorTrainingConfigFingerprint,
  toOperatorTrainingConfig,
} from './operatorTrainingConfigModel'

const operator: EditorOperator = {
  id: 'operator-1',
  name: '测试密探',
  skill: 1,
  skillUsage: 2,
  requirements: { level: 40, elite: 5 },
  discsSelected: [1, 2, 3],
  extensions: {
    version: 1,
    discs: { slots: [{ index: 0, disc: 1 }] },
    stats: { starLevel: 4, attack: 800, hp: 2600 },
  },
}

describe('operatorTrainingConfigModel', () => {
  it('serializes displayed training defaults with editor stats', () => {
    expect(toOperatorTrainingConfig(operator)).toEqual({
      operatorId: '测试密探',
      starLevel: 4,
      level: 40,
      elite: 5,
      skillLevel: 10,
      potentiality: 1,
      module: -1,
      skill: 1,
      attack: 800,
      hp: 2600,
      discs: {
        selected: [1, 2, 3],
        confirmed: [true, true, true],
        starStones: ['', '', ''],
        assistStars: ['', '', ''],
      },
    })
  })

  it('applies training and disc fields without replacing operation-only fields', () => {
    const result = applyOperatorTrainingConfig(operator, {
      operatorId: '测试密探',
      starLevel: 5,
      level: 60,
      elite: 10,
      skillLevel: 9,
      potentiality: 6,
      module: 1,
      skill: 2,
      attack: 950,
      hp: 3200,
      discs: {
        selected: [3, 0, 1],
        confirmed: [true, true, true],
        starStones: ['天府', '', '巨门'],
        assistStars: ['红鸾', '', '天魁'],
      },
    })

    expect(result).toMatchObject({
      id: 'operator-1',
      skill: 2,
      skillUsage: 2,
      starLevel: 5,
      attack: 950,
      hp: 3200,
      requirements: {
        level: 60,
        elite: 10,
        skillLevel: 9,
        potentiality: 6,
        module: 1,
      },
    })
    expect(result.extensions?.stats).toEqual({
      starLevel: 5,
      attack: 950,
      hp: 3200,
    })
    expect(result.discsSelected).toEqual([3, 0, 1])
    expect(result.discStarStones).toEqual(['天府', '', '巨门'])
    expect(result.discAssistStars).toEqual(['红鸾', '', '天魁'])
    expect(result.extensions?.discs?.slots).toMatchObject([
      { index: 0, disc: 3, discConfirmed: true },
      { index: 1, disc: 0, discConfirmed: true },
      { index: 2, disc: 1, discConfirmed: true },
    ])
  })

  it('keeps existing values when an older server profile omits fields', () => {
    const result = applyOperatorTrainingConfig(operator, {
      operatorId: '测试密探',
      level: 50,
    })

    expect(result.requirements).toEqual({ level: 50, elite: 5 })
    expect(result.extensions).toEqual(operator.extensions)
    expect(result.skill).toBe(1)
  })

  it('ignores response-only timestamps when comparing profiles', () => {
    const request = toOperatorTrainingConfig(operator)
    expect(
      operatorTrainingConfigFingerprint({
        ...request,
        updateTime: new Date('2026-08-05T00:00:00Z'),
      }),
    ).toBe(operatorTrainingConfigFingerprint(request))
  })

  it('treats normalized empty star slots as the same profile', () => {
    const request = toOperatorTrainingConfig(operator)
    expect(
      operatorTrainingConfigFingerprint({
        ...request,
        discs: {
          ...request.discs!,
          starStones: [null, null, null] as unknown as string[],
          assistStars: [null, null, null] as unknown as string[],
        },
        updateTime: new Date('2026-08-05T00:00:00Z'),
      }),
    ).toBe(operatorTrainingConfigFingerprint(request))
  })
})
