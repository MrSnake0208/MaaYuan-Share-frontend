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

import { OperatorMutipleSelect } from './OperatorMutipleSelect'

const mocks = vi.hoisted(() => ({
  existedOperators: [] as Array<{ name: string }>,
  filteredOperators: Array.from({ length: 7 }, (_, index) => ({
    name: `密探${index + 1}`,
  })),
  removeOperator: vi.fn(),
  submitOperator: vi.fn(() => true),
}))

vi.mock('../../SheetProvider', () => ({
  useSheet: () => ({
    existedOperators: mocks.existedOperators,
    removeOperator: mocks.removeOperator,
    submitOperatorInSheet: mocks.submitOperator,
  }),
}))

vi.mock('../SheetOperatorFilterProvider', () => ({
  useOperatorFilterProvider: () => ({
    operatorFiltered: { data: mocks.filteredOperators },
  }),
}))

vi.mock('../../../../../../i18n/i18n', () => ({
  useTranslation: () => ({
    components: {
      editor: {
        operator: {
          sheet: {
            sheetOperator: {
              toolbox: {
                OperatorMutipleSelect: {
                  deselect_all_operators: ({ count }: { count: number }) =>
                    `取消选择全部${count}位密探`,
                  select_all_operators: ({ count }: { count: number }) =>
                    `全选${count}位密探`,
                },
              },
            },
          },
        },
      },
    },
  }),
}))

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

describe('OperatorMutipleSelect', () => {
  let container: HTMLDivElement
  let root: Root

  beforeAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false
  })

  beforeEach(() => {
    mocks.existedOperators = []
    mocks.removeOperator.mockReset()
    mocks.submitOperator.mockReset()
    mocks.submitOperator.mockReturnValue(true)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.clearAllMocks()
  })

  it('selects every filtered operator when the limit is infinite', async () => {
    await act(async () =>
      root.render(
        createElement(OperatorMutipleSelect, {
          maxSelected: Number.POSITIVE_INFINITY,
        }),
      ),
    )

    const selectAll = container.querySelector<HTMLButtonElement>(
      'button[title="全选7位密探"]',
    )
    await act(async () => selectAll?.click())

    expect(mocks.submitOperator).toHaveBeenCalledTimes(7)
  })

  it('keeps the editor default limit at five operators', async () => {
    await act(async () =>
      root.render(createElement(OperatorMutipleSelect)),
    )

    const selectAll = container.querySelector<HTMLButtonElement>(
      'button[title="全选7位密探"]',
    )
    await act(async () => selectAll?.click())

    expect(mocks.submitOperator).toHaveBeenCalledTimes(5)
  })
})
