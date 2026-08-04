import type { OperationMetadataPayload } from '../apis/operation'
import type { EditorMetadata } from '../components/editor2/types'

export type EditorMetadataField =
  'tags' | 'repostAuthor' | 'repostPlatform' | 'repostUrl'

export type EditorMetadataValidationResult =
  | { ok: true }
  | { ok: false; reason: 'missing'; fields: EditorMetadataField[] }
  | { ok: false; reason: 'invalid-url' }

const tidy = (value?: string) => {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : undefined
}

const cleanTags = (tags?: string[]) =>
  Array.isArray(tags)
    ? Array.from(
        new Set(
          tags.map((tag) => (tag ?? '').trim()).filter((tag) => tag.length > 0),
        ),
      )
    : undefined

export function validateEditorMetadata(
  metadata: EditorMetadata,
): EditorMetadataValidationResult {
  const missingFields: EditorMetadataField[] = []

  if (!cleanTags(metadata.tags)?.length) {
    missingFields.push('tags')
  }

  if (metadata.sourceType === 'repost') {
    if (!tidy(metadata.repostAuthor)) {
      missingFields.push('repostAuthor')
    }
    if (!tidy(metadata.repostPlatform)) {
      missingFields.push('repostPlatform')
    }
    if (!tidy(metadata.repostUrl)) {
      missingFields.push('repostUrl')
    }
  }

  if (missingFields.length > 0) {
    return { ok: false, reason: 'missing', fields: missingFields }
  }

  const sourceUrl = tidy(metadata.repostUrl)
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { ok: false, reason: 'invalid-url' }
      }
    } catch {
      return { ok: false, reason: 'invalid-url' }
    }
  }

  return { ok: true }
}

export function buildOperationMetadataPayload(
  metadata: EditorMetadata,
): OperationMetadataPayload {
  const sourceType = metadata.sourceType === 'repost' ? 'repost' : 'original'
  const base: OperationMetadataPayload = {
    sourceType,
    tags: cleanTags(metadata.tags),
    repostUrl: tidy(metadata.repostUrl),
  }

  if (sourceType === 'original') {
    return base
  }

  return {
    ...base,
    repostAuthor: tidy(metadata.repostAuthor),
    repostPlatform: tidy(metadata.repostPlatform),
  }
}
