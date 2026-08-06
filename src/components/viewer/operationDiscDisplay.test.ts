import { describe, expect, it } from 'vitest'

import { buildOperationDiscDisplay } from './operationDiscDisplay'

describe('operation disc display', () => {
  it('hides an unselected disc while keeping selected stars visible', () => {
    const displays = buildOperationDiscDisplay(
      [
        {
          index: 1,
          disc: 0,
          starStone: '主星',
          assistStar: '辅星',
        },
      ],
      [],
    )

    expect(displays).toEqual([
      {
        _slot: 1,
        forbidden: false,
        starStone: '主星',
        assistStar: '辅星',
      },
    ])
  })

  it('keeps an explicitly selected any disc visible', () => {
    expect(
      buildOperationDiscDisplay(
        [{ index: 1, disc: 0, discConfirmed: true }],
        [],
      ),
    ).toEqual([
      {
        _slot: 1,
        item: {
          abbreviation: '任意/未选择',
          desp: '任意或未选择命盘',
          multiline: true,
        },
        forbidden: false,
        starStone: undefined,
        assistStar: undefined,
      },
    ])
  })

  it('keeps a selected disc while omitting empty star fields', () => {
    const disc = { abbreviation: '命盘', desp: '命盘描述', color: '金' }

    expect(
      buildOperationDiscDisplay([{ index: 0, disc: -1 }], [disc]),
    ).toEqual([
      {
        _slot: 0,
        item: disc,
        forbidden: true,
        starStone: undefined,
        assistStar: undefined,
      },
    ])
  })

  it('omits a slot when its disc and star selections are all empty', () => {
    expect(
      buildOperationDiscDisplay(
        [{ index: 1, disc: 0, starStone: ' ', assistStar: '' }],
        [],
      ),
    ).toEqual([])
  })
})
