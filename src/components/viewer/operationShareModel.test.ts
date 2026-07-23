import { describe, expect, it, vi } from 'vitest'

import type { Operation } from '../../models/operation'
import {
  ObjectUrlStore,
  buildOperationShareFilename,
  buildOperationShareModel,
  calculateSharePixelRatio,
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
})

describe('share image utilities', () => {
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
