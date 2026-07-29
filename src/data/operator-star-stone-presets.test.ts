import { describe, expect, it } from 'vitest'

import { OPERATORS } from '../models/operator'
import {
  ASSIST_STAR_OPTIONS,
  MAIN_STAR_OPTIONS,
  OPERATOR_STAR_STONE_PRESETS,
} from './operator-star-stone-presets'

describe('operator star-stone presets', () => {
  it('references known operators and valid unique values', () => {
    const operatorIds = new Set(OPERATORS.map((operator) => operator.id))

    for (const [operatorId, presetSet] of Object.entries(
      OPERATOR_STAR_STONE_PRESETS,
    )) {
      expect(
        operatorIds.has(operatorId),
        `unknown operator: ${operatorId}`,
      ).toBe(true)

      const mainPresetIds = new Set<string>()
      for (const preset of presetSet.mainStarPresets) {
        expect(
          mainPresetIds.has(preset.id),
          `duplicate main preset: ${preset.id}`,
        ).toBe(false)
        mainPresetIds.add(preset.id)
        expect(preset.values.length).toBeGreaterThanOrEqual(1)
        expect(preset.values.length).toBeLessThanOrEqual(3)
        expect(
          preset.values.every((value) => MAIN_STAR_OPTIONS.includes(value)),
        ).toBe(true)
        const selectedValues = preset.values.filter((value) => value !== '任意')
        expect(new Set(selectedValues).size).toBe(selectedValues.length)
      }

      const assistPresetIds = new Set<string>()
      for (const preset of presetSet.assistStarPresets) {
        expect(
          assistPresetIds.has(preset.id),
          `duplicate assist preset: ${preset.id}`,
        ).toBe(false)
        assistPresetIds.add(preset.id)
        expect(preset.values.length).toBeGreaterThanOrEqual(1)
        expect(preset.values.length).toBeLessThanOrEqual(3)
        expect(
          preset.values.every((value) => ASSIST_STAR_OPTIONS.includes(value)),
        ).toBe(true)
        const selectedValues = preset.values.filter((value) => value !== '任意')
        expect(new Set(selectedValues).size).toBe(selectedValues.length)
      }
    }
  })
})
