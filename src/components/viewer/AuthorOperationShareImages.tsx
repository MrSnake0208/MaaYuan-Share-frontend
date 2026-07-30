import { useAtomValue } from 'jotai'
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { getOperationShareImageConfigs } from '../../apis/operation-share-image-config'
import { languageAtom } from '../../i18n/i18n'
import type { Operation } from '../../models/operation'
import { DeployedOperatorsShareCard } from './DeployedOperatorsShareCard'
import { OperationShareCard } from './OperationShareCard'
import {
  createOperationShareQrDataUrl,
  renderOperationShareCardBlob,
} from './operationShareImage'
import {
  ObjectUrlStore,
  type OperationShareCardConfig,
  type OperationShareCardKind,
  buildOperationShareModel,
  buildOperationShareUrl,
  getRenderableOperationShareConfigs,
} from './operationShareModel'

type ConfigsByKind = Partial<
  Record<OperationShareCardKind, OperationShareCardConfig>
>
type UrlsByKind = Partial<Record<OperationShareCardKind, string>>

const authorOperationShareImagesContext = createContext<UrlsByKind>({})

const IMAGE_ALT: Record<OperationShareCardKind, string> = {
  actions: '作者配置的作战编排分享图',
  operators: '作者配置的上阵密探分享图',
}

export function AuthorOperationShareImages({
  operation,
  children,
}: {
  operation: Operation
  children?: ReactNode
}) {
  const language = useAtomValue(languageAtom)
  const [configState, setConfigState] = useState<{
    operationId: number
    configs: ConfigsByKind
  }>()
  const [qrCode, setQrCode] = useState<{
    targetUrl: string
    dataUrl: string
  }>()
  const [actionCardNode, setActionCardNode] = useState<HTMLDivElement | null>(
    null,
  )
  const [operatorCardNode, setOperatorCardNode] =
    useState<HTMLDivElement | null>(null)
  const [imageState, setImageState] = useState<{
    operationId: number
    urls: UrlsByKind
  }>()
  const urlStoresRef = useRef({
    actions: new ObjectUrlStore(),
    operators: new ObjectUrlStore(),
  })

  const configs =
    configState?.operationId === operation.id ? configState.configs : {}
  const hasAuthorConfig = Boolean(configs.actions || configs.operators)
  const model = useMemo(() => {
    if (!hasAuthorConfig) return undefined
    const maayuanUrl = buildOperationShareUrl(
      operation.id,
      window.location.origin,
    )
    return buildOperationShareModel(operation, language, maayuanUrl)
  }, [hasAuthorConfig, language, operation])
  const qrDataUrl =
    model && qrCode?.targetUrl === model.qrTargetUrl
      ? qrCode.dataUrl
      : undefined
  const imageUrls =
    imageState?.operationId === operation.id ? imageState.urls : {}

  useEffect(() => {
    let active = true
    void getOperationShareImageConfigs(operation.id)
      .then((remoteConfigs) => {
        if (!active) return
        setConfigState({
          operationId: operation.id,
          configs: getRenderableOperationShareConfigs(remoteConfigs),
        })
      })
      .catch(() => {
        if (!active) return
        setConfigState({ operationId: operation.id, configs: {} })
      })

    return () => {
      active = false
    }
  }, [operation.id])

  useEffect(() => {
    if (!hasAuthorConfig || !model) return
    let active = true
    void createOperationShareQrDataUrl(model.qrTargetUrl)
      .then((dataUrl) => {
        if (active) setQrCode({ targetUrl: model.qrTargetUrl, dataUrl })
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [hasAuthorConfig, model])

  useEffect(() => {
    if (!qrDataUrl) return
    const configuredNodes: Array<
      readonly [OperationShareCardKind, HTMLDivElement]
    > = []
    if (configs.actions && actionCardNode) {
      configuredNodes.push(['actions', actionCardNode])
    }
    if (configs.operators && operatorCardNode) {
      configuredNodes.push(['operators', operatorCardNode])
    }
    if (configuredNodes.length === 0) return

    let active = true
    void Promise.all(
      configuredNodes.map(async ([kind, node]) => {
        const blob = await renderOperationShareCardBlob(node, 1)
        return [kind, blob] as const
      }),
    )
      .then((images) => {
        if (!active) return
        const urls: UrlsByKind = {}
        images.forEach(([kind, blob]) => {
          urls[kind] = urlStoresRef.current[kind].replace(blob)
        })
        setImageState({ operationId: operation.id, urls })
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [
    actionCardNode,
    configs.actions,
    configs.operators,
    operation.id,
    operatorCardNode,
    qrDataUrl,
  ])

  useEffect(() => {
    const urlStores = urlStoresRef.current
    return () => {
      urlStores.actions.revoke()
      urlStores.operators.revoke()
    }
  }, [])

  return (
    <authorOperationShareImagesContext.Provider value={imageUrls}>
      {children}
      {hasAuthorConfig && model ? (
        <div
          aria-hidden
          className="pointer-events-none fixed left-[-12000px] top-0"
        >
          {qrDataUrl && configs.actions ? (
            <OperationShareCard
              cardRef={setActionCardNode}
              config={configs.actions}
              model={model}
              qrDataUrl={qrDataUrl}
            />
          ) : null}
          {qrDataUrl && configs.operators ? (
            <DeployedOperatorsShareCard
              cardRef={setOperatorCardNode}
              config={configs.operators}
              model={model}
              qrDataUrl={qrDataUrl}
            />
          ) : null}
        </div>
      ) : null}
    </authorOperationShareImagesContext.Provider>
  )
}

export function useAuthorOperationShareImage(kind: OperationShareCardKind) {
  return useContext(authorOperationShareImagesContext)[kind]
}

export function AuthorOperationShareImage({
  kind,
}: {
  kind: OperationShareCardKind
}) {
  const imageUrl = useAuthorOperationShareImage(kind)
  if (!imageUrl) return null

  return (
    <a
      className="mt-4 block w-full max-w-[720px] overflow-hidden border border-gray-200 bg-white shadow-sm dark:border-slate-700"
      href={imageUrl}
      rel="noreferrer"
      target="_blank"
    >
      <img alt={IMAGE_ALT[kind]} className="h-auto w-full" src={imageUrl} />
    </a>
  )
}
