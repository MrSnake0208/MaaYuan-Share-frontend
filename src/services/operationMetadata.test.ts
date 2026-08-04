import { describe, expect, it } from 'vitest'

import type { EditorMetadata } from '../components/editor2/types'
import {
  buildOperationMetadataPayload,
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
