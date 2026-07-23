import { Button, Callout, Dialog, Spinner } from '@blueprintjs/core'

import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { languageAtom, useTranslation } from '../../i18n/i18n'
import type { Operation } from '../../models/operation'
import { formatError } from '../../utils/error'
import { OperationShareCard } from './OperationShareCard'
import {
  ObjectUrlStore,
  buildOperationShareFilename,
  buildOperationShareModel,
  calculateSharePixelRatio,
} from './operationShareModel'

type GenerationStatus = 'idle' | 'generating' | 'ready' | 'error'

const RESOURCE_TIMEOUT_MS = 5000

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

async function waitForCardResources(node: HTMLElement) {
  const fontsReady = document.fonts?.ready ?? Promise.resolve()
  const imagesReady = Promise.all(
    Array.from(node.querySelectorAll('img')).map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        })
      }
      try {
        await image.decode()
      } catch {
        // Failed images retain the local placeholder source and do not block export.
      }
    }),
  )

  await Promise.race([
    Promise.all([fontsReady, imagesReady]),
    delay(RESOURCE_TIMEOUT_MS),
  ])
}

export default function OperationShareDialog({
  operation,
  onClose,
}: {
  operation: Operation
  onClose: () => void
}) {
  const t = useTranslation()
  const language = useAtomValue(languageAtom)
  const model = useMemo(
    () => buildOperationShareModel(operation, language),
    [operation, language],
  )
  const [cardNode, setCardNode] = useState<HTMLDivElement | null>(null)
  const urlStoreRef = useRef(new ObjectUrlStore())
  const generationRef = useRef(0)
  const generatingRef = useRef(false)
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [blob, setBlob] = useState<Blob>()
  const [error, setError] = useState<string>()

  const generate = useCallback(async () => {
    if (!cardNode || generatingRef.current) return

    const generation = ++generationRef.current
    generatingRef.current = true
    setStatus('generating')
    setError(undefined)
    try {
      await waitForCardResources(cardNode)
      const { toBlob } = await import('html-to-image')
      const nextBlob = await toBlob(cardNode, {
        backgroundColor: '#f8fafc',
        cacheBust: true,
        pixelRatio: calculateSharePixelRatio(cardNode.scrollHeight),
        skipFonts: true,
        width: 1080,
      })
      if (!nextBlob) throw new Error('图片转换未返回有效内容')
      if (generation !== generationRef.current) return

      const nextUrl = urlStoreRef.current.replace(nextBlob)
      setBlob(nextBlob)
      setPreviewUrl(nextUrl)
      setStatus('ready')
    } catch (reason) {
      if (generation !== generationRef.current) return
      setStatus('error')
      setError(formatError(reason))
    } finally {
      if (generation === generationRef.current) generatingRef.current = false
    }
  }, [cardNode])

  useEffect(() => {
    const urlStore = urlStoreRef.current
    return () => {
      generationRef.current += 1
      generatingRef.current = false
      urlStore.revoke()
    }
  }, [])

  useEffect(() => {
    if (cardNode) void generate()
  }, [cardNode, generate])

  const download = () => {
    if (!blob || !previewUrl) return
    const anchor = document.createElement('a')
    anchor.href = previewUrl
    anchor.download = buildOperationShareFilename(model)
    anchor.click()
  }

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      className="w-[min(96vw,960px)]"
      icon="media"
      isOpen
      onClose={onClose}
      title={t.components.viewer.OperationViewer.share_image_dialog_title}
    >
      <div className="max-h-[76vh] overflow-auto bg-slate-100 p-4 md:p-6">
        {status === 'generating' || status === 'idle' ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-slate-600">
            <Spinner />
            <span>
              {t.components.viewer.OperationViewer.share_image_generating}
            </span>
          </div>
        ) : null}
        {status === 'error' ? (
          <Callout
            intent="danger"
            title={t.components.viewer.OperationViewer.share_image_failed}
          >
            {error}
          </Callout>
        ) : null}
        {status === 'ready' && previewUrl ? (
          <img
            alt={t.components.viewer.OperationViewer.share_image_preview_alt}
            className="mx-auto block h-auto max-w-full shadow"
            src={previewUrl}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4">
        <Button onClick={onClose}>
          {t.components.viewer.OperationViewer.share_image_close}
        </Button>
        <Button
          disabled={status === 'generating'}
          icon="refresh"
          onClick={() => void generate()}
        >
          {t.components.viewer.OperationViewer.share_image_regenerate}
        </Button>
        <Button
          disabled={status !== 'ready'}
          icon="download"
          intent="primary"
          onClick={download}
        >
          {t.components.viewer.OperationViewer.share_image_download}
        </Button>
      </div>
      <div aria-hidden className="fixed left-[-12000px] top-0">
        <OperationShareCard cardRef={setCardNode} model={model} />
      </div>
    </Dialog>
  )
}
