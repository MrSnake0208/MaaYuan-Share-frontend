import type { OperatorDiscPresetRes } from 'maa-copilot-client'
import { describe, expect, it } from 'vitest'

import { getUserOperatorDiscPresets } from './operatorDiscPresetModel'

const createPreset = (
  overrides: Partial<OperatorDiscPresetRes> = {},
): OperatorDiscPresetRes => ({
  id: 'preset-1',
  operatorId: 'char_001',
  label: '常用命盘',
  selected: [1, 0, -3],
  confirmed: [true, true, true],
  createTime: new Date('2026-01-01T00:00:00Z'),
  updateTime: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
})

describe('operatorDiscPresetModel', () => {
  it('keeps valid presets for the requested operator', () => {
    const result = getUserOperatorDiscPresets(
      [createPreset(), createPreset({ id: 'other', operatorId: 'char_002' })],
      'char_001',
      4,
    )

    expect(result).toEqual([
      {
        id: 'user:preset-1',
        serverId: 'preset-1',
        label: '常用命盘',
        selected: [1, 0, -3],
        confirmed: [true, true, true],
      },
    ])
  })

  it('drops malformed, unavailable, or duplicate disc values', () => {
    const result = getUserOperatorDiscPresets(
      [
        createPreset({ id: 'short', selected: [1] }),
        createPreset({ id: 'unavailable', selected: [5, 0, 0] }),
        createPreset({ id: 'duplicate', selected: [2, -2, 0] }),
        createPreset({
          id: 'unconfirmed',
          selected: [1, 0, 0],
          confirmed: [false, false, false],
        }),
      ],
      'char_001',
      4,
    )

    expect(result).toEqual([])
  })
})
