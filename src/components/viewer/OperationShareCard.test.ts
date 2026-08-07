import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  OperationShareCard,
  getOperationShareActionCellBackground,
  getOperationShareActionLabel,
  getOperationShareActionStyle,
  getOperationShareOperatorStarLabel,
  getOperationShareRoundDisplay,
} from './OperationShareCard'
import {
  OPERATION_SHARE_CELL_COLORS,
  type OperationShareModel,
} from './operationShareModel'

const model: OperationShareModel = {
  title: '测试作业',
  stage: '测试关卡',
  author: '攻略作者',
  source: { type: 'original', strategyAuthor: '攻略作者' },
  shortCode: '12345',
  maayuanUrl: 'https://example.com/?op=12345',
  qrTargetUrl: 'https://example.com/?op=12345',
  qrLabel: '扫码查看 MaaYuan 作业',
  operators: [],
  groups: [],
  actionSlots: [],
  rounds: [],
}

describe('operation share card styles', () => {
  it('hides the QR code by default and can show it', () => {
    const defaultMarkup = renderToStaticMarkup(
      createElement(OperationShareCard, {
        model,
        qrDataUrl: 'data:image/png;base64,qr-code',
      }),
    )
    const visibleMarkup = renderToStaticMarkup(
      createElement(OperationShareCard, {
        hideQrCode: false,
        model,
        qrDataUrl: 'data:image/png;base64,qr-code',
      }),
    )

    expect(defaultMarkup).not.toContain(model.qrLabel)
    expect(visibleMarkup).toContain(model.qrLabel)
  })

  it('alternates the deployed-operator palette for uncolored action cells', () => {
    expect(getOperationShareActionCellBackground({}, 1, 1)).toBe('#f3e3c9')
    expect(getOperationShareActionCellBackground({}, 2, 1)).toBe('#ddc09e')
    expect(getOperationShareActionCellBackground({}, 3, 1)).toBe('#f3e3c9')
  })

  it('uses the configured semantic color instead of the neutral background', () => {
    const color = OPERATION_SHARE_CELL_COLORS[2]

    expect(
      getOperationShareActionCellBackground({ '2:slot-1': color }, 2, 1),
    ).toBe(color)
  })

  it('uses one text color without a background for every action label', () => {
    expect(getOperationShareActionStyle()).toEqual({ color: '#624015' })
  })

  it('uses the operator star level for the avatar badge', () => {
    expect(getOperationShareOperatorStarLabel({ starLevel: 4 })).toBe('4 星')
    expect(getOperationShareOperatorStarLabel({})).toBeUndefined()
  })

  it('normalizes star restart labels in the generated image', () => {
    expect(
      ['橙', '紫', '蓝'].map((color, index) =>
        getOperationShareActionLabel({
          raw: `重开:无${color}星`,
          order: index + 1,
          label: `无${color}星`,
        }),
      ),
    ).toEqual(['1无橙星重开', '2无紫星重开', '3无蓝星重开'])
  })

  it('shows only the fallen slot in death restart labels', () => {
    expect(
      getOperationShareActionLabel({
        raw: '重开:检测3号位阵亡',
        order: 12,
        label: '检测3号位阵亡',
      }),
    ).toBe('3号位阵亡就重开')
  })

  it('renumbers visible actions after target switches are hidden', () => {
    const attack = { raw: '1普', order: 2, label: 'A' }
    const round = {
      round: 1,
      slots: { 1: [attack] },
      others: [{ raw: '额外:右侧目标', order: 1, label: '左滑' }],
    }

    const display = getOperationShareRoundDisplay(round, {
      showOtherActions: true,
      showTargetSwitches: false,
    })

    expect(display.otherActions).toEqual([])
    expect(
      getOperationShareActionLabel(
        attack,
        display.displayOrderByActionOrder.get(attack.order),
      ),
    ).toBe('1A')
  })

  it('renumbers actions when an earlier waiting action is absent', () => {
    const attack = { raw: '1普', order: 2, label: 'A' }
    const display = getOperationShareRoundDisplay(
      { round: 1, slots: { 1: [attack] }, others: [] },
      { showOtherActions: true, showTargetSwitches: true },
    )

    expect(
      getOperationShareActionLabel(
        attack,
        display.displayOrderByActionOrder.get(attack.order),
      ),
    ).toBe('1A')
  })
})
