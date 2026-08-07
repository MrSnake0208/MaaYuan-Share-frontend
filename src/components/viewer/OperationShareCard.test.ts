import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  OperationShareCard,
  getOperationShareActionCellBackground,
  getOperationShareActionLabel,
  getOperationShareCellVisualStyle,
  getOperationShareOperatorStarLabel,
  getOperationShareRoundDisplay,
} from './OperationShareCard'
import {
  createOperationShareCardConfig,
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

  it('renders full-cell avatars above a separate column-label row', () => {
    const config = createOperationShareCardConfig()
    const cardModel: OperationShareModel = {
      ...model,
      actionSlots: [1],
      operators: [
        {
          slot: 1,
          name: '测试密探',
          rawName: 'test-operator',
          avatarId: 'test-operator',
          level: 60,
          elite: 2,
          skillLevel: 10,
          potentiality: 1,
          discs: [],
        },
      ],
    }

    const markup = renderToStaticMarkup(
      createElement(OperationShareCard, {
        config,
        model: cardModel,
        qrDataUrl: 'data:image/png;base64,qr-code',
      }),
    )

    expect(markup).toContain('<tr aria-label="密探头像"')
    expect(markup).toContain('<tr aria-label="列标题"')
    expect(markup.indexOf('aria-label="密探头像"')).toBeLessThan(
      markup.indexOf('aria-label="列标题"'),
    )
    expect(markup).toContain('aspect-square h-auto w-full')
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

  it('uses distinct colors, patterns, and accessible text contrast', () => {
    const styles = OPERATION_SHARE_CELL_COLORS.map((color) =>
      getOperationShareCellVisualStyle(color),
    )

    expect(styles.map((style) => style.backgroundColor)).toEqual([
      ...OPERATION_SHARE_CELL_COLORS,
    ])
    expect(
      new Set(styles.map((style) => style.backgroundImage ?? 'solid')).size,
    ).toBe(OPERATION_SHARE_CELL_COLORS.length)
    expect(styles.map((style) => style.color)).toEqual([
      '#231f20',
      '#231f20',
      '#231f20',
      '#231f20',
      '#231f20',
    ])
  })

  it('renders the accessible pattern in the generated card', () => {
    const config = createOperationShareCardConfig()
    config.cellColors['1:slot-1'] = OPERATION_SHARE_CELL_COLORS[4]
    const cardModel: OperationShareModel = {
      ...model,
      actionSlots: [1],
      rounds: [{ round: 1, slots: { 1: [] }, others: [] }],
    }

    const markup = renderToStaticMarkup(
      createElement(OperationShareCard, {
        config,
        model: cardModel,
        qrDataUrl: 'data:image/png;base64,qr-code',
      }),
    )

    expect(markup).toContain('background-color:#edf8ff')
    expect(markup).toContain('background-image:radial-gradient')
    expect(markup).toContain('color:#231f20')
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
