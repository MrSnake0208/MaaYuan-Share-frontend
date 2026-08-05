import type {
  OperatorTrainingConfigRes,
  OperatorTrainingConfigSaveReq,
} from 'maa-copilot-client'

import { CopilotDocV1 } from '../../../models/copilot.schema'
import {
  findOperatorByName,
  withDefaultRequirements,
} from '../../../models/operator'
import type { EditorOperator } from '../types'
import { getDiscSlots, setDiscSlot } from './operatorDiscModel'

export type OperatorTrainingProfile = Omit<
  OperatorTrainingConfigRes,
  'updateTime'
>

export function toOperatorTrainingConfig(
  operator: EditorOperator,
): OperatorTrainingConfigSaveReq {
  const info = findOperatorByName(operator.name)
  const requirements = withDefaultRequirements(
    operator.requirements,
    info?.rarity,
  )
  const stats = operator.extensions?.stats
  const discSlots = getDiscSlots(operator)

  return {
    operatorId: operator.name,
    starLevel: stats?.starLevel ?? operator.starLevel ?? 0,
    level: requirements.level,
    elite: requirements.elite,
    skillLevel: requirements.skillLevel,
    potentiality: requirements.potentiality,
    module: requirements.module,
    skill: operator.skill,
    attack: stats?.attack ?? operator.attack ?? 0,
    hp: stats?.hp ?? operator.hp ?? 0,
    discs: {
      selected: discSlots.map((slot) => slot.disc),
      confirmed: discSlots.map((slot) => slot.discConfirmed ?? false),
      starStones: discSlots.map((slot) => slot.starStone || ''),
      assistStars: discSlots.map((slot) => slot.assistStar || ''),
    },
  }
}

export function applyOperatorTrainingConfig(
  operator: EditorOperator,
  config: OperatorTrainingProfile,
): EditorOperator {
  const requirements = {
    ...operator.requirements,
    ...(config.level !== undefined ? { level: config.level } : {}),
    ...(config.elite !== undefined ? { elite: config.elite } : {}),
    ...(config.skillLevel !== undefined
      ? { skillLevel: config.skillLevel }
      : {}),
    ...(config.potentiality !== undefined
      ? { potentiality: config.potentiality }
      : {}),
    ...(config.module !== undefined
      ? { module: config.module as CopilotDocV1.Module }
      : {}),
  }
  const hasStats =
    config.starLevel !== undefined ||
    config.attack !== undefined ||
    config.hp !== undefined
  const stats = {
    ...operator.extensions?.stats,
    ...(config.starLevel !== undefined
      ? { starLevel: config.starLevel }
      : {}),
    ...(config.attack !== undefined ? { attack: config.attack } : {}),
    ...(config.hp !== undefined ? { hp: config.hp } : {}),
  }

  let next: EditorOperator = {
    ...operator,
    ...(config.skill !== undefined ? { skill: config.skill } : {}),
    ...(config.starLevel !== undefined
      ? { starLevel: config.starLevel }
      : {}),
    ...(config.attack !== undefined ? { attack: config.attack } : {}),
    ...(config.hp !== undefined ? { hp: config.hp } : {}),
    requirements,
    ...(hasStats
      ? {
          extensions: {
            version: 1 as const,
            ...operator.extensions,
            stats,
          },
        }
      : {}),
  }

  if (!config.discs) return next

  for (let index = 0; index < 3; index++) {
    next = setDiscSlot(next, index, {
      disc: config.discs.selected[index],
      discConfirmed: config.discs.confirmed[index],
      starStone: config.discs.starStones[index] ?? '',
      assistStar: config.discs.assistStars[index] ?? '',
    })
  }
  return next
}

export function operatorTrainingConfigFingerprint(
  config: OperatorTrainingConfigRes | OperatorTrainingConfigSaveReq,
) {
  const discs = config.discs
    ? {
        selected: config.discs.selected,
        confirmed: config.discs.confirmed,
        starStones: config.discs.starStones.map((value) => value ?? ''),
        assistStars: config.discs.assistStars.map((value) => value ?? ''),
      }
    : undefined

  return JSON.stringify({
    operatorId: config.operatorId,
    starLevel: config.starLevel,
    level: config.level,
    elite: config.elite,
    skillLevel: config.skillLevel,
    potentiality: config.potentiality,
    module: config.module,
    skill: config.skill,
    attack: config.attack,
    hp: config.hp,
    discs,
  })
}
