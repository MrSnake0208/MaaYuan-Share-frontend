import { act, createElement, type ReactNode } from 'react'
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

import { OperatorRecorderPage } from './operator-recorder'

const mocks = vi.hoisted(() => ({
  applyConfig: vi.fn(),
  auth: {} as { userId?: string },
  scheduleSave: vi.fn(),
}))

vi.mock('jotai', () => ({
  useAtomValue: () => mocks.auth,
}))

vi.mock('../components/AccountManager', () => ({
  AccountAuthDialog: () => null,
}))

vi.mock('../components/editor2/operator/OperatorItem', async () => {
  const { createElement } = await vi.importActual<typeof import('react')>(
    'react',
  )
  return {
    OperatorItem: ({ operator }: { operator: { name: string } }) =>
      createElement('div', { 'data-testid': 'operator-item' }, operator.name),
  }
})

vi.mock('../components/editor/operator/sheet/SheetProvider', async () => {
  const { createElement } = await vi.importActual<typeof import('react')>(
    'react',
  )
  return {
    SheetProvider: ({
      children,
      submitOperator,
    }: {
      children: ReactNode
      submitOperator: (operator: { name: string }) => void
    }) =>
      createElement('div', { 'data-testid': 'operator-sheet' }, [
        createElement(
          'button',
          {
            key: 'operator-a',
            'data-testid': 'operator-a',
            onClick: () => submitOperator({ name: '测试密探甲' }),
          },
          '测试密探甲',
        ),
        createElement(
          'button',
          {
            key: 'operator-b',
            'data-testid': 'operator-b',
            onClick: () => submitOperator({ name: '测试密探乙' }),
          },
          '测试密探乙',
        ),
        children,
      ]),
  }
})

vi.mock(
  '../components/editor/operator/sheet/sheetOperator/SheetOperatorFilterProvider',
  () => ({ OperatorFilterProvider: ({ children }: { children: ReactNode }) => children }),
)

vi.mock('../components/editor2/operator/sheet/SheetList', () => ({
  SheetList: () => '密探图鉴',
}))

vi.mock('../components/editor2/operator/useOperatorTrainingConfigSync', () => ({
  useOperatorTrainingConfigSync: () => ({
    applyConfig: mocks.applyConfig,
    error: undefined,
    isLoading: false,
    scheduleSave: mocks.scheduleSave,
  }),
}))

vi.mock('../components/editor2/reconciliation', () => ({
  createOperator: ({ name }: { name: string }) => ({
    id: `record-${name}`,
    name,
  }),
}))

vi.mock('../i18n/i18n', () => ({
  useTranslation: () => ({
    components: {
      AccountManager: { login_register: '登录 / 注册' },
    },
    pages: {
      operator_recorder: {
        load_failed: ({ error }: { error: string }) =>
          `密探记录加载失败：${error}`,
        login_required: '登录后可编辑并同步密探记录',
        no_operator: '尚未选择密探',
        subtitle: '密探记录器',
        title: '绣衣楼编辑器',
      },
    },
  }),
}))

vi.mock('../models/operator', () => ({
  useLocalizedOperatorName: (name: string) => name,
}))

vi.mock('../utils/error', () => ({
  formatError: (error: unknown) => String(error),
}))

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

describe('OperatorRecorderPage', () => {
  let container: HTMLDivElement
  let root: Root

  beforeAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false
  })

  beforeEach(() => {
    mocks.auth = {}
    mocks.applyConfig.mockImplementation((operator) => operator)
    mocks.scheduleSave.mockReset()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.clearAllMocks()
  })

  it('requires an account before editing records', async () => {
    await act(async () => root.render(createElement(OperatorRecorderPage)))

    expect(container.textContent).toContain('登录后可编辑并同步密探记录')
    expect(container.querySelector('[data-testid="operator-item"]')).toBeNull()
  })

  it('loads multiple selected operators into the editor', async () => {
    mocks.auth = { userId: 'user-1' }
    await act(async () => root.render(createElement(OperatorRecorderPage)))

    const operatorA = container.querySelector<HTMLElement>(
      '[data-testid="operator-a"]',
    )
    const operatorB = container.querySelector<HTMLElement>(
      '[data-testid="operator-b"]',
    )
    expect(operatorA).not.toBeNull()
    expect(operatorB).not.toBeNull()

    await act(async () => {
      operatorA?.click()
      operatorB?.click()
    })

    expect(mocks.applyConfig).toHaveBeenCalledTimes(2)
    expect(
      Array.from(container.querySelectorAll('[data-testid="operator-item"]')).map(
        (item) => item.textContent,
      ),
    ).toEqual(['测试密探甲', '测试密探乙'])
  })
})
