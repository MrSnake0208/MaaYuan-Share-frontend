import type { OperatorDiscPresetRes } from 'maa-copilot-client'

export type DiscPresetSelected = readonly [number, number, number]
export type DiscPresetConfirmed = readonly [boolean, boolean, boolean]

export interface UserOperatorDiscPreset {
  id: string
  serverId: string
  label: string
  selected: DiscPresetSelected
  confirmed: DiscPresetConfirmed
}

function normalizePreset(
  preset: OperatorDiscPresetRes,
  discCount: number,
): UserOperatorDiscPreset | undefined {
  if (preset.selected.length !== 3 || preset.confirmed.length !== 3) {
    return undefined
  }
  if (!preset.selected.every(Number.isInteger) || !preset.confirmed.some(Boolean)) {
    return undefined
  }
  if (
    preset.selected.some(
      (value, index) =>
        (!preset.confirmed[index] && value !== 0) ||
        Math.abs(value) > discCount,
    )
  ) {
    return undefined
  }
  const discIds = preset.selected
    .filter((value) => value !== 0)
    .map(Math.abs)
  if (new Set(discIds).size !== discIds.length) return undefined

  return {
    id: `user:${preset.id}`,
    serverId: preset.id,
    label: preset.label,
    selected: preset.selected as unknown as DiscPresetSelected,
    confirmed: preset.confirmed as unknown as DiscPresetConfirmed,
  }
}

export function getUserOperatorDiscPresets(
  presets: OperatorDiscPresetRes[] | undefined,
  operatorId: string,
  discCount: number,
): UserOperatorDiscPreset[] {
  return (presets ?? [])
    .filter((preset) => preset.operatorId === operatorId)
    .map((preset) => normalizePreset(preset, discCount))
    .filter((preset): preset is UserOperatorDiscPreset => !!preset)
}
