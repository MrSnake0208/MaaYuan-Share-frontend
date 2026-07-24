import { describe, expect, it, vi } from 'vitest'

import { CopilotDocV1 } from '../../models/copilot.schema'
import type { Operation } from '../../models/operation'
import {
  OPERATION_SHARE_CELL_COLORS,
  ObjectUrlStore,
  buildOperationShareCellKey,
  buildOperationShareFilename,
  buildOperationShareModel,
  buildOperationShareUrl,
  calculateSharePixelRatio,
  createOperationShareCardConfig,
  filterOperationShareActions,
  loadOperationShareCardConfig,
  saveOperationShareCardConfig,
} from './operationShareModel'

function createOperation(): Operation {
  return {
    uploader: '测试作者',
    preLevel: { name: '测试关卡' },
    parsedContent: {
      doc: { title: '测试作业', details: '' },
      stageName: '1-1',
      opers: [{ name: '测试密探', skill: 2 }],
      groups: [{ name: '替补组', opers: [{ name: '替补密探' }] }],
      actions: [],
    },
  } as unknown as Operation
}

describe('operation share model', () => {
  it('maps metadata, operators, groups and empty actions', () => {
    const model = buildOperationShareModel(createOperation(), 'cn')

    expect(model.title).toBe('测试作业')
    expect(model.stage).toBe('测试关卡')
    expect(model.author).toBe('测试作者')
    expect(model.operators[0]).toMatchObject({
      slot: 1,
      skill: 2,
      rawName: '测试密探',
    })
    expect(model.groups[0].operators[0].rawName).toBe('替补密探')
    expect(model.rounds).toEqual([])
  })

  it('reads star_level from operation content instead of static rarity', () => {
    const operation = createOperation()
    const operator = operation.parsedContent.opers?.[0] as
      (CopilotDocV1.Operator & { star_level?: number }) | undefined
    if (!operator) throw new Error('测试密探不存在')
    operator.star_level = 4

    const model = buildOperationShareModel(operation, 'cn')

    expect(model.operators[0].starLevel).toBe(4)
  })

  it('includes the original author only for reposted operations', () => {
    const operation = createOperation()
    operation.metadata = {
      sourceType: 'repost',
      repostAuthor: '原作者昵称',
    }

    expect(buildOperationShareModel(operation, 'cn').originalAuthor).toBe(
      '原作者昵称',
    )

    operation.metadata.sourceType = 'original'
    expect(
      buildOperationShareModel(operation, 'cn').originalAuthor,
    ).toBeUndefined()
  })

  it('uses stable fallbacks for incomplete legacy operations', () => {
    const operation = createOperation()
    operation.uploader = ''
    operation.parsedContent.doc.title = ''
    operation.parsedContent.stageName = ''
    operation.preLevel = undefined
    operation.parsedContent.opers = undefined
    operation.parsedContent.groups = undefined

    const model = buildOperationShareModel(operation, 'cn')
    expect(model).toMatchObject({
      title: '未命名作业',
      stage: '未知关卡',
      author: '匿名作者',
      operators: [],
      groups: [],
    })
  })

  it('keeps action order and compact symbols consistent with the action table', () => {
    const operation = createOperation()
    operation.parsedContent.actions = [
      {
        type: CopilotDocV1.Type.Skill,
        name: '测试密探',
        doc: '第1回合·动作1：测试密探 A [1普]',
      },
      {
        type: CopilotDocV1.Type.Skill,
        name: '测试密探',
        doc: '第1回合·动作2：测试密探 ↑ [1大]',
      },
    ]

    const model = buildOperationShareModel(operation, 'cn')

    expect(model.rounds[0]?.slots[1]?.map((action) => action.label)).toEqual([
      '1A',
      '2↑',
    ])
  })

  it('places left and right target switching actions in the other column', () => {
    const operation = createOperation()
    operation.parsedContent.actions = [
      {
        type: CopilotDocV1.Type.MoveCamera,
        distance: [-1, 0],
        doc: '第1回合·动作1：切换至左侧目标 [额外:左侧目标]',
      },
      {
        type: CopilotDocV1.Type.Skill,
        name: '测试密探',
        doc: '第1回合·动作2：测试密探 A [1普]',
      },
      {
        type: CopilotDocV1.Type.MoveCamera,
        distance: [1, 0],
        doc: '第1回合·动作3：切换至右侧目标 [额外:右侧目标]',
      },
    ]

    const round = buildOperationShareModel(operation, 'cn').rounds[0]

    expect(round?.slots[1]?.map((action) => action.label)).toEqual(['2A'])
    expect(round?.others.map((action) => action.label)).toEqual([
      '1右滑',
      '3左滑',
    ])
  })

  it('hides waiting actions from every share image column', () => {
    const operation = createOperation()
    operation.parsedContent.actions = [
      {
        type: CopilotDocV1.Type.Output,
        doc: '第1回合·动作1：等待1000毫秒 [额外:等待:1000]',
      },
      {
        type: CopilotDocV1.Type.Skill,
        name: '测试密探',
        doc: '第1回合·动作2：测试密探 A [1普]',
      },
    ]

    const round = buildOperationShareModel(operation, 'cn').rounds[0]

    expect(round?.slots[1]?.map((action) => action.label)).toEqual(['2A'])
    expect(round?.others).toEqual([])
  })
})

