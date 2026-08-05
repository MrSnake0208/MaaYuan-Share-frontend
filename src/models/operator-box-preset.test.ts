import { describe, expect, it } from 'vitest'

import {
  applyOperatorBoxPresetToFilter,
  getOperatorBoxKeys,
  toOperatorBoxMembers,
} from './operator-box-preset'

describe('operator box presets', () => {
  it('normalizes unique members in display order', () => {
    expect(toOperatorBoxMembers(['密探甲', ' 密探乙 ', '密探甲'])).toEqual([
      { operatorKey: '密探甲', order: 0 },
      { operatorKey: '密探乙', order: 1 },
    ])
  })

  it('reads members in their stored order', () => {
    expect(
      getOperatorBoxKeys({
        members: [
          { operatorKey: '密探乙', order: 4 },
          { operatorKey: '密探甲', order: 1 },
        ],
      }),
    ).toEqual(['密探甲', '密探乙'])
  })

  it('applies a box without changing the remember preference', () => {
    expect(
      applyOperatorBoxPresetToFilter(
        {
          included: ['旧密探'],
          excluded: ['排除密探'],
          enabled: false,
          save: true,
        },
        {
          members: [
            { operatorKey: '密探甲', order: 0 },
            { operatorKey: '密探乙', order: 1 },
          ],
        },
      ),
    ).toEqual({
      included: ['密探甲', '密探乙'],
      excluded: [],
      enabled: true,
      save: true,
    })
  })
})
