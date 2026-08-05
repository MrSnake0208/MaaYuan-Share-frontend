import {
  Alert,
  Button,
  Classes,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  InputGroup,
  Menu,
  MenuDivider,
  MenuItem,
} from '@blueprintjs/core'
import { Popover2 } from '@blueprintjs/popover2'

import {
  createOperatorStarStonePreset,
  deleteOperatorStarStonePreset,
  updateOperatorStarStonePreset,
  useOperatorStarStonePresets,
  useRefreshOperatorStarStonePresets,
} from 'apis/operator-star-stone-preset'
import clsx from 'clsx'
import { useAtomValue } from 'jotai'
import { StarStonePresetKind } from 'maa-copilot-client'
import { FC, FormEvent, memo, useState } from 'react'

import {
  OPERATOR_STAR_STONE_PRESETS,
  OperatorStarPreset,
} from '../../../data/operator-star-stone-presets'
import {
  AssistStarName,
  MainStarName,
  StarStoneOperatorProfile,
  getAssistStarAvailability,
  getMainStarAvailability,
} from '../../../data/star-stones'
import { useTranslation } from '../../../i18n/i18n'
import { authAtom } from '../../../store/auth'
import { formatError } from '../../../utils/error'
import { Select } from '../../Select'
import { AppToaster } from '../../Toaster'
import { EditorOperator, useEdit } from '../editor-state'
import {
  applyAssistStarPreset,
  applyMainStarPreset,
  getDiscSlots,
} from './operatorDiscModel'
import { getUserOperatorStarStonePresetSet } from './operatorStarStonePresetModel'

interface OperatorStarStonePresetSelectProps {
  operator: EditorOperator
  operatorId: string
  operatorProfile: StarStoneOperatorProfile
  onChange?: (operator: EditorOperator) => void
}

interface PresetControlProps<T extends string> {
  label: string
  emptyLabel: string
  presets: OperatorStarPreset<T>[]
  getDisabledReason: (preset: OperatorStarPreset<T>) => string | undefined
  onSelect: (preset: OperatorStarPreset<T>) => void
}

interface ManagedPreset {
  serverId: string
  label: string
  kind: StarStonePresetKind
}

type PresetDialogState =
  | {
      mode: 'create'
      kind: StarStonePresetKind
      values: (string | null)[]
    }
  | {
      mode: 'rename'
      preset: ManagedPreset
    }

function PresetControl<T extends string>({
  label,
  emptyLabel,
  presets,
  getDisabledReason,
  onSelect,
}: PresetControlProps<T>) {
  const availablePresets = presets.filter(
    (preset) => !getDisabledReason(preset),
  )

  if (availablePresets.length === 0) {
    return (
      <Button
        small
        minimal
        disabled
        title={emptyLabel}
        className="flex-1 min-w-0 !px-1 !rounded-md !border-2 !border-current bg-slate-200 dark:bg-slate-600"
      >
        <span className="block min-w-0 truncate">{emptyLabel}</span>
      </Button>
    )
  }

  return (
    <Select
      className="flex-1 min-w-0"
      filterable={false}
      items={availablePresets}
      itemRenderer={(preset, { handleClick, handleFocus, modifiers }) => (
        <MenuItem
          roleStructure="listoption"
          key={preset.id}
          icon={'serverId' in preset ? 'user' : undefined}
          className={clsx(
            'min-w-44 !rounded-none text-sm font-serif text-slate-700 dark:text-slate-200',
            modifiers.active && Classes.ACTIVE,
          )}
          text={preset.label}
          title={preset.description ?? preset.label}
          onClick={handleClick}
          onFocus={handleFocus}
        />
      )}
      onItemSelect={(preset) => {
        if (!getDisabledReason(preset)) {
          onSelect(preset)
        }
      }}
      popoverProps={{
        placement: 'top',
        popoverClassName:
          '!rounded-none [&_.bp4-popover2-content]:!p-0 [&_.bp4-menu]:min-w-36 [&_li]:!mb-0',
      }}
    >
      <Button
        small
        minimal
        title={label}
        className="!w-full min-w-0 !px-1 !rounded-md !border-2 !border-current bg-slate-200 dark:bg-slate-600"
      >
        <span className="block min-w-0 truncate">{label}</span>
      </Button>
    </Select>
  )
}

