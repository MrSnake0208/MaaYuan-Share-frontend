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

import { getOperationShareImageConfigs } from '../../apis/operation-share-image-config'
import type { Operation } from '../../models/operation'
import {
  AuthorOperationShareImage,
  AuthorOperationShareImages,
} from './AuthorOperationShareImages'
import {
  createOperationShareQrDataUrl,
  renderOperationShareCardBlob,
} from './operationShareImage'

vi.mock('../../apis/operation-share-image-config', () => ({
  getOperationShareImageConfigs: vi.fn(),
}))

vi.mock('./operationShareImage', () => ({
  createOperationShareQrDataUrl: vi.fn(),
  renderOperationShareCardBlob: vi.fn(),
}))

const mockedGetConfigs = vi.mocked(getOperationShareImageConfigs)
const mockedCreateQr = vi.mocked(createOperationShareQrDataUrl)
const mockedRenderCard = vi.mocked(renderOperationShareCardBlob)
const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

function createOperation() {
  return {
    id: 100,
    uploader: '测试作者',
    parsedContent: {
      doc: { title: '测试作业', details: '' },
      stageName: '1-1',
      opers: [],
      groups: [],
      actions: [],
    },
  } as unknown as Operation
}

describe('author operation share images', () => {
  let container: HTMLDivElement
  let root: Root

  beforeAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  })

  afterAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false
  })

  beforeEach(() => {
    vi.clearAllMocks()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    mockedCreateQr.mockResolvedValue('data:image/png;base64,qr-code')
    mockedRenderCard.mockResolvedValue(new Blob(['share-image']))
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:share-image'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('renders only the image matching the available author config', async () => {
    mockedGetConfigs.mockResolvedValue([
      {
        cardKey: 'actions',
        schemaVersion: 1,
        revision: 1,
        payload: { showOtherActions: false },
        updatedAt: new Date('2026-07-30T00:00:00Z'),
      },
    ])

    await act(async () => {
      root.render(
        createElement(
          AuthorOperationShareImages,
          { operation: createOperation() },
          createElement(AuthorOperationShareImage, { kind: 'actions' }),
        ),
      )
      await new Promise((resolve) => window.setTimeout(resolve, 20))
    })

    expect(
      container.querySelector('img[alt="作者配置的作战编排分享图"]'),
    ).not.toBeNull()
    expect(
      container.querySelector('img[alt="作者配置的上阵密探分享图"]'),
    ).toBeNull()
    expect(mockedRenderCard).toHaveBeenCalledTimes(1)
  })

  it('does not create an image when no author config exists', async () => {
    mockedGetConfigs.mockResolvedValue([])

    await act(async () => {
      root.render(
        createElement(
          AuthorOperationShareImages,
          { operation: createOperation() },
          createElement('span', null, '原有作业详情'),
        ),
      )
      await new Promise((resolve) => window.setTimeout(resolve, 20))
    })

    expect(mockedCreateQr).not.toHaveBeenCalled()
    expect(mockedRenderCard).not.toHaveBeenCalled()
    expect(container.querySelector('a img')).toBeNull()
    expect(container.textContent).toContain('原有作业详情')
  })
})
