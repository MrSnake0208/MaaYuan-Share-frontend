import type {
  OperatorBoxMember,
  OperatorBoxPresetRes,
} from 'maa-copilot-client'

import type { OperatorFilterData } from '../store/selectedOperators'

export function toOperatorBoxMembers(operatorKeys: string[]) {
  const normalizedKeys = operatorKeys
    .map((key) => key.trim())
    .filter((key) => key.length > 0)
  return Array.from(new Set<string>(normalizedKeys)).map<OperatorBoxMember>(
    (operatorKey, order) => ({ operatorKey, order }),
  )
}

export function getOperatorBoxKeys(
  preset: Pick<OperatorBoxPresetRes, 'members'>,
) {
  const normalizedKeys = [...preset.members]
    .sort((a, b) => a.order - b.order)
    .map((member) => member.operatorKey.trim())
    .filter((key) => key.length > 0)
  return Array.from(new Set<string>(normalizedKeys))
}

export function applyOperatorBoxPresetToFilter(
  filter: OperatorFilterData,
  preset: Pick<OperatorBoxPresetRes, 'members'>,
): OperatorFilterData {
  return {
    ...filter,
    included: getOperatorBoxKeys(preset),
    excluded: [],
    enabled: true,
  }
}
