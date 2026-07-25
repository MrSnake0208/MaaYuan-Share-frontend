import { describe, expect, it } from 'vitest'

import { getOperationShareActionCellBackground } from './OperationShareCard'
import { OPERATION_SHARE_CELL_COLORS } from './operationShareModel'

describe('operation share card styles', () => {
  it('uses one neutral background for uncolored action cells', () => {
    expect(getOperationShareActionCellBackground({}, 1, 1)).toBe('#ebe1d2')
    expect(getOperationShareActionCellBackground({}, 2, 1)).toBe('#ebe1d2')
  })

  it('uses the configured semantic color instead of the neutral background', () => {
    const color = OPERATION_SHARE_CELL_COLORS[2]

    expect(
      getOperationShareActionCellBackground({ '2:slot-1': color }, 2, 1),
    ).toBe(color)
  })
})
