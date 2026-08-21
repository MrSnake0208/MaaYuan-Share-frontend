import { describe, expect, it } from 'vitest'

import type { EditorMetadata } from '../components/editor2/types'
import {
  buildOperationMetadataPayload,
  containsCJK,
  removeCJK,
  validateEditorMetadata,
} from './operationMetadata'

const createMetadata = (
  overrides: Partial<EditorMetadata> = {},
): EditorMetadata => ({
  visibility: 'public',
  sourceType: 'original',
  tags: ['如鸢'],
  ...overrides,
})

describe('operation metadata', () => {
  it('keeps an optional source URL for original operations', () => {
    expect(
      buildOperationMetadataPayload(
        createMetadata({
          repostAuthor: '不应提交的作者',
          repostPlatform: '不应提交的平台',
          repostUrl: ' https://space.bilibili.com/123 ',
          tags: [' 如鸢 ', '如鸢', '代号鸢'],
        }),
      ),
    ).toEqual({
      sourceType: 'original',
      repostUrl: 'https://space.bilibili.com/123',
      tags: ['如鸢', '代号鸢'],
    })
  })

  it('keeps repost platform ID, platform and link and trims their values', () => {
    expect(
      buildOperationMetadataPayload(
        createMetadata({
          sourceType: 'repost',
          repostAuthor: ' platform-id ',
          repostPlatform: ' B站 ',
          repostUrl: ' https://www.bilibili.com/video/BV1 ',
        }),
      ),
    ).toMatchObject({
      sourceType: 'repost',
      repostAuthor: 'platform-id',
      repostPlatform: 'B站',
      repostUrl: 'https://www.bilibili.com/video/BV1',
    })
  })

  it('allows an original operation without a source URL', () => {
    expect(validateEditorMetadata(createMetadata())).toEqual({ ok: true })
  })

  it('validates any provided source URL as HTTP or HTTPS', () => {
    expect(
      validateEditorMetadata(createMetadata({ repostUrl: 'not-a-url' })),
    ).toEqual({ ok: false, reason: 'invalid-url' })
    expect(
      validateEditorMetadata(
        createMetadata({ repostUrl: 'javascript:alert(1)' }),
      ),
    ).toEqual({ ok: false, reason: 'invalid-url' })
    expect(
      validateEditorMetadata(
        createMetadata({ repostUrl: 'https://example.com/profile' }),
      ),
    ).toEqual({ ok: true })
  })

  it('rejects any provided source URL that contains Chinese (CJK) characters', () => {
    expect(
      validateEditorMetadata(
        createMetadata({ repostUrl: 'https://example.com/中文' }),
      ),
    ).toEqual({ ok: false, reason: 'contains-cjk' })
    expect(
      validateEditorMetadata(
        createMetadata({ repostUrl: 'https://例子.com/profile' }),
      ),
    ).toEqual({ ok: false, reason: 'contains-cjk' })
    // 百分号编码后的中文不算中文，应通过
    expect(
      validateEditorMetadata(
        createMetadata({ repostUrl: 'https://example.com/%E4%B8%AD%E6%96%87' }),
      ),
    ).toEqual({ ok: true })
  })

  it('containsCJK / removeCJK treat Chinese characters correctly', () => {
    expect(containsCJK('https://example.com/中文')).toBe(true)
    expect(containsCJK('https://example.com/abc')).toBe(false)
    expect(removeCJK('a中文b象c文')).toBe('abc')
    // 全角标点不属于汉字（CJK 表意文字），不应被过滤
    expect(removeCJK('https://example.com/）。。')).toBe(
      'https://example.com/）。。',
    )
  })

  it('requires the platform ID, platform and platform link for reposts', () => {
    expect(
      validateEditorMetadata(createMetadata({ sourceType: 'repost' })),
    ).toEqual({
      ok: false,
      reason: 'missing',
      fields: ['repostAuthor', 'repostPlatform', 'repostUrl'],
    })
  })
})
