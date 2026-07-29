import {
  OperatorStarStonePresetRes,
  StarStonePresetKind,
} from 'maa-copilot-client'

import {
  OperatorStarPreset,
  OperatorStarStonePresetSet,
  StarPresetValues,
} from '../../../data/operator-star-stone-presets'
import {
  ASSIST_STAR_OPTIONS,
  AssistStarName,
  MAIN_STAR_OPTIONS,
  MainStarName,
} from '../../../data/star-stones'

export interface UserOperatorStarPreset<
  T extends string,
> extends OperatorStarPreset<T> {
  serverId: string
}

export interface UserOperatorStarStonePresetSet extends OperatorStarStonePresetSet {
  mainStarPresets: UserOperatorStarPreset<MainStarName>[]
  assistStarPresets: UserOperatorStarPreset<AssistStarName>[]
}

function normalizeValues<T extends string>(
  values: (string | null)[],
  options: readonly T[],
): StarPresetValues<T> | undefined {
  if (values.length !== 3) return undefined

  const normalized = values.map((value) => value ?? undefined)
  if (!normalized.some(Boolean)) return undefined
  if (
    !normalized.every(
      (value): value is T | undefined =>
        value === undefined || options.includes(value as T),
    )
  ) {
    return undefined
  }

  return normalized as unknown as StarPresetValues<T>
}

export function getUserOperatorStarStonePresetSet(
  presets: OperatorStarStonePresetRes[] | undefined,
  operatorId: string,
): UserOperatorStarStonePresetSet {
  const result: UserOperatorStarStonePresetSet = {
    mainStarPresets: [],
    assistStarPresets: [],
  }

  for (const preset of presets ?? []) {
    if (preset.operatorId !== operatorId) continue

    if (preset.kind === StarStonePresetKind.Main) {
      const values = normalizeValues(preset.values, MAIN_STAR_OPTIONS)
      if (values) {
        result.mainStarPresets.push({
          id: `user:${preset.id}`,
          serverId: preset.id,
          label: preset.label,
          values,
        })
      }
    } else if (preset.kind === StarStonePresetKind.Assist) {
      const values = normalizeValues(preset.values, ASSIST_STAR_OPTIONS)
      if (values) {
        result.assistStarPresets.push({
          id: `user:${preset.id}`,
          serverId: preset.id,
          label: preset.label,
          values,
        })
      }
    }
  }

  return result
}