describe('share image utilities', () => {
  function createMemoryStorage() {
    const values = new Map<string, string>()
    return {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        values.set(key, value)
      }),
    }
  }

  it('creates independent editable card configurations', () => {
    const first = createOperationShareCardConfig()
    const second = createOperationShareCardConfig()

    first.notes[1] = '第一回合备注'

    expect(first).toMatchObject({
      showTargetSwitches: true,
      showOtherActions: true,
      showNotes: false,
    })
    expect(second.notes).toEqual({})
  })

  it('builds stable cell keys and filters target switching actions on demand', () => {
    const actions = [
      { raw: '额外:左侧目标', label: '1右滑' },
      { raw: '额外:开大', label: '2大' },
    ]

    expect(buildOperationShareCellKey(2, 'slot-3')).toBe('2:slot-3')
    expect(filterOperationShareActions(actions, false)).toEqual([
      { raw: '额外:开大', label: '2大' },
    ])
    expect(filterOperationShareActions(actions, true)).toBe(actions)
  })

  it('persists editable card settings per operation', () => {
    const storage = createMemoryStorage()
    const config = createOperationShareCardConfig()
    config.showTargetSwitches = false
    config.showOtherActions = false
    config.showNotes = true
    config.notes[2] = '第二回合先等待'
    config.cellColors['2:slot-3'] = OPERATION_SHARE_CELL_COLORS[2]

    expect(saveOperationShareCardConfig(100, config, storage)).toBe(true)
    expect(loadOperationShareCardConfig(100, storage)).toEqual(config)
    expect(loadOperationShareCardConfig(101, storage)).toEqual(
      createOperationShareCardConfig(),
    )
  })

  it('falls back safely when cached settings are invalid', () => {
    const storage = createMemoryStorage()
    storage.getItem.mockReturnValueOnce('{invalid json')

    expect(loadOperationShareCardConfig(100, storage)).toEqual(
      createOperationShareCardConfig(),
    )

    storage.getItem.mockReturnValueOnce(
      JSON.stringify({
        version: 1,
        config: {
          showTargetSwitches: false,
          showOtherActions: false,
          showNotes: true,
          notes: { 1: 'x'.repeat(200), invalid: 3 },
          cellColors: {
            '1:others': '#F4D9D1',
            '2:notes': '#f2dfb9',
            'bad-key': '#ffffff',
            '3:slot-1': '#D8E9E4',
            '4:slot-2': '#abcdef',
          },
        },
      }),
    )

    expect(loadOperationShareCardConfig(100, storage)).toEqual({
      showTargetSwitches: false,
      showOtherActions: false,
      showNotes: true,
      notes: { 1: 'x'.repeat(160) },
      cellColors: { '3:slot-1': '#d8e9e4' },
    })
  })

  it('shows the other actions column for caches created before the option existed', () => {
    const storage = createMemoryStorage()
    storage.getItem.mockReturnValueOnce(
      JSON.stringify({
        version: 1,
        config: {
          showTargetSwitches: false,
          showNotes: false,
          notes: {},
          cellColors: {},
        },
      }),
    )

    expect(loadOperationShareCardConfig(100, storage).showOtherActions).toBe(
      true,
    )
  })

  it('builds the QR code URL from the current origin and operation id', () => {
    expect(buildOperationShareUrl(29533, 'https://share.maayuan.top')).toBe(
      'https://share.maayuan.top/?op=29533',
    )
  })

  it('sanitizes download filenames', () => {
    expect(
      buildOperationShareFilename({ stage: '1/2', title: '攻略:<>"' }),
    ).toBe('1-2-攻略----.png')
  })

  it('keeps generated canvas height within the configured limit', () => {
    expect(calculateSharePixelRatio(4000)).toBe(2)
    expect(calculateSharePixelRatio(10000)).toBe(1.6)
    expect(calculateSharePixelRatio(20000)).toBe(1)
    expect(calculateSharePixelRatio(0)).toBe(2)
  })

  it('revokes object URLs when replacing and disposing previews', () => {
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce('blob:first')
      .mockReturnValueOnce('blob:second')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })
    const store = new ObjectUrlStore()

    expect(store.replace(new Blob(['first']))).toBe('blob:first')
    expect(store.replace(new Blob(['second']))).toBe('blob:second')
    store.revoke()

    expect(revokeObjectURL).toHaveBeenNthCalledWith(1, 'blob:first')
    expect(revokeObjectURL).toHaveBeenNthCalledWith(2, 'blob:second')
  })
})
