import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  DeployedOperatorsShareCard,
  alignOperationShareDiscs,
} from './DeployedOperatorsShareCard'
import type { OperationShareModel } from './operationShareModel'
import { createOperationShareCardConfig } from './operationShareModel'

const model: OperationShareModel = {
  title: '测试作业',
  stage: '测试关卡',
  author: '攻略作者',
  source: {
    type: 'original',
    strategyAuthor: '攻略作者',
  },
  shortCode: '12345',
  maayuanUrl: 'https://example.com/?op=12345',
  qrTargetUrl: 'https://example.com/?op=12345',
  qrLabel: '扫码查看 MaaYuan 作业',
  operators: [
    {
      slot: 1,
      name: '上阵密探',
      rawName: 'main_operator',
      avatarId: 'main_operator',
      skill: 2,
      starLevel: 4,
      attack: 1234,
      hp: 5678,
      elite: 2,
      level: 60,
      skillLevel: 10,
      potentiality: 3,
      module: 'A',
      discs: [
        {
          slot: 1,
          abbreviation: '技伤大幅',
          color: '金',
          forbidden: false,
          starStone: '攻击提升',
          assistStar: '生命提升',
        },
      ],
    },
  ],
  groups: [
    {
      name: '不应显示的密探组',
      operators: [],
    },
  ],
  actionSlots: [1],
  rounds: [],
}

describe('deployed operators share card', () => {
  it('keeps configured discs in their original fixed slots', () => {
    const secondSlotDisc = {
      slot: 2,
      abbreviation: '第二槽命盘',
      forbidden: false,
    }

    expect(alignOperationShareDiscs([secondSlotDisc])).toEqual([
      undefined,
      secondSlotDisc,
      undefined,
    ])
  })

  it('renders only deployed operators with stats, discs, and stones', () => {
    const markup = renderToStaticMarkup(
      createElement(DeployedOperatorsShareCard, {
        model,
        qrDataUrl: 'data:image/png;base64,qr-code',
      }),
    )

    expect(markup).toContain('MaaYuan · 上阵密探')
    expect(markup).toContain('生命')
    expect(markup).toContain('攻击')
    expect(markup).toContain('等级')
    expect(markup).toContain('修为')
    expect(markup).toContain('化极')
    expect(markup).toContain('命盘')
    expect(markup).toContain('主星')
    expect(markup).toContain('辅星')
    expect(markup).toContain('1234')
    expect(markup).toContain('5678')
    expect(markup).toContain('技伤大幅')
    expect(markup).toContain('攻击提升')
    expect(markup).toContain('生命提升')
    expect(markup.match(/<tr/g)).toHaveLength(9)
    expect(markup).not.toContain('命盘一')
    expect(markup).not.toContain('命盘二')
    expect(markup).not.toContain('命盘三')
    expect(markup).not.toContain('rowspan="3"')
    expect(markup).not.toContain('grid-template-rows')
    expect(markup).not.toContain('不应显示的密探组')
  })

  it('marks configured discs as required', () => {
    const config = createOperationShareCardConfig()
    config.requiredDiscs['1:1'] = true

    const markup = renderToStaticMarkup(
      createElement(DeployedOperatorsShareCard, {
        config,
        model,
        qrDataUrl: 'data:image/png;base64,qr-code',
      }),
    )

    expect(markup).toContain('必须携带')
    expect(markup).toContain('必须携带命盘：技伤大幅')
    expect(markup).toContain('技伤大幅')
  })

  it('renders forbidden discs as an absolute prohibition instead of required', () => {
    const config = createOperationShareCardConfig()
    config.requiredDiscs['1:1'] = true
    const forbiddenModel: OperationShareModel = {
      ...model,
      operators: model.operators.map((operator) => ({
        ...operator,
        discs: operator.discs.map((disc) => ({
          ...disc,
          forbidden: true,
        })),
      })),
    }

    const markup = renderToStaticMarkup(
      createElement(DeployedOperatorsShareCard, {
        config,
        model: forbiddenModel,
        qrDataUrl: 'data:image/png;base64,qr-code',
      }),
    )

    expect(markup).toContain('绝对不能有')
    expect(markup).toContain('绝对不能有命盘：技伤大幅')
    expect(markup).not.toContain('必须携带命盘')
  })
})