export const OperatorStarStonePresetSelect: FC<OperatorStarStonePresetSelectProps> =
  memo(({ operator, operatorId, operatorProfile, onChange }) => {
    const t = useTranslation()
    const edit = useEdit()
    const auth = useAtomValue(authAtom)
    const {
      data: remotePresets,
      error,
      isLoading,
    } = useOperatorStarStonePresets()
    const refreshPresets = useRefreshOperatorStarStonePresets()
    const [dialogState, setDialogState] = useState<PresetDialogState>()
    const [presetName, setPresetName] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [deletingPreset, setDeletingPreset] = useState<ManagedPreset>()

    const builtinPresetSet = OPERATOR_STAR_STONE_PRESETS[operatorId]
    const userPresetSet = getUserOperatorStarStonePresetSet(
      remotePresets ?? undefined,
      operatorId,
    )
    const mainStarPresets = [
      ...(builtinPresetSet?.mainStarPresets ?? []),
      ...userPresetSet.mainStarPresets,
    ]
    const assistStarPresets = [
      ...(builtinPresetSet?.assistStarPresets ?? []),
      ...userPresetSet.assistStarPresets,
    ]
    const managedPresets: ManagedPreset[] = [
      ...userPresetSet.mainStarPresets.map((preset) => ({
        serverId: preset.serverId,
        label: preset.label,
        kind: StarStonePresetKind.Main,
      })),
      ...userPresetSet.assistStarPresets.map((preset) => ({
        serverId: preset.serverId,
        label: preset.label,
        kind: StarStonePresetKind.Assist,
      })),
    ]

    const discSlots = getDiscSlots(operator)
    const mainValues = discSlots.map((slot) => slot.starStone || null)
    const assistValues = discSlots.map((slot) => slot.assistStar || null)
    const canSaveMain = mainValues.some(Boolean)
    const canSaveAssist = assistValues.some(Boolean)

    const getMainPresetDisabledReason = (
      preset: OperatorStarPreset<MainStarName>,
    ) => {
      for (const star of preset.values) {
        if (!star) continue
        const availability = getMainStarAvailability(star, operatorProfile)
        if (!availability.available) {
          return `${star}：${availability.reason}`
        }
      }
      return undefined
    }

    const getAssistPresetDisabledReason = (
      preset: OperatorStarPreset<AssistStarName>,
    ) => {
      for (const star of preset.values) {
        if (!star) continue
        const availability = getAssistStarAvailability(star, operatorProfile)
        if (!availability.available) {
          return `${star}：${availability.reason}`
        }
      }
      return undefined
    }

    const applyMainPreset = (preset: OperatorStarPreset<MainStarName>) => {
      edit(() => {
        if (getMainPresetDisabledReason(preset)) {
          return { action: 'skip', desc: 'skip' }
        }
        onChange?.(applyMainStarPreset(operator, preset.values))
        return {
          action: 'apply-operator-main-star-preset',
          desc: `应用主星预设：${preset.label}`,
        }
      })
    }

    const applyAssistPreset = (preset: OperatorStarPreset<AssistStarName>) => {
      edit(() => {
        if (getAssistPresetDisabledReason(preset)) {
          return { action: 'skip', desc: 'skip' }
        }
        onChange?.(applyAssistStarPreset(operator, preset.values))
        return {
          action: 'apply-operator-assist-star-preset',
          desc: `应用辅星预设：${preset.label}`,
        }
      })
    }

    const openCreateDialog = (
      kind: StarStonePresetKind,
      values: (string | null)[],
    ) => {
      setPresetName(values.filter(Boolean).join('·'))
      setDialogState({ mode: 'create', kind, values })
    }

    const openRenameDialog = (preset: ManagedPreset) => {
      setPresetName(preset.label)
      setDialogState({ mode: 'rename', preset })
    }

    const closeDialog = () => {
      if (!submitting) setDialogState(undefined)
    }

    const submitPreset = async (event: FormEvent) => {
      event.preventDefault()
      const label = presetName.trim()
      if (!dialogState || !label || submitting) return

      setSubmitting(true)
      try {
        if (dialogState.mode === 'create') {
          await createOperatorStarStonePreset({
            operatorId,
            kind: dialogState.kind,
            label,
            values: dialogState.values,
          })
          AppToaster.show({
            intent: 'success',
            message:
              t.components.editor2.OperatorStarStonePresetSelect.create_success,
          })
        } else {
          await updateOperatorStarStonePreset({
            id: dialogState.preset.serverId,
            label,
          })
          AppToaster.show({
            intent: 'success',
            message:
              t.components.editor2.OperatorStarStonePresetSelect.rename_success,
          })
        }
        refreshPresets()
        setDialogState(undefined)
      } catch (submitError) {
        AppToaster.show({
          intent: 'danger',
          message: formatError(submitError),
        })
      } finally {
        setSubmitting(false)
      }
    }

    const confirmDeletePreset = async () => {
      if (!deletingPreset || submitting) return
      setSubmitting(true)
      try {
        await deleteOperatorStarStonePreset(deletingPreset.serverId)
        refreshPresets()
        setDeletingPreset(undefined)
        AppToaster.show({
          intent: 'success',
          message:
            t.components.editor2.OperatorStarStonePresetSelect.delete_success,
        })
      } catch (deleteError) {
        AppToaster.show({
          intent: 'danger',
          message: formatError(deleteError),
        })
      } finally {
        setSubmitting(false)
      }
    }

    const kindLabel = (kind: StarStonePresetKind) =>
      kind === StarStonePresetKind.Main
        ? t.components.editor2.OperatorStarStonePresetSelect.main_star
        : t.components.editor2.OperatorStarStonePresetSelect.assist_star

    const renderManagedPreset = (preset: ManagedPreset) => (
      <MenuItem
        key={preset.serverId}
        icon="user"
        text={preset.label}
        label={kindLabel(preset.kind)}
      >
        <MenuItem
          icon="edit"
          text={t.components.editor2.OperatorStarStonePresetSelect.rename}
          onClick={() => openRenameDialog(preset)}
        />
        <MenuItem
          icon="trash"
          intent="danger"
          text={t.common.delete}
          onClick={() => setDeletingPreset(preset)}
        />
      </MenuItem>
    )

    return (
      <>
        <li className="h-8 flex items-center gap-1 ml-1">
          <PresetControl
            label={
              t.components.editor2.OperatorStarStonePresetSelect
                .main_star_presets
            }
            emptyLabel={
              t.components.editor2.OperatorStarStonePresetSelect.no_presets
            }
            presets={mainStarPresets}
            getDisabledReason={getMainPresetDisabledReason}
            onSelect={applyMainPreset}
          />
          <PresetControl
            label={
              t.components.editor2.OperatorStarStonePresetSelect
                .assist_star_presets
            }
            emptyLabel={
              t.components.editor2.OperatorStarStonePresetSelect.no_presets
            }
            presets={assistStarPresets}
            getDisabledReason={getAssistPresetDisabledReason}
            onSelect={applyAssistPreset}
          />
          {auth.userId ? (
            <Popover2
              className="ml-auto"
              placement="top-end"
              usePortal
              content={
                <Menu className="min-w-48">
                  <MenuItem
                    icon="floppy-disk"
                    disabled={!canSaveMain}
                    text={
                      t.components.editor2.OperatorStarStonePresetSelect
                        .save_current_main
                    }
                    onClick={() =>
                      openCreateDialog(StarStonePresetKind.Main, mainValues)
                    }
                  />
                  <MenuItem
                    icon="floppy-disk"
                    disabled={!canSaveAssist}
                    text={
                      t.components.editor2.OperatorStarStonePresetSelect
                        .save_current_assist
                    }
                    onClick={() =>
                      openCreateDialog(StarStonePresetKind.Assist, assistValues)
                    }
                  />
                  {managedPresets.length > 0 ? (
                    <>
                      <MenuDivider
                        title={
                          t.components.editor2.OperatorStarStonePresetSelect
                            .my_presets
                        }
                      />
                      {managedPresets.map(renderManagedPreset)}
                    </>
                  ) : null}
                </Menu>
              }
            >
              <Button
                small
                minimal
                icon="cog"
                loading={isLoading}
                intent={error ? 'danger' : 'none'}
                title={
                  error
                    ? formatError(error)
                    : t.components.editor2.OperatorStarStonePresetSelect.manage
                }
                className="!w-8 !h-8 !min-w-8 !p-0 !rounded-md !border-2 !border-current bg-slate-200 dark:bg-slate-600"
              />
            </Popover2>
          ) : null}
        </li>

        <Dialog
          isOpen={!!dialogState}
          icon={dialogState?.mode === 'rename' ? 'edit' : 'floppy-disk'}
          title={
            dialogState?.mode === 'rename'
              ? t.components.editor2.OperatorStarStonePresetSelect.rename_title
              : t.components.editor2.OperatorStarStonePresetSelect.create_title
          }
          onClose={closeDialog}
        >
          <form onSubmit={submitPreset}>
            <DialogBody>
              <FormGroup
                label={
                  t.components.editor2.OperatorStarStonePresetSelect.preset_name
                }
                labelFor="operator-star-stone-preset-name"
              >
                <InputGroup
                  id="operator-star-stone-preset-name"
                  maxLength={32}
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                />
              </FormGroup>
            </DialogBody>
            <DialogFooter
              actions={
                <>
                  <Button disabled={submitting} onClick={closeDialog}>
                    {t.common.cancel}
                  </Button>
                  <Button
                    type="submit"
                    intent="primary"
                    loading={submitting}
                    disabled={!presetName.trim()}
                  >
                    {t.components.editor2.OperatorStarStonePresetSelect.save}
                  </Button>
                </>
              }
            />
          </form>
        </Dialog>

        <Alert
          isOpen={!!deletingPreset}
          icon="trash"
          intent="danger"
          loading={submitting}
          cancelButtonText={t.common.cancel}
          confirmButtonText={t.common.delete}
          onCancel={() => setDeletingPreset(undefined)}
          onConfirm={confirmDeletePreset}
        >
          <p>
            {t.components.editor2.OperatorStarStonePresetSelect.delete_confirm({
              name: deletingPreset?.label ?? '',
            })}
          </p>
        </Alert>
      </>
    )
  })
OperatorStarStonePresetSelect.displayName = 'OperatorStarStonePresetSelect'
