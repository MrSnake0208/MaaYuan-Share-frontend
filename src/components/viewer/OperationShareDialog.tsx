import { Button, Callout, Checkbox, Dialog, Spinner } from '@blueprintjs/core'

import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { languageAtom, useTranslation } from '../../i18n/i18n'
import type { Operation } from '../../models/operation'
import { formatError } from '../../utils/error'
import { DeployedOperatorsShareCard } from './DeployedOperatorsShareCard'
import { OperationShareCard } from './OperationShareCard'
import {
  OPERATION_SHARE_CELL_COLORS,
  ObjectUrlStore,
  type OperationShareCardKind,
  type OperationShareCellColumn,
  buildOperationShareCellKey,
  buildOperationShareDiscKey,
  buildOperationShareFilename,
  buildOperationShareModel,
  buildOperationShareUrl,
  calculateSharePixelRatio,
  createOperationShareCardConfig,
  getOperationShareCellSelectionState,
  loadOperationShareCardConfig,
  saveOperationShareCardConfig,
  updateOperationShareCellSelection,
} from './operationShareModel'

type GenerationStatus = 'idle' | 'generating' | 'ready' | 'error'

const RESOURCE_TIMEOUT_MS = 5000
const CELL_COLOR_OPTIONS = [
  { color: OPERATION_SHARE_CELL_COLORS[0], label: '暖米色' },
  { color: OPERATION_SHARE_CELL_COLORS[1], label: '浅金色' },
  { color: OPERATION_SHARE_CELL_COLORS[2], label: '鼠尾草绿' },
  { color: OPERATION_SHARE_CELL_COLORS[3], label: '雾蓝灰' },
  { color: OPERATION_SHARE_CELL_COLORS[4], label: '柔粉色' },
  { color: OPERATION_SHARE_CELL_COLORS[5], label: '浅灰色' },
] as const

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
  const maayuanUrl = useMemo(
    () => buildOperationShareUrl(operation.id, window.location.origin),
    [operation.id],
  )
  const model = useMemo(
    () => buildOperationShareModel(operation, language, maayuanUrl),
    [operation, language, maayuanUrl],
  )
  const [cardNode, setCardNode] = useState<HTMLDivElement | null>(null)
  const [cardConfig, setCardConfig] = useState(() =>
    loadOperationShareCardConfig(operation.id),
  )
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const urlStoreRef = useRef(new ObjectUrlStore())
  const generationRef = useRef(0)
  const generatingRef = useRef(false)
  const [cardKind, setCardKind] = useState<OperationShareCardKind>('actions')
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [blob, setBlob] = useState<Blob>()
  const [qrCode, setQrCode] = useState<{
    targetUrl: string
    dataUrl: string
  }>()
  const qrDataUrl =
    qrCode?.targetUrl === model.qrTargetUrl ? qrCode.dataUrl : undefined
  const [error, setError] = useState<string>()

  useEffect(() => {
    saveOperationShareCardConfig(operation.id, cardConfig)
  }, [cardConfig, operation.id])

  const editableColumns = useMemo<
    Array<{ key: OperationShareCellColumn; label: string }>
  >(
    () =>
      model.actionSlots.map((slot) => ({
        key: `slot-${slot}` as OperationShareCellColumn,
        label: `${slot} 号位`,
      })),
    [model.actionSlots],
  )
  const editableColumnGroups = useMemo(
    () =>
      editableColumns.map((column) => ({
        ...column,
        cellKeys: model.rounds.map((round) =>
          buildOperationShareCellKey(round.round, column.key),
        ),
      })),
    [editableColumns, model.rounds],
  )
  const editableRoundGroups = useMemo(
    () =>
      model.rounds.map((round) => ({
        round: round.round,
        cellKeys: editableColumns.map((column) =>
          buildOperationShareCellKey(round.round, column.key),
        ),
      })),
    [editableColumns, model.rounds],
  )

  const invalidatePreview = useCallback(() => {
    generationRef.current += 1
    generatingRef.current = false
    urlStoreRef.current.revoke()
    setBlob(undefined)
    setPreviewUrl(undefined)
    setError(undefined)
    setStatus('idle')
  }, [])

  const updateOption = (
    option: 'showTargetSwitches' | 'showOtherActions' | 'showNotes',
    checked: boolean,
  ) => {
    invalidatePreview()
    setCardConfig((current) => ({ ...current, [option]: checked }))
  }

  const changeCardKind = (nextKind: OperationShareCardKind) => {
    if (nextKind === cardKind) return
    invalidatePreview()
    setSelectedCellKeys(new Set())
    setCardKind(nextKind)
  }

  const updateRoundNote = (round: number, note: string) => {
    invalidatePreview()
    setCardConfig((current) => ({
      ...current,
      notes: { ...current.notes, [round]: note },
    }))
  }

  const toggleCellSelection = (key: string, checked: boolean) => {
    setSelectedCellKeys((current) => {
      const next = new Set(current)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

  const toggleCellGroupSelection = (
    cellKeys: readonly string[],
    checked: boolean,
  ) => {
    setSelectedCellKeys((current) =>
      updateOperationShareCellSelection(current, cellKeys, checked),
    )
  }

  const applyCellColor = (color: string) => {
    if (selectedCellKeys.size === 0) return
    invalidatePreview()
    setCardConfig((current) => {
      const cellColors = { ...current.cellColors }
      selectedCellKeys.forEach((key) => {
        cellColors[key] = color
      })
      return { ...current, cellColors }
    })
    setSelectedCellKeys(new Set())
  }

  const clearCellColor = () => {
    if (selectedCellKeys.size === 0) return
    invalidatePreview()
    setCardConfig((current) => {
      const cellColors = { ...current.cellColors }
      selectedCellKeys.forEach((key) => {
        delete cellColors[key]
      })
      return { ...current, cellColors }
    })
    setSelectedCellKeys(new Set())
  }

  const restoreDefaults = () => {
    const defaults = createOperationShareCardConfig()
    invalidatePreview()
    setSelectedCellKeys(new Set())
    setCardConfig(defaults)
    saveOperationShareCardConfig(operation.id, defaults)
  }

  const updateRequiredDisc = (key: string, checked: boolean) => {
    invalidatePreview()
    setCardConfig((current) => {
      const requiredDiscs = { ...current.requiredDiscs }
      if (checked) requiredDiscs[key] = true
      else delete requiredDiscs[key]
      return { ...current, requiredDiscs }
    })
  }

  const clearRequiredDiscs = () => {
    if (Object.keys(cardConfig.requiredDiscs).length === 0) return
    invalidatePreview()
    setCardConfig((current) => ({ ...current, requiredDiscs: {} }))
  }

  const generate = useCallback(async () => {
    if (!cardNode || !qrDataUrl || generatingRef.current) return

    const generation = ++generationRef.current
    generatingRef.current = true
    setStatus('generating')
    setError(undefined)
    try {
      await waitForCardResources(cardNode)
      const { toBlob } = await import('html-to-image')
      const nextBlob = await toBlob(cardNode, {
        backgroundColor: '#f6f3eb',
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
  }, [cardNode, qrDataUrl])

  useEffect(() => {
    let active = true
    const createQrCode = async () => {
      try {
        const { toDataURL } = await import('qrcode')
        const nextQrDataUrl = await toDataURL(model.qrTargetUrl, {
          color: { dark: '#24312f', light: '#fffdf8' },
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 224,
        })
        if (active) {
          setQrCode({ targetUrl: model.qrTargetUrl, dataUrl: nextQrDataUrl })
        }
      } catch (reason) {
        if (!active) return
        setStatus('error')
        setError(formatError(reason))
      }
    }

    void createQrCode()
    return () => {
      active = false
    }
  }, [model.qrTargetUrl])

  useEffect(() => {
    const urlStore = urlStoreRef.current
    return () => {
      generationRef.current += 1
      generatingRef.current = false
      urlStore.revoke()
    }
  }, [])

  const download = () => {
    if (!blob || !previewUrl) return
    const anchor = document.createElement('a')
    anchor.href = previewUrl
    anchor.download = buildOperationShareFilename(model, cardKind)
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
        <div
          aria-label="分享图片类型"
          className="mb-5 grid grid-cols-2 gap-2 rounded border border-slate-200 bg-white p-2"
          role="tablist"
        >
          <Button
            active={cardKind === 'actions'}
            aria-selected={cardKind === 'actions'}
            icon="timeline-events"
            onClick={() => changeCardKind('actions')}
            role="tab"
          >
            动作序列
          </Button>
          <Button
            active={cardKind === 'operators'}
            aria-selected={cardKind === 'operators'}
            icon="people"
            onClick={() => changeCardKind('operators')}
            role="tab"
          >
            上阵密探
          </Button>
        </div>

        {cardKind === 'actions' ? (
          <fieldset
            className="mb-5 rounded border border-slate-200 bg-white p-4"
            disabled={status === 'generating'}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-800">
                    生成前编辑
                  </h3>
                  <Button icon="reset" minimal onClick={restoreDefaults} small>
                    恢复至默认
                  </Button>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  配置会按当前作业自动缓存；可设置展示内容、逐回合备注和单元格颜色。
                </p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Checkbox
                  checked={cardConfig.showOtherActions}
                  label="显示其他动作列"
                  onChange={(event) =>
                    updateOption(
                      'showOtherActions',
                      event.currentTarget.checked,
                    )
                  }
                />
                <Checkbox
                  checked={cardConfig.showTargetSwitches}
                  disabled={!cardConfig.showOtherActions}
                  label="显示左滑 / 右滑"
                  onChange={(event) =>
                    updateOption(
                      'showTargetSwitches',
                      event.currentTarget.checked,
                    )
                  }
                />
                <Checkbox
                  checked={cardConfig.showNotes}
                  label="增加备注列"
                  onChange={(event) =>
                    updateOption('showNotes', event.currentTarget.checked)
                  }
                />
              </div>
            </div>

            {cardConfig.showNotes && model.rounds.length > 0 ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700">
                  回合备注
                </h4>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {model.rounds.map((round) => (
                    <label
                      key={round.round}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="w-16 shrink-0 pt-2 font-medium">
                        {round.round} 回合
                      </span>
                      <textarea
                        className="min-h-16 flex-1 resize-y rounded border border-slate-300 px-2.5 py-2 text-slate-800 outline-none focus:border-sky-500"
                        maxLength={160}
                        onChange={(event) =>
                          updateRoundNote(
                            round.round,
                            event.currentTarget.value,
                          )
                        }
                        placeholder="输入本回合备注（可选）"
                        value={cardConfig.notes[round.round] ?? ''}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {model.rounds.length > 0 ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">
                      动作单元格配色
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      勾选单元格，或通过行号、列名一次选择整行/整列，再点击颜色
                      应用。
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      aria-label="单元格背景色"
                      className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 p-1"
                      role="group"
                    >
                      {CELL_COLOR_OPTIONS.map((option) => (
                        <button
                          key={option.color}
                          aria-label={`应用${option.label}`}
                          className="h-8 w-8 rounded border border-slate-300 transition-transform enabled:hover:scale-105 enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-sky-500 enabled:focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={selectedCellKeys.size === 0}
                          onClick={() => applyCellColor(option.color)}
                          style={{ backgroundColor: option.color }}
                          title={`应用${option.label}`}
                          type="button"
                        />
                      ))}
                    </div>
                    <Button
                      disabled={selectedCellKeys.size === 0}
                      icon="eraser"
                      onClick={clearCellColor}
                      small
                    >
                      清除颜色
                    </Button>
                    <Button
                      disabled={selectedCellKeys.size === 0}
                      minimal
                      onClick={() => setSelectedCellKeys(new Set())}
                      small
                    >
                      取消选择（{selectedCellKeys.size}）
                    </Button>
                  </div>
                </div>
                <div className="mt-3 max-h-56 overflow-auto rounded border border-slate-200">
                  <table className="w-full border-collapse bg-white text-center text-xs">
                    <thead className="text-slate-600">
                      <tr>
                        <th className="sticky top-0 z-10 border-b border-r border-slate-200 bg-slate-100 px-2 py-2 shadow-[0_1px_0_rgba(148,163,184,0.35)]">
                          回合
                        </th>
                        {editableColumnGroups.map((column) => {
                          const selection = getOperationShareCellSelectionState(
                            selectedCellKeys,
                            column.cellKeys,
                          )
                          return (
                            <th
                              key={column.key}
                              className="sticky top-0 z-10 border-b border-r border-slate-200 bg-slate-100 px-2 py-2 shadow-[0_1px_0_rgba(148,163,184,0.35)] last:border-r-0"
                            >
                              <Checkbox
                                aria-label={`选择${column.label}整列`}
                                checked={selection.checked}
                                className="m-0 inline-flex"
                                indeterminate={selection.indeterminate}
                                label={column.label}
                                onChange={(event) =>
                                  toggleCellGroupSelection(
                                    column.cellKeys,
                                    event.currentTarget.checked,
                                  )
                                }
                              />
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {editableRoundGroups.map((round) => {
                        const selection = getOperationShareCellSelectionState(
                          selectedCellKeys,
                          round.cellKeys,
                        )
                        return (
                          <tr key={round.round}>
                            <th className="border-b border-r border-slate-200 px-2 py-2 font-medium text-slate-600">
                              <Checkbox
                                aria-label={`选择第 ${round.round} 回合整行`}
                                checked={selection.checked}
                                className="m-0 inline-flex"
                                indeterminate={selection.indeterminate}
                                label={`${round.round}`}
                                onChange={(event) =>
                                  toggleCellGroupSelection(
                                    round.cellKeys,
                                    event.currentTarget.checked,
                                  )
                                }
                              />
                            </th>
                            {editableColumns.map((column, columnIndex) => {
                              const key = round.cellKeys[columnIndex]
                              if (!key) return null
                              return (
                                <td
                                  key={column.key}
                                  className="border-b border-r border-slate-200 px-2 py-2 last:border-r-0"
                                  style={{
                                    backgroundColor:
                                      cardConfig.cellColors[key] ?? undefined,
                                  }}
                                >
                                  <Checkbox
                                    aria-label={`${round.round} 回合 ${column.label}`}
                                    checked={selectedCellKeys.has(key)}
                                    className="m-0 inline-block"
                                    onChange={(event) =>
                                      toggleCellSelection(
                                        key,
                                        event.currentTarget.checked,
                                      )
                                    }
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </fieldset>
        ) : (
          <fieldset
            className="mb-5 rounded border border-slate-200 bg-white p-4"
            disabled={status === 'generating'}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-800">
                    生成前编辑
                  </h3>
                  <Button
                    disabled={
                      Object.keys(cardConfig.requiredDiscs).length === 0
                    }
                    icon="reset"
                    minimal
                    onClick={clearRequiredDiscs}
                    small
                  >
                    清除必须标记
                  </Button>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  配置会按当前作业自动缓存；可将关键命盘标记为“必须”，禁用命盘会自动标注为“绝对不能有”。
                </p>
              </div>
            </div>

            {model.operators.some((operator) => operator.discs.length > 0) ? (
              <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-2">
                {model.operators.map((operator, operatorIndex) => (
                  <section
                    key={`${operator.rawName}-${operatorIndex}`}
                    className="rounded border border-slate-200 bg-slate-50 p-3"
                  >
                    <h4 className="text-sm font-semibold text-slate-700">
                      {operator.slot ?? operatorIndex + 1} 号位 {'·'}
                      {operator.name}
                    </h4>
                    {operator.discs.length > 0 ? (
                      <div className="mt-2 grid gap-1.5">
                        {operator.discs.map((disc) => {
                          const key = buildOperationShareDiscKey(
                            operator.slot ?? operatorIndex + 1,
                            disc.slot,
                          )
                          if (disc.forbidden) {
                            return (
                              <div
                                key={key}
                                className="flex items-center gap-2 rounded border border-red-300 bg-red-50 px-2.5 py-2 text-sm font-semibold text-red-800"
                              >
                                <span className="shrink-0 rounded bg-red-700 px-1.5 py-0.5 text-xs font-bold text-white">
                                  绝对不能有
                                </span>
                                <span>
                                  {disc.slot} 号命盘：{disc.abbreviation}
                                </span>
                              </div>
                            )
                          }
                          return (
                            <Checkbox
                              key={key}
                              checked={cardConfig.requiredDiscs[key] === true}
                              label={`${disc.slot} 号命盘：${disc.abbreviation}`}
                              onChange={(event) =>
                                updateRequiredDisc(
                                  key,
                                  event.currentTarget.checked,
                                )
                              }
                            />
                          )
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">未配置命盘</p>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <p className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-400">
                当前上阵密探未配置命盘。
              </p>
            )}
          </fieldset>
        )}

        {status === 'idle' ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-white text-slate-500">
            <span className="text-base font-medium">图片尚未生成</span>
            <span className="text-sm">
              完成上方编辑后，点击“生成图片”预览。
            </span>
          </div>
        ) : null}
        {status === 'generating' ? (
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
          disabled={status === 'generating' || !cardNode || !qrDataUrl}
          icon={status === 'idle' ? 'media' : 'refresh'}
          intent={status === 'idle' ? 'primary' : 'none'}
          onClick={() => void generate()}
        >
          {status === 'idle'
            ? '生成图片'
            : t.components.viewer.OperationViewer.share_image_regenerate}
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
        {qrDataUrl ? (
          cardKind === 'actions' ? (
            <OperationShareCard
              cardRef={setCardNode}
              config={cardConfig}
              model={model}
              qrDataUrl={qrDataUrl}
            />
          ) : (
            <DeployedOperatorsShareCard
              cardRef={setCardNode}
              config={cardConfig}
              model={model}
              qrDataUrl={qrDataUrl}
            />
          )
        ) : null}
      </div>
    </Dialog>
  )
}
