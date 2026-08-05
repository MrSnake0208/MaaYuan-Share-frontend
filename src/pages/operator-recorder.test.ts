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
import { getOperatorRecorderStorageKey } from './operator-recorder-storage'

const mocks = vi.hoisted(() => ({
  applyConfig: vi.fn(),
  auth: {} as { userId?: string },
  boxPresets: [] as Array<{
    id: string
    label: string
    members: Array<{ operatorKey: string; order: number }>
  }>,
  hookScopes: [] as string[],
  scheduleSave: vi.fn(),
}))

vi.mock('../apis/operator-box-preset', () => ({
  createOperatorBoxPreset: vi.fn(),
  deleteOperatorBoxPreset: vi.fn(),
  updateOperatorBoxPreset: vi.fn(),
  useOperatorBoxPresets: () => ({
    data: mocks.boxPresets,
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
  }),
}))

vi.mock('../components/OperatorBoxPresetManager', async () => {
  const { createElement } = await vi.importActual<typeof import('react')>(
    'react',
  )
  return {
    OperatorBoxPresetManager: ({
      onSelect,
    }: {
      onSelect: (preset?: (typeof mocks.boxPresets)[number]) => void
    }) =>
      createElement('div', {}, [
        ...mocks.boxPresets.map((preset) =>
          createElement(
            'button',
            {
              key: preset.id,
              'data-testid': `select-${preset.id}`,
              onClick: () => onSelect(preset),
            },
            preset.label,
          ),
        ),
        createElement(
          'button',
          {
            key: 'draft',
            'data-testid': 'select-draft',
            onClick: () => onSelect(undefined),
          },
          '草稿',
        ),
      ]),
  }
})

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
  useOperatorTrainingConfigSync: (boxId?: string) => {
    mocks.hookScopes.push(boxId ?? '')
    return {
      applyConfig: (operator: { name: string }) =>
        mocks.applyConfig(operator, boxId),
      error: undefined,
      isLoading: false,
      scheduleSave: mocks.scheduleSave,
    }
  },
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
      Confirm: { cancel: '取消', confirm: '确认' },
    },
    common: {
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      loading: '加载中',
    },
    pages: {
      operator_recorder: {
        delete_preset: '删除预设',
        delete_preset_confirm: '确定删除这个阵容预设吗？',
        load_failed: ({ error }: { error: string }) =>
          `密探记录加载失败：${error}`,
        login_required: '登录后可编辑并同步密探记录',
        no_operator: '尚未选择密探',
        preset_load_failed: ({ error }: { error: string }) =>
          `阵容预设加载失败：${error}`,
        preset_name: '预设名称',
        rename_preset: '重命名预设',
        save_as_preset: '另存为预设',
        save_changes: '保存更改',
        select_preset: '选择阵容预设',
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
    mocks.boxPresets = []
    mocks.hookScopes = []
    mocks.applyConfig.mockImplementation((operator) => operator)
    mocks.scheduleSave.mockReset()
    localStorage.clear()
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

  it('edits operators in draft mode without an active Box', async () => {
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

    expect(mocks.hookScopes).not.toContain('box-a')
    expect(JSON.parse(localStorage.getItem(
      getOperatorRecorderStorageKey('user-1'),
    ) ?? '')).toEqual({ activeBoxId: '', version: 2 })
  })

  it('restores the active Box and hydrates its ordered operators', async () => {
    mocks.boxPresets = [
      {
        id: 'box-a',
        label: 'Box A',
        members: [
          { operatorKey: '测试密探乙', order: 2 },
          { operatorKey: '测试密探甲', order: 1 },
        ],
      },
    ]
    localStorage.setItem(
      getOperatorRecorderStorageKey('user-1'),
      JSON.stringify({ activeBoxId: 'box-a', version: 2 }),
    )
    mocks.auth = { userId: 'user-1' }

    await act(async () => root.render(createElement(OperatorRecorderPage)))

    expect(mocks.applyConfig).toHaveBeenCalledTimes(2)
    expect(mocks.applyConfig).toHaveBeenCalledWith(
      expect.objectContaining({ name: '测试密探甲' }),
      'box-a',
    )
    expect(
      Array.from(container.querySelectorAll('[data-testid="operator-item"]')).map(
        (item) => item.textContent,
      ),
    ).toEqual(['测试密探甲', '测试密探乙'])
  })

  it('switches Boxes without reusing the previous Box profile', async () => {
    mocks.boxPresets = [
      {
        id: 'box-a',
        label: 'Box A',
        members: [{ operatorKey: '测试密探甲', order: 1 }],
      },
      {
        id: 'box-b',
        label: 'Box B',
        members: [{ operatorKey: '测试密探乙', order: 1 }],
      },
    ]
    mocks.auth = { userId: 'user-1' }

    await act(async () => root.render(createElement(OperatorRecorderPage)))
    await act(async () => {
      container.querySelector<HTMLElement>('[data-testid="select-box-a"]')?.click()
    })
    expect(container.querySelector('[data-testid="operator-item"]')?.textContent)
      .toBe('测试密探甲')

    await act(async () => {
      container.querySelector<HTMLElement>('[data-testid="select-box-b"]')?.click()
    })

    expect(container.querySelector('[data-testid="operator-item"]')?.textContent)
      .toBe('测试密探乙')
    expect(mocks.applyConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '测试密探乙' }),
      'box-b',
    )
    expect(JSON.parse(localStorage.getItem(
      getOperatorRecorderStorageKey('user-1'),
    ) ?? '')).toEqual({ activeBoxId: 'box-b', version: 2 })
  })

  it('ignores the legacy local selection schema', async () => {
    localStorage.setItem(
      getOperatorRecorderStorageKey('user-1'),
      JSON.stringify({ version: 1, operatorNames: ['测试密探甲'] }),
    )
    mocks.auth = { userId: 'user-1' }

    await act(async () => root.render(createElement(OperatorRecorderPage)))

    expect(mocks.applyConfig).not.toHaveBeenCalled()
    expect(container.querySelector('[data-testid="operator-item"]')).toBeNull()
  })
})
