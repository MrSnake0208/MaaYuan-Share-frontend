export type OperationDiscSlot = {
  index: number
  disc: number
  discConfirmed?: boolean
  starStone?: string
  assistStar?: string
}

export type OperationDiscItem = {
  abbreviation: string
  desp: string
  color?: string
  multiline?: boolean
}

export type OperationDiscDisplay = {
  _slot: number
  item?: OperationDiscItem
  forbidden: boolean
  starStone?: string
  assistStar?: string
}

const ANY_DISC: OperationDiscItem = {
  abbreviation: '任意',
  desp: '任意或未选择命盘',
  multiline: true,
}

export function buildOperationDiscDisplay(
  slots: readonly OperationDiscSlot[],
  discList: readonly OperationDiscItem[],
): OperationDiscDisplay[] {
  return slots.flatMap((slot) => {
    const selectedDisc = discList[Math.abs(slot.disc) - 1]
    const item =
      selectedDisc ??
      (slot.disc === 0 && slot.discConfirmed ? ANY_DISC : undefined)
    const starStone = slot.starStone?.trim() || undefined
    const assistStar = slot.assistStar?.trim() || undefined

    if (!item && !starStone && !assistStar) return []

    return [
      {
        _slot: slot.index,
        item,
        forbidden: Boolean(selectedDisc) && slot.disc < 0,
        starStone,
        assistStar,
      },
    ]
  })
}
