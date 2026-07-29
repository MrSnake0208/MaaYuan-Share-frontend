import { describe, expect, it } from 'vitest'

import { OPERATORS } from '../models/operator'
import { OPERATOR_STAR_STONE_PRESETS } from './operator-star-stone-presets'
import {
  ASSIST_STAR_OPTIONS,
  AssistStarName,
  MAIN_STAR_OPTIONS,
  MainStarName,
  getAssistStarAvailability,
  getMainStarAvailability,
} from './star-stones'

describe('operator star-stone presets', () => {
  it('references known operators and valid unique values', () => {
    const operatorIds = new Set(OPERATORS.map((operator) => operator.id))
    const operatorsById = new Map(
      OPERATORS.map((operator) => [operator.id, operator]),
    )

    for (const [operatorId, presetSet] of Object.entries(
      OPERATOR_STAR_STONE_PRESETS,
    )) {
      expect(
        operatorIds.has(operatorId),
        `unknown operator: ${operatorId}`,
      ).toBe(true)
      if (!presetSet) continue
      const operator = operatorsById.get(operatorId)
      expect(operator).toBeDefined()
      if (!operator) continue

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
          preset.values.every(
            (value) => value === undefined || MAIN_STAR_OPTIONS.includes(value),
          ),
        ).toBe(true)
        const selectedValues = preset.values.filter(
          (value): value is MainStarName =>
            value !== undefined && value !== '任意',
        )
        expect(new Set(selectedValues).size).toBe(selectedValues.length)
        for (const value of preset.values) {
          if (value) {
            expect(
              getMainStarAvailability(value, operator).available,
              `${operator.name} cannot use ${value}`,
            ).toBe(true)
          }
        }
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
          preset.values.every(
            (value) =>
              value === undefined || ASSIST_STAR_OPTIONS.includes(value),
          ),
        ).toBe(true)
        const selectedValues = preset.values.filter(
          (value): value is AssistStarName =>
            value !== undefined && value !== '任意',
        )
        expect(new Set(selectedValues).size).toBe(selectedValues.length)
        for (const value of preset.values) {
          if (value) {
            expect(
              getAssistStarAvailability(value, operator).available,
              `${operator.name} cannot use ${value}`,
            ).toBe(true)
          }
        }
      }
    }
  })
})
