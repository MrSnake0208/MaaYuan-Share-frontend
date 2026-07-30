import { CopilotInfoStatusEnum } from 'maa-copilot-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createOperation, deleteOperation, updateOperation } from './operation'

const operationApiMocks = vi.hoisted(() => ({
  deleteCopilot: vi.fn(),
  updateCopilotRaw: vi.fn(),
  uploadCopilotRaw: vi.fn(),
}))

vi.mock('utils/maa-copilot-client', () => ({
  OperationApi: class {
    deleteCopilot = operationApiMocks.deleteCopilot
    updateCopilotRaw = operationApiMocks.updateCopilotRaw
    uploadCopilotRaw = operationApiMocks.uploadCopilotRaw
  },
}))

describe('operation mutations', () => {
  beforeEach(() => {
    operationApiMocks.deleteCopilot.mockReset().mockResolvedValue({})
    operationApiMocks.uploadCopilotRaw.mockReset().mockResolvedValue({
      value: vi.fn().mockResolvedValue({ data: 123 }),
    })
    operationApiMocks.updateCopilotRaw.mockReset().mockResolvedValue({
      value: vi.fn().mockResolvedValue({}),
    })
  })

  it('wraps an uploaded operation in uploadCopilotRequest', async () => {
    await createOperation({
      content: '{"doc":{"title":"test"}}',
      status: CopilotInfoStatusEnum.Public,
    })

    expect(operationApiMocks.uploadCopilotRaw).toHaveBeenCalledWith(
      {
        uploadCopilotRequest: {
          content: '{"doc":{"title":"test"}}',
          status: CopilotInfoStatusEnum.Public,
          type: 'PRTS',
        },
      },
      expect.any(Function),
    )
  })

  it('wraps an updated operation in uploadCopilotRequest', async () => {
    await updateOperation({
      id: 123,
      content: '{"doc":{"title":"updated"}}',
      status: CopilotInfoStatusEnum.Private,
    })

    expect(operationApiMocks.updateCopilotRaw).toHaveBeenCalledWith(
      {
        uploadCopilotRequest: {
          id: 123,
          content: '{"doc":{"title":"updated"}}',
          status: CopilotInfoStatusEnum.Private,
          type: 'PRTS',
        },
      },
      expect.any(Function),
    )
  })

  it('wraps a deleted operation in copilotDeleteRequest', async () => {
    await deleteOperation({ id: 123 })

    expect(operationApiMocks.deleteCopilot).toHaveBeenCalledWith({
      copilotDeleteRequest: { id: 123 },
    })
  })
})
