import {
  Callout,
  FormGroup,
  InputGroup,
  Radio,
  RadioGroup,
  Switch,
  Tag,
  TextArea,
} from '@blueprintjs/core'

import clsx from 'clsx'
import { useAtom, useAtomValue } from 'jotai'
import { useImmerAtom } from 'jotai-immer'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { Paths } from 'type-fest'

import { i18n, useTranslation } from '../../i18n/i18n'
import { Level, OpDifficulty, Operation } from '../../models/operation'
import { OperatorAvatar } from '../OperatorAvatar'
import { NumericInput2 } from '../editor/NumericInput2'
import { LevelSelect } from './LevelSelect'
import { editorAtoms, useEdit } from './editor-state'
import { OperatorSidebarInInfo } from './operator/OperatorSidebarInInfo'
import { DEFAULT_SIMING_ACTION_DELAYS } from './siming/constants'
import { EditorSourceType } from './types'
import { CopilotOperation, getLabeledPath } from './validation/schema'
import { TagsFilter } from '../TagsFilter'

interface InfoEditorProps {
  className?: string
  preLevel?: Operation['preLevel']
}

export const InfoEditor = memo(({ className, preLevel }: InfoEditorProps) => {
  const [info, setInfo] = useImmerAtom(editorAtoms.operationBase)
  const [metadata, setMetadata] = useImmerAtom(editorAtoms.metadata)
  const edit = useEdit()
  const t = useTranslation()
  const selectedOperators = useAtomValue(editorAtoms.operators)
  const metadataLocked = useAtomValue(editorAtoms.metadataLocked)
  const [operatorsLocked, setOperatorsLocked] = useAtom(
    editorAtoms.operatorsLocked,
  )
  const globalErrors = useAtomValue(editorAtoms.visibleGlobalErrors)

  useEffect(() => {
    if (info.difficulty === undefined) {
      setInfo((prev) => {
        prev.difficulty = OpDifficulty.UNKNOWN
      })
    }
  }, [info.difficulty, setInfo])

  const simingDelays = info.simingActionDelays ?? DEFAULT_SIMING_ACTION_DELAYS

  // 司命延迟快捷预设
  const presetFast = { attack: 2000, ultimate: 4000, defense: 2000 } as const
  const presetNormal = { attack: 3000, ultimate: 5000, defense: 3000 } as const
  const presetSlow = { attack: 6000, ultimate: 10000, defense: 6000 } as const

  const isPresetEqual = (
    a: { attack: number; ultimate: number; defense: number },
    b: { attack: number; ultimate: number; defense: number },
  ) =>
    a.attack === b.attack &&
    a.ultimate === b.ultimate &&
    a.defense === b.defense

  const currentIsFast = isPresetEqual(simingDelays, presetFast)
  const currentIsNormal = isPresetEqual(simingDelays, presetNormal)
  const currentIsSlow = isPresetEqual(simingDelays, presetSlow)

  const applyPreset = (
    preset: 'fast' | 'normal' | 'slow',
    values: typeof presetFast | typeof presetNormal | typeof presetSlow,
  ) => {
    edit(() => {
      setInfo((prev) => {
        prev.simingActionDelays = { ...values }
      })
      return {
        action: 'set-siming-preset',
        desc: i18n.actions.editor2.set_siming_preset,
        squashBy: 'siming-preset-' + preset,
      }
    })
  }

  const fallbackLevel = useMemo<Level | undefined>(() => {
    if (preLevel) {
      return preLevel
    }
    const meta = info.levelMeta
    if (!meta) return undefined
    return {
      stageId: meta.stageId ?? '',
      levelId: meta.levelId ?? '',
      name: meta.name ?? '',
      catOne: meta.catOne ?? '',
      catTwo: meta.catTwo ?? '',
      catThree: meta.catThree ?? '',
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    }
  }, [info.levelMeta, preLevel])

  const defaultCategory =
    fallbackLevel?.catOne?.trim() ||
    fallbackLevel?.catTwo?.trim() ||
    fallbackLevel?.catThree?.trim() ||
    undefined

  const updateSimingDelay = (
    key: keyof typeof DEFAULT_SIMING_ACTION_DELAYS,
    nextValue: number,
  ) => {
    const normalized = Math.max(0, Math.round(nextValue))
    if (simingDelays[key] === normalized) {
      return
    }
    edit(() => {
      setInfo((prev) => {
        if (!prev.simingActionDelays) {
          prev.simingActionDelays = { ...DEFAULT_SIMING_ACTION_DELAYS }
        }
        prev.simingActionDelays[key] = normalized
      })
      return {
        action: 'set-siming-delay',
        desc: i18n.actions.editor2.set_siming_delay,
        squashBy: 'siming-delay-' + key,
      }
    })
  }

  const assignLevelMeta = useCallback(
    (level: Level | undefined, fallbackStageId?: string) => {
      if (!level) {
        return fallbackStageId
          ? {
              stageId: fallbackStageId,
              catTwo: fallbackStageId,
            }
          : undefined
      }
      return {
        stageId: level.stageId || fallbackStageId,
        levelId: level.levelId,
        name: level.name,
        catOne: level.catOne,
        catTwo: level.catTwo,
        catThree: level.catThree,
        width: level.width,
        height: level.height,
      }
    },
    [],
  )

  useEffect(() => {
    if (!preLevel) {
      return
    }
    const nextMeta = assignLevelMeta(preLevel)
    if (!nextMeta?.stageId) {
      return
    }
    setInfo((prev) => {
      if (prev.levelMeta?.stageId) {
        return
      }
      prev.levelMeta = nextMeta
      if (!prev.stageName) {
        prev.stageName = nextMeta.stageId ?? ''
      }
    })
  }, [assignLevelMeta, preLevel, setInfo])

  useEffect(() => {
    if (info.stageName?.trim()) {
      return
    }
    if (!fallbackLevel?.stageId?.trim()) {
      return
    }
    edit(() => {
      setInfo((prev) => {
        if (!prev.stageName?.trim()) {
          prev.stageName = fallbackLevel.stageId
        }
        if (!prev.levelMeta?.stageId) {
          prev.levelMeta = assignLevelMeta(fallbackLevel, fallbackLevel.stageId)
        }
      })
      return {
        action: 'hydrate-level-from-meta',
        desc: i18n.actions.editor2.set_level,
      }
    })
  }, [assignLevelMeta, edit, fallbackLevel, info.stageName, setInfo])

  const currentSourceType = metadata.sourceType ?? 'original'
  const isRepost = currentSourceType === 'repost'

  // 记录用户是否主动编辑过 catThree，以避免后续被默认值覆盖
  const catThreeEditedRef = useRef(false)

  // 当关卡或 catThree 变化时，将 catThree 按关卡 key 持久化到 localStorage
  useEffect(() => {
    const key = `prts-editor-catThree:${info.stageName ?? ''}`
    const value = info.levelMeta?.catThree ?? ''
    try {
      // 仅当有 stageName 时进行存储
      if ((info.stageName ?? '').trim().length) {
        window.localStorage.setItem(key, value)
      }
    } catch {}
  }, [info.levelMeta?.catThree, info.stageName])

  // 当切换关卡时，尝试恢复之前编辑过的 catThree
  useEffect(() => {
    const key = `prts-editor-catThree:${info.stageName ?? ''}`
    try {
      if ((info.stageName ?? '').trim().length) {
        const stored = window.localStorage.getItem(key)
        if (stored !== null) {
          setInfo((prev) => {
            if (!prev.levelMeta) prev.levelMeta = {}
            prev.levelMeta.catThree = stored
          })
          catThreeEditedRef.current = true
        }
      }
    } catch {}
  }, [info.stageName, setInfo])

  return (
    <div
      className={clsx(
        'p-4 md:[&>.bp4-form-group]:flex-row md:[&>.bp4-form-group>.bp4-label]:w-20',
        '[&_[type="text"]]:!border-0 [&_textarea]:!outline-none [&_[type="text"]]:shadow-[inset_0_0_2px_0_rgba(0,0,0,0.4)] [&_textarea:not(:focus)]:!shadow-[inset_0_0_2px_0_rgba(0,0,0,0.4)]',
        className,
      )}
    >
      <h3 className="mb-2 text-lg font-bold">
        {t.components.editor2.InfoEditor.job_info}
      </h3>

      <FormGroup
        contentClassName="grow"
        label={t.components.editor2.InfoEditor.stage}
        labelInfo="*"
      >
        <LevelSelect
          difficulty={info.difficulty ?? OpDifficulty.UNKNOWN}
          value={info.stageName}
          activityLevelRecognitionName={info.levelRecognitionName ?? ''}
          activityDifficultyOverride={info.activityDifficultyOverride ?? ''}
          fallbackLevel={fallbackLevel}
          defaultCategory={defaultCategory}
          onChange={(stageId, level) => {
            edit(() => {
              setInfo((prev) => {
                const prevMeta = prev.levelMeta
                const previousCatThree = prev.levelMeta?.catThree
                prev.stageName = stageId
                if (level && !prev.doc.title) {
                  // 如果没有标题，则使用关卡名作为标题
                  const normalizedName = level.name?.trim()
                  prev.doc.title = normalizedName?.length
                    ? normalizedName
                    : level.stageId
                }
                prev.levelMeta = assignLevelMeta(level, stageId)
                // 若选择了具体关卡且用户编辑过 catThree，则保留用户输入
                if (level && catThreeEditedRef.current) {
                  if (!prev.levelMeta) prev.levelMeta = {}
                  prev.levelMeta.catThree = previousCatThree ?? ''
                }
                if (!level) {
                  // 删除关卡名称时，保留已选择的分类，便于后续筛选
                  const prevCatOne = prevMeta?.catOne?.trim() ?? ''
                  const prevCatTwo = prevMeta?.catTwo?.trim() ?? ''
                  const hasPrevCats = prevCatOne.length > 0 || prevCatTwo.length > 0
                  if (hasPrevCats) {
                    if (!prev.levelMeta) prev.levelMeta = {}
                    if (prevCatOne) prev.levelMeta.catOne = prevCatOne
                    if (prevCatTwo) prev.levelMeta.catTwo = prevCatTwo
                    prev.levelMeta.catThree = ''
                  } else {
                    prev.levelMeta = undefined
                  }
                  catThreeEditedRef.current = false
                }
              })
              return {
                action: 'update-level',
                desc: i18n.actions.editor2.set_level,
              }
            })
          }}
          onDifficultyChange={(val) => {
            edit(() => {
              setInfo((prev) => {
                prev.difficulty = val
              })
              return {
                action: 'set-difficulty',
                desc: i18n.actions.editor2.set_difficulty,
                squashBy: '',
              }
            })
          }}
          onActivityLevelRecognitionNameChange={(nextValue) => {
            edit(() => {
              setInfo((prev) => {
                prev.levelRecognitionName = nextValue
              })
              return {
                action: 'set-activity-recognition',
                desc: i18n.actions.editor2.set_level,
                squashBy: '',
              }
            })
          }}
          rightExtra={
            <InputGroup
              large
              fill
              placeholder={t.components.editor2.InfoEditor.cat_three_placeholder}
              value={info.levelMeta?.catThree ?? ''}
              onChange={(e) => {
                const value = e.target.value
                catThreeEditedRef.current = true
                edit(() => {
                  setInfo((prev) => {
                    if (!prev.levelMeta) prev.levelMeta = {}
                    prev.levelMeta.catThree = value
                  })
                  return {
                    action: 'update-cat-three',
                    desc: i18n.actions.editor2.set_level,
                    squashBy: '',
                  }
                })
              }}
              onBlur={() => edit()}
            />
          }
          onActivityDifficultyOverrideChange={(nextValue) => {
            edit(() => {
              setInfo((prev) => {
                prev.activityDifficultyOverride = nextValue
              })
              return {
                action: 'set-activity-difficulty',
                desc: i18n.actions.editor2.set_level,
                squashBy: '',
              }
            })
          }}
        />
        {/* 分类回显：catOne / catTwo / catThree */}
        {info.levelMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {info.levelMeta.catOne?.trim() && (
              <Tag minimal>{info.levelMeta.catOne}</Tag>
            )}
            {info.levelMeta.catTwo?.trim() && (
              <Tag minimal>{info.levelMeta.catTwo}</Tag>
            )}
            {info.levelMeta.catThree?.trim() && (
              <Tag minimal intent="primary">{info.levelMeta.catThree}</Tag>
            )}
          </div>
        )}
        <FieldError path="stage_name" />
      </FormGroup>

      {/* catThree 已并入与关卡类别/名称同一行显示，见 LevelSelect.rightExtra */}

      {/* Tags 编辑（多选 AND） */}
      <FormGroup
        contentClassName="grow"
        label={t.components.editor2.InfoEditor.tags}
        labelInfo="*"
      >
        <TagsFilter
          value={metadata.tags ?? []}
          onChange={(next) => {
            edit(() => {
              setMetadata((prev) => {
                prev.tags = next
              })
              return {
                action: 'set-tags',
                desc: i18n.actions.editor2.set_tags,
                squashBy: '',
              }
            })
          }}
        />
        {globalErrors &&
          globalErrors.filter((e) => e.path.join('.') === 'metadata.tags')
            .length > 0 && (
            <Callout intent="danger" icon={null} className="mt-1 p-2 text-xs">
              {globalErrors
                .filter((e) => e.path.join('.') === 'metadata.tags')
                .map(({ path, message }) => (
                  <p key={path.join()}>
                    {getLabeledPath(path)}: {message}
                  </p>
                ))}
            </Callout>
          )}
      </FormGroup>
      <FormGroup
        contentClassName="grow"
        label={t.components.editor2.SelectorPanel.operator}
        labelInfo="*"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {selectedOperators.length === 0 ? (
              <Tag minimal>
                {t.components.editor2.OperatorEditor.no_operators}
              </Tag>
            ) : (
              selectedOperators.map((op) => (
                <OperatorAvatar
                  key={op.id}
                  name={op.name}
                  size="verylarge" /* 48px */
                  sourceSize={96}
                />
              ))
            )}
          </div>
          <OperatorSidebarInInfo />
                    <Switch
            checked={operatorsLocked}
            onChange={(e) =>
              setOperatorsLocked((e.target as HTMLInputElement).checked)
            }
            label={"锁定所有密探"}
          />
          {operatorsLocked && (
            <Tag minimal intent="warning" icon="lock">
              已锁定
            </Tag>
          )}
        </div>
        <FieldError path="opers" />
      </FormGroup>
      {/* 隐藏适用难度选择，保留字段以兼容旧数据 */}
      <input
        type="hidden"
        name="difficulty"
        value={info.difficulty ?? OpDifficulty.UNKNOWN}
        readOnly
      />
      <FormGroup
        contentClassName="grow"
        label={t.components.editor2.InfoEditor.title}
        labelInfo="*"
      >
        <InputGroup
          large
          fill
          placeholder={t.components.editor2.InfoEditor.title_placeholder}
          value={info.doc?.title || ''}
          onChange={(e) => {
            edit(() => {
              setInfo((prev) => {
                prev.doc.title = e.target.value
              })
              return {
                action: 'update-title',
                desc: i18n.actions.editor2.set_title,
                squashBy: '',
              }
            })
          }}
          onBlur={() => edit()}
        />
        <FieldError path="doc.title" />
      </FormGroup>
      <FormGroup
        contentClassName="grow"
        label={t.components.editor2.InfoEditor.description}
      >
        <TextArea
          fill
          rows={4}
          large
          placeholder={t.components.editor2.InfoEditor.description_placeholder}
          value={info.doc?.details || ''}
          onChange={(e) => {
            edit(() => {
              setInfo((prev) => {
                prev.doc.details = e.target.value
              })
              return {
                action: 'update-details',
                desc: i18n.actions.editor2.set_description,
                squashBy: '',
              }
            })
          }}
          onBlur={() => edit()}
        />
        <FieldError path="doc.details" />
      </FormGroup>
      <FormGroup
        contentClassName="grow"
        label={t.components.editor2.InfoEditor.source}
        labelInfo="*"
      >
        <RadioGroup
          inline
          selectedValue={currentSourceType}
          onChange={(e) => {
            if (metadataLocked) return
            const nextSourceType = e.currentTarget.value as EditorSourceType
            edit(() => {
              setMetadata((prev) => {
                prev.sourceType = nextSourceType
                if (nextSourceType === 'original') {
                  prev.repostAuthor = ''
                  prev.repostPlatform = ''
                  prev.repostUrl = ''
                }
              })
              return {
                action: 'set-source-type',
                desc: i18n.actions.editor2.set_source_type,
                squashBy: '',
              }
            })
          }}
        >
          <Radio className="!mt-0" value="original" disabled={metadataLocked}>
            {t.components.editor2.InfoEditor.source_original}
          </Radio>
          <Radio className="!mt-0" value="repost" disabled={metadataLocked}>
            {t.components.editor2.InfoEditor.source_repost}
          </Radio>
        </RadioGroup>

        {isRepost && (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <FormGroup
              contentClassName="grow"
              label={t.components.editor2.InfoEditor.repost_author}
              labelInfo="*"
            >
              <InputGroup
                large
                fill
                placeholder={
                  t.components.editor2.InfoEditor.repost_author_placeholder
                }
                value={metadata.repostAuthor ?? ''}
                disabled={metadataLocked}
                onChange={(e) => {
                  const value = e.target.value
                  edit(() => {
                    setMetadata((prev) => {
                      prev.repostAuthor = value
                    })
                    return {
                      action: 'set-repost-author',
                      desc: i18n.actions.editor2.set_repost_author,
                      squashBy: '',
                    }
                  })
                }}
                onBlur={() => edit()}
              />
            </FormGroup>
            <FormGroup
              contentClassName="grow"
              label={t.components.editor2.InfoEditor.repost_platform}
              labelInfo="*"
            >
              <div className="bp4-html-select bp4-fill bp4-large">
                <select
                  value={metadata.repostPlatform ?? ''}
                  disabled={metadataLocked}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    edit(() => {
                      setMetadata((prev) => {
                        prev.repostPlatform = value
                      })
                      return {
                        action: 'set-repost-platform',
                        desc: i18n.actions.editor2.set_repost_platform,
                        squashBy: '',
                      }
                    })
                  }}
                  onBlur={() => edit()}
                >
                  <option value="" disabled>
                    {
                      t.components.editor2.InfoEditor
                        .repost_platform_placeholder
                    }
                  </option>
                  <option value="小红书">小红书</option>
                  <option value="作业站">作业站</option>
                  <option value="微博">微博</option>
                  <option value="B站">B站</option>
                  <option value="抖音">抖音</option>
                </select>
              </div>
            </FormGroup>
            <FormGroup
              contentClassName="grow"
              label={t.components.editor2.InfoEditor.repost_link}
              labelInfo="*"
            >
              <InputGroup
                large
                fill
                type="url"
                placeholder={
                  t.components.editor2.InfoEditor.repost_link_placeholder
                }
                value={metadata.repostUrl ?? ''}
                disabled={metadataLocked}
                onChange={(e) => {
                  const value = e.target.value
                  edit(() => {
                    setMetadata((prev) => {
                      prev.repostUrl = value
                    })
                    return {
                      action: 'set-repost-url',
                      desc: i18n.actions.editor2.set_repost_url,
                      squashBy: '',
                    }
                  })
                }}
                onBlur={() => edit()}
              />
            </FormGroup>
          </div>
        )}
      </FormGroup>
      <FormGroup
        contentClassName="grow"
        label={t.components.editor2.InfoEditor.siming_settings}
        helperText={t.components.editor2.InfoEditor.siming_delay_hint}
      >
        {/* 预设选项：极速 / 普通 / 超慢 */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {t.components.editor2.InfoEditor.siming_preset_label}
          </span>
          <Tag
            interactive
            minimal={!currentIsFast}
            intent={currentIsFast ? 'primary' : 'none'}
            onClick={() => applyPreset('fast', presetFast)}
          >
            {t.components.editor2.InfoEditor.siming_preset_fast}
            <span className="ml-1 opacity-70">(2000/4000/2000)</span>
          </Tag>
          <Tag
            interactive
            minimal={!currentIsNormal}
            intent={currentIsNormal ? 'primary' : 'none'}
            onClick={() => applyPreset('normal', presetNormal)}
          >
            {t.components.editor2.InfoEditor.siming_preset_normal}
            <span className="ml-1 opacity-70">(3000/5000/3000)</span>
          </Tag>
          <Tag
            interactive
            minimal={!currentIsSlow}
            intent={currentIsSlow ? 'primary' : 'none'}
            onClick={() => applyPreset('slow', presetSlow)}
          >
            {t.components.editor2.InfoEditor.siming_preset_slow}
            <span className="ml-1 opacity-70">(6000/10000/6000)</span>
          </Tag>
          {!(currentIsFast || currentIsNormal || currentIsSlow) && (
            <Tag minimal className="ml-1" intent="none">
              {t.components.editor2.InfoEditor.siming_preset_custom}
            </Tag>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto">
            <span className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {t.components.editor2.InfoEditor.siming_delay_attack}
            </span>
            <NumericInput2
              min={1000}
              max={60000}
              intOnly
              stepSize={100}
              majorStepSize={1000}
              wheelStepSize={100}
              value={simingDelays.attack}
              aria-label={t.components.editor2.InfoEditor.siming_delay_attack}
              containerClassName="editor-loop-range-input w-28"
              onValueChange={(value) => updateSimingDelay('attack', value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto">
            <span className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {t.components.editor2.InfoEditor.siming_delay_ultimate}
            </span>
            <NumericInput2
              min={3000}
              max={60000}
              intOnly
              stepSize={100}
              majorStepSize={1000}
              wheelStepSize={100}
              value={simingDelays.ultimate}
              aria-label={t.components.editor2.InfoEditor.siming_delay_ultimate}
              containerClassName="editor-loop-range-input w-28"
              onValueChange={(value) => updateSimingDelay('ultimate', value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto">
            <span className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {t.components.editor2.InfoEditor.siming_delay_defense}
            </span>
            <NumericInput2
              min={1000}
              max={60000}
              intOnly
              stepSize={100}
              majorStepSize={1000}
              wheelStepSize={100}
              value={simingDelays.defense}
              aria-label={t.components.editor2.InfoEditor.siming_delay_defense}
              containerClassName="editor-loop-range-input w-28"
              onValueChange={(value) => updateSimingDelay('defense', value)}
            />
          </div>
        </div>
      </FormGroup>
      <FormGroup
        className="mb-0"
        contentClassName="grow"
        label={t.components.editor2.InfoEditor.visibility}
      >
        <RadioGroup
          inline
          selectedValue={metadata.visibility}
          onChange={(e) => {
            edit(() => {
              setMetadata((prev) => {
                prev.visibility = e.currentTarget.value as 'public' | 'private'
              })
              return {
                action: 'update-visibility',
                desc: i18n.actions.editor2.set_visibility,
                squashBy: '',
              }
            })
          }}
        >
          <Radio className="!mt-0" value="public">
            {t.components.editor2.InfoEditor.public}
          </Radio>
          <Radio className="!mt-0" value="private">
            {t.components.editor2.InfoEditor.private}
            <span className="ml-2 text-xs opacity-50">
              {t.components.editor2.InfoEditor.private_note}
            </span>
          </Radio>
        </RadioGroup>
      </FormGroup>
    </div>
  )
})
InfoEditor.displayName = 'InfoEditor'

const FieldError = ({ path }: { path: Paths<CopilotOperation> }) => {
  const globalErrors = useAtomValue(editorAtoms.visibleGlobalErrors)
  const errors = globalErrors?.filter((e) => e.path.join('.') === path)
  if (!errors?.length) return null
  return (
    <Callout intent="danger" icon={null} className="mt-1 p-2 text-xs">
      {errors.map(({ path, message }) => (
        <p key={path.join()}>
          {getLabeledPath(path)}: {message}
        </p>
      ))}
    </Callout>
  )
}
