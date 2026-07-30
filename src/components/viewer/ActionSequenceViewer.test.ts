import { act, createElement } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { CopilotDocV1 } from '../../models/copilot.schema'
import type { Operation } from '../../models/operation'
import { ActionSequenceViewer } from './ActionSequenceViewer'

vi.mock('../../i18n/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../i18n/i18n')>()
  return {
    ...actual,
    useTranslation: () => ({
      components: {
        viewer: {
          OperationViewer: {
            action_table_no_actions: '无动作',
            action_table_other_actions: '其他动作',
            action_table_slot_placeholder: ({ slot }: { slot: number }) =>
              `${slot}号位`,
            action_table_slot_position: ({ slot }: { slot: number }) =>
              `${slot}号位`,
            action_view_mode_flow: '动作链视图',
            action_view_mode_table: '类表格视图',
            no_actions: '没有动作',
            no_actions_defined: '未定义动作',
            round_action_count: ({ count }: { count: number }) =>
              `${count} 个动作`,
            round_title: ({ round }: { round: number }) => `第 ${round} 回合`,
          },
        },
      },
    }),
  }
})

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

function createOperation() {
  return {
    parsedContent: {
      actions: [
        {
          doc: '第1回合·动作1 [1普]',
          type: CopilotDocV1.Type.Output,
        },
      ],
      doc: { title: '测试作业', details: '' },
      minimumRequired: 'v1.0.0',
      opers: [],
      stageName: '1-1',
    },
  } as unknown as Operation
}

describe('action sequence viewer share image mode', () => {
  let container: HTMLDivElement
  let root: Root

  beforeAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false
  })

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('adds a share image option and switches to its content', async () => {
    await act(async () => {
      root.render(
        createElement(ActionSequenceViewer, {
          operation: createOperation(),
          shareImage: createElement('img', {
            alt: '作者配置的作战编排分享图',
          }),
        }),
      )
    })

    const shareButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '分享图',
    )
    expect(shareButton).toBeDefined()

    await act(async () => shareButton?.click())

    expect(
      container.querySelector('img[alt="作者配置的作战编排分享图"]'),
    ).not.toBeNull()
  })

  it('keeps the original options when no share image is available', async () => {
    await act(async () => {
      root.render(
        createElement(ActionSequenceViewer, {
          operation: createOperation(),
        }),
      )
    })

    expect(
      Array.from(container.querySelectorAll('button')).some(
        (button) => button.textContent === '分享图',
      ),
    ).toBe(false)
  })
})
