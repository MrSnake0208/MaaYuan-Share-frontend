import { describe, expect, it } from 'vitest'

import {
  getOperationShareActionCellBackground,
  getOperationShareActionLabel,
} from './OperationShareCard'
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

  it('normalizes star restart labels in the generated image', () => {
    expect(
      ['橙', '紫', '蓝'].map((color, index) =>
        getOperationShareActionLabel({
          raw: `重开:无${color}星`,
          label: `${index + 1}无${color}星`,
        }),
      ),
    ).toEqual(['1无橙星重开', '2无紫星重开', '3无蓝星重开'])
  })

  it('shows only the fallen slot in death restart labels', () => {
    expect(
      getOperationShareActionLabel({
        raw: '重开:检测3号位阵亡',
        label: '12检测3号位阵亡',
      }),
    ).toBe('3号位阵亡就重开')
  })
})
