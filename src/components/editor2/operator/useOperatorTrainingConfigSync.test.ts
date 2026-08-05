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

import { createOperator } from '../reconciliation'
import { useOperatorTrainingConfigSync } from './useOperatorTrainingConfigSync'

const mocks = vi.hoisted(() => ({
  auth: { userId: 'user-1' } as { userId?: string },
  mutateCache: vi.fn(async () => undefined),
  save: vi.fn(async ({ boxId, config }) => ({
    ...config,
    boxId,
    updateTime: new Date(),
  })),
}))

vi.mock('../../../apis/operator-box-training-config', () => ({
  getOperatorBoxTrainingConfigCacheKey: (userId: string, boxId: string) => [
    'operatorBoxTrainingConfigs',
    userId,
    boxId,
  ],
  saveOperatorBoxTrainingConfig: mocks.save,
  useOperatorBoxTrainingConfigs: () => ({
    data: [],
    error: undefined,
    isLoading: false,
  }),
}))

vi.mock('jotai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('jotai')>()),
  useAtomValue: () => mocks.auth,
}))

vi.mock('swr', () => ({ mutate: mocks.mutateCache }))

vi.mock('../../Toaster', () => ({
  AppToaster: { show: vi.fn() },
}))

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

describe('useOperatorTrainingConfigSync', () => {
  let container: HTMLDivElement
  let latest: ReturnType<typeof useOperatorTrainingConfigSync>
  let root: Root

  function Harness({ boxId }: { boxId?: string }) {
    latest = useOperatorTrainingConfigSync(boxId)
    return null
  }

  beforeAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false
  })

  beforeEach(() => {
    vi.useFakeTimers()
    mocks.auth = { userId: 'user-1' }
    mocks.mutateCache.mockClear()
    mocks.save.mockClear()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.useRealTimers()
  })

  it('does not persist draft edits without an active Box', async () => {
    await act(async () => root.render(createElement(Harness)))

    latest.scheduleSave(createOperator({ name: '测试密探甲' }))
    await vi.advanceTimersByTimeAsync(500)

    expect(mocks.save).not.toHaveBeenCalled()
  })

  it('keeps pending saves isolated when switching Boxes', async () => {
    await act(async () =>
      root.render(createElement(Harness, { boxId: 'box-a' })),
    )
    latest.scheduleSave(createOperator({ name: '测试密探甲' }))

    await act(async () =>
      root.render(createElement(Harness, { boxId: 'box-b' })),
    )
    latest.scheduleSave(createOperator({ name: '测试密探甲' }))

    await act(async () => vi.advanceTimersByTimeAsync(500))

    expect(mocks.save).toHaveBeenCalledTimes(2)
    expect(mocks.save.mock.calls.map(([request]) => request.boxId)).toEqual([
      'box-a',
      'box-b',
    ])
    expect(mocks.mutateCache.mock.calls.map(([key]) => key)).toEqual([
      ['operatorBoxTrainingConfigs', 'user-1', 'box-a'],
      ['operatorBoxTrainingConfigs', 'user-1', 'box-b'],
    ])
  })
})
