import type { StarPresetValues } from '../../../data/operator-star-stone-presets'
import type { AssistStarName, MainStarName } from '../../../data/star-stones'
import type { EditorOperator } from '../types'

export interface DiscSlot {
  index: number
  disc: number
  starStone?: string
  assistStar?: string
}

const DISC_SLOT_COUNT = 3

export function getDiscSlots(operator: EditorOperator): DiscSlot[] {
  const discsSelected = operator.discsSelected ?? []
  const starStones = operator.discStarStones ?? []
  const assistStars = operator.discAssistStars ?? []
  const hasParallelArrays =
    discsSelected.length > 0 || starStones.length > 0 || assistStars.length > 0

  if (hasParallelArrays) {
    return Array.from({ length: DISC_SLOT_COUNT }, (_, index) => ({
      index,
      disc: discsSelected[index] ?? 0,
      starStone: starStones[index] ?? '',
      assistStar: assistStars[index] ?? '',
    }))
  }

  const extensionSlots = operator.extensions?.discs?.slots
  if (extensionSlots?.length) {
    const normalized = extensionSlots
      .filter((slot) => slot && typeof slot.index === 'number')
      .map((slot, index) => ({
        index: slot.index ?? index,
        disc: slot.disc ?? 0,
        starStone: slot.starStone ?? '',
        assistStar: slot.assistStar ?? '',
      }))
      .sort((a, b) => a.index - b.index)
      .slice(0, DISC_SLOT_COUNT)

    while (normalized.length < DISC_SLOT_COUNT) {
      normalized.push({
        index: normalized.length,
        disc: 0,
        starStone: '',
        assistStar: '',
      })
    }
    return normalized
  }

  return Array.from({ length: DISC_SLOT_COUNT }, (_, index) => ({
    index,
    disc: 0,
    starStone: '',
    assistStar: '',
  }))
}

function withDiscSlots(
  operator: EditorOperator,
  slots: DiscSlot[],
): EditorOperator {
  const discsSelected = [0, 0, 0]
  const discStarStones = ['', '', '']
  const discAssistStars = ['', '', '']

  for (const slot of slots) {
    if (slot.index >= 0 && slot.index < DISC_SLOT_COUNT) {
      discsSelected[slot.index] = slot.disc ?? 0
      discStarStones[slot.index] = slot.starStone ?? ''
      discAssistStars[slot.index] = slot.assistStar ?? ''
    }
  }

  return {
    ...operator,
    discsSelected,
    discStarStones,
    discAssistStars,
    ...(operator.extensions
      ? {
          extensions: {
            ...operator.extensions,
            discs: operator.extensions.discs,
          },
        }
      : {}),
  }
}

export function setDiscSlot(
  operator: EditorOperator,
  slotIndex: number,
  updates: Partial<Pick<DiscSlot, 'disc' | 'starStone' | 'assistStar'>>,
): EditorOperator {
  const nextSlots = getDiscSlots(operator).map((slot) =>
    slot.index === slotIndex ? { ...slot, ...updates } : { ...slot },
  )

  const chosen = nextSlots.find((slot) => slot.index === slotIndex)?.disc
  if (typeof chosen === 'number' && chosen > 0) {
    for (let index = 0; index < nextSlots.length; index++) {
      if (
        nextSlots[index].index !== slotIndex &&
        nextSlots[index].disc === chosen
      ) {
        nextSlots[index] = { ...nextSlots[index], disc: 0 }
      }
    }
  }

  const chosenMainStar = updates.starStone
  if (chosenMainStar && chosenMainStar !== '任意') {
    for (let index = 0; index < nextSlots.length; index++) {
      if (
        nextSlots[index].index !== slotIndex &&
        nextSlots[index].starStone === chosenMainStar
      ) {
        nextSlots[index] = { ...nextSlots[index], starStone: '' }
      }
    }
  }

  const chosenAssistStar = updates.assistStar
  if (chosenAssistStar && chosenAssistStar !== '任意') {
    for (let index = 0; index < nextSlots.length; index++) {
      if (
        nextSlots[index].index !== slotIndex &&
        nextSlots[index].assistStar === chosenAssistStar
      ) {
        nextSlots[index] = { ...nextSlots[index], assistStar: '' }
      }
    }
  }

  return withDiscSlots(operator, nextSlots)
}

export function applyMainStarPreset(
  operator: EditorOperator,
  values: StarPresetValues<MainStarName>,
): EditorOperator {
  const nextSlots = getDiscSlots(operator).map((slot) => ({
    ...slot,
    starStone: values[slot.index] ?? '',
  }))
  return withDiscSlots(operator, nextSlots)
}

export function applyAssistStarPreset(
  operator: EditorOperator,
  values: StarPresetValues<AssistStarName>,
): EditorOperator {
  const nextSlots = getDiscSlots(operator).map((slot) => ({
    ...slot,
    assistStar: values[slot.index] ?? '',
  }))
  return withDiscSlots(operator, nextSlots)
}
