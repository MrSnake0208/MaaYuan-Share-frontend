import { getDiscSlots } from '../operator/operatorDiscModel'
import type { EditorMetadata, EditorOperation } from '../types'

export type OriginalOperatorRequiredField = 'starLevel' | 'disc' | 'starStone'

export interface OriginalOperatorValidationIssue {
  operatorId: string
  operatorName: string
  fields: OriginalOperatorRequiredField[]
}

export function validateOriginalOperatorRequirements(
  metadata: EditorMetadata,
  operation: Pick<EditorOperation, 'opers' | 'groups'>,
): OriginalOperatorValidationIssue[] {
  if (metadata.sourceType !== 'original') {
    return []
  }

  const operators = [
    ...operation.opers,
    ...operation.groups.flatMap((group) => group.opers),
  ]

  return operators.flatMap((operator) => {
    const fields: OriginalOperatorRequiredField[] = []
    const starLevel =
      operator.extensions?.stats?.starLevel ?? operator.starLevel ?? 0
    const slots = getDiscSlots(operator)

    if (!Number.isFinite(starLevel) || starLevel <= 0) {
      fields.push('starLevel')
    }
    if (!slots.every((slot) => slot.disc !== 0 || slot.discConfirmed)) {
      fields.push('disc')
    }
    if (!slots.every((slot) => Boolean(slot.starStone?.trim()))) {
      fields.push('starStone')
    }

    return fields.length > 0
      ? [
          {
            operatorId: operator.id,
            operatorName: operator.name,
            fields,
          },
        ]
      : []
  })
}
