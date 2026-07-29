import { StarStonePresetKind } from 'maa-copilot-client'
import { describe, expect, it } from 'vitest'

import { getUserOperatorStarStonePresetSet } from './operatorStarStonePresetModel'

const createPreset = (
  overrides: Partial<{
    id: string
    operatorId: string
    kind: StarStonePresetKind
    label: string
    values: (string | null)[]
  }> = {},
) => ({
  id: 'preset-1',
  operatorId: 'char_001',
  kind: StarStonePresetKind.Main,
  label: '常用主星',
  values: ['天府', null, '巨门'],
  createTime: new Date('2026-01-01T00:00:00Z'),
  updateTime: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
})

describe('operatorStarStonePresetModel', () => {
  it('groups server presets by operator and kind while preserving slots', () => {
    const result = getUserOperatorStarStonePresetSet(
      [
        createPreset(),
        createPreset({
          id: 'preset-2',
          kind: StarStonePresetKind.Assist,
          label: '常用辅星',
          values: ['文昌', null, null],
        }),
        createPreset({ id: 'other', operatorId: 'char_002' }),
      ],
      'char_001',
    )

    expect(result.mainStarPresets).toEqual([
      {
        id: 'user:preset-1',
        serverId: 'preset-1',
        label: '常用主星',
        values: ['天府', undefined, '巨门'],
      },
    ])
    expect(result.assistStarPresets[0]?.values).toEqual([
      '文昌',
      undefined,
      undefined,
    ])
  })

  it('drops malformed or unknown server values', () => {
    const result = getUserOperatorStarStonePresetSet(
      [
        createPreset({ id: 'short', values: ['天府'] }),
        createPreset({ id: 'unknown', values: ['不存在的星石', null, null] }),
        createPreset({ id: 'empty', values: [null, null, null] }),
      ],
      'char_001',
    )

    expect(result.mainStarPresets).toEqual([])
  })
})
