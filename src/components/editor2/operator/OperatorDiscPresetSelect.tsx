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
  createOperatorDiscPreset,
  deleteOperatorDiscPreset,
  updateOperatorDiscPreset,
  useOperatorDiscPresets,
  useRefreshOperatorDiscPresets,
} from 'apis/operator-disc-preset'
import clsx from 'clsx'
import { useAtomValue } from 'jotai'
import { FC, FormEvent, memo, useState } from 'react'

import { useTranslation } from '../../../i18n/i18n'
import type { OperatorInfo } from '../../../models/operator'
import { authAtom } from '../../../store/auth'
import { formatError } from '../../../utils/error'
import { Select } from '../../Select'
import { AppToaster } from '../../Toaster'
import { EditorOperator, useEdit } from '../editor-state'
import { applyDiscPreset, getDiscSlots } from './operatorDiscModel'
import {
  DiscPresetConfirmed,
  DiscPresetSelected,
  UserOperatorDiscPreset,
  getUserOperatorDiscPresets,
} from './operatorDiscPresetModel'

interface OperatorDiscPresetSelectProps {
  operator: EditorOperator
  operatorId: string
  operatorProfile: OperatorInfo
  onChange?: (operator: EditorOperator) => void
}

type PresetDialogState =
  | {
      mode: 'create'
      selected: DiscPresetSelected
      confirmed: DiscPresetConfirmed
    }
  | {
      mode: 'rename'
      preset: UserOperatorDiscPreset
    }

interface PresetControlProps {
  label: string
  emptyLabel: string
  presets: UserOperatorDiscPreset[]
  onSelect: (preset: UserOperatorDiscPreset) => void
}

function PresetControl({
  label,
  emptyLabel,
  presets,
  onSelect,
}: PresetControlProps) {
  if (presets.length === 0) {
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
      items={presets}
      itemRenderer={(preset, { handleClick, handleFocus, modifiers }) => (
        <MenuItem
          roleStructure="listoption"
          key={preset.id}
          icon="user"
          className={clsx(
            'min-w-44 !rounded-none text-sm font-serif text-slate-700 dark:text-slate-200',
            modifiers.active && Classes.ACTIVE,
          )}
          text={preset.label}
          title={preset.label}
          onClick={handleClick}
          onFocus={handleFocus}
        />
      )}
      onItemSelect={onSelect}
      popoverProps={{
        placement: 'top',
        popoverClassName:
          'max-w-[90vw] !rounded-none [&_.bp4-popover2-content]:!p-0 [&_.bp4-menu]:min-w-36 [&_li]:!mb-0',
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

export const OperatorDiscPresetSelect: FC<OperatorDiscPresetSelectProps> = memo(
  ({ operator, operatorId, operatorProfile, onChange }) => {
    const t = useTranslation()
    const edit = useEdit()
    const auth = useAtomValue(authAtom)
    const { data: remotePresets, error, isLoading } = useOperatorDiscPresets()
    const refreshPresets = useRefreshOperatorDiscPresets()
    const [dialogState, setDialogState] = useState<PresetDialogState>()
    const [presetName, setPresetName] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [deletingPreset, setDeletingPreset] =
      useState<UserOperatorDiscPreset>()

    const presets = getUserOperatorDiscPresets(
      remotePresets ?? undefined,
      operatorId,
      operatorProfile.discs.length,
    )
    const slots = getDiscSlots(operator)
    const selected = slots.map(
      (slot) => slot.disc,
    ) as unknown as DiscPresetSelected
    const confirmed = slots.map((slot) =>
      Boolean(slot.discConfirmed),
    ) as unknown as DiscPresetConfirmed
    const canSave = confirmed.some(Boolean)

    const createDefaultName = () =>
      selected
        .map((value, index) => {
          if (!confirmed[index]) return ''
          if (value === 0) return '任意'
          const disc = operatorProfile.discs[Math.abs(value) - 1]
          const name = disc?.abbreviation ?? `命盘${Math.abs(value)}`
          return value < 0 ? `禁用${name}` : name
        })
        .filter(Boolean)
        .join('·')
        .slice(0, 32)

    const openCreateDialog = () => {
      setPresetName(createDefaultName())
      setDialogState({ mode: 'create', selected, confirmed })
    }

    const openRenameDialog = (preset: UserOperatorDiscPreset) => {
      setPresetName(preset.label)
      setDialogState({ mode: 'rename', preset })
    }

    const closeDialog = () => {
      if (!submitting) setDialogState(undefined)
    }

    const applyPreset = (preset: UserOperatorDiscPreset) => {
      edit(() => {
        onChange?.(applyDiscPreset(operator, preset.selected, preset.confirmed))
        return {
          action: 'apply-operator-disc-preset',
          desc: `应用命盘预设：${preset.label}`,
        }
      })
    }

    const submitPreset = async (event: FormEvent) => {
      event.preventDefault()
      const label = presetName.trim()
      if (!dialogState || !label || submitting) return

      setSubmitting(true)
      try {
        if (dialogState.mode === 'create') {
          await createOperatorDiscPreset({
            operatorId,
            label,
            selected: [...dialogState.selected],
            confirmed: [...dialogState.confirmed],
          })
          AppToaster.show({
            intent: 'success',
            message:
              t.components.editor2.OperatorDiscPresetSelect.create_success,
          })
        } else {
          await updateOperatorDiscPreset({
            id: dialogState.preset.serverId,
            label,
          })
          AppToaster.show({
            intent: 'success',
            message:
              t.components.editor2.OperatorDiscPresetSelect.rename_success,
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
        await deleteOperatorDiscPreset(deletingPreset.serverId)
        refreshPresets()
        setDeletingPreset(undefined)
        AppToaster.show({
          intent: 'success',
          message: t.components.editor2.OperatorDiscPresetSelect.delete_success,
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

    return (
      <>
        <li className="h-8 flex items-center gap-1 ml-1">
          <PresetControl
            label={t.components.editor2.OperatorDiscPresetSelect.disc_presets}
            emptyLabel={
              t.components.editor2.OperatorDiscPresetSelect.no_presets
            }
            presets={presets}
            onSelect={applyPreset}
          />
          {auth.userId ? (
            <Popover2
              className="ml-auto"
              placement="top-end"
              usePortal
              content={
                <Menu className="min-w-48 max-w-[90vw]">
                  <MenuItem
                    icon="floppy-disk"
                    disabled={!canSave}
                    text={
                      t.components.editor2.OperatorDiscPresetSelect.save_current
                    }
                    onClick={openCreateDialog}
                  />
                  {presets.length > 0 ? (
                    <>
                      <MenuDivider
                        title={
                          t.components.editor2.OperatorDiscPresetSelect
                            .my_presets
                        }
                      />
                      {presets.map((preset) => (
                        <MenuItem
                          key={preset.serverId}
                          icon="user"
                          text={preset.label}
                        >
                          <MenuItem
                            icon="edit"
                            text={
                              t.components.editor2.OperatorDiscPresetSelect
                                .rename
                            }
                            onClick={() => openRenameDialog(preset)}
                          />
                          <MenuItem
                            icon="trash"
                            intent="danger"
                            text={t.common.delete}
                            onClick={() => setDeletingPreset(preset)}
                          />
                        </MenuItem>
                      ))}
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
                    : t.components.editor2.OperatorDiscPresetSelect.manage
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
              ? t.components.editor2.OperatorDiscPresetSelect.rename_title
              : t.components.editor2.OperatorDiscPresetSelect.create_title
          }
          onClose={closeDialog}
          className="!w-[92vw] sm:!w-[500px]"
        >
          <form onSubmit={submitPreset}>
            <DialogBody>
              <FormGroup
                label={
                  t.components.editor2.OperatorDiscPresetSelect.preset_name
                }
                labelFor="operator-disc-preset-name"
              >
                <InputGroup
                  id="operator-disc-preset-name"
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
                    {t.components.editor2.OperatorDiscPresetSelect.save}
                  </Button>
                </>
              }
            />
          </form>
        </Dialog>

        <Alert
          isOpen={!!deletingPreset}
          cancelButtonText={t.common.cancel}
          confirmButtonText={t.common.delete}
          icon="trash"
          intent="danger"
          loading={submitting}
          onCancel={() => !submitting && setDeletingPreset(undefined)}
          onConfirm={confirmDeletePreset}
          className="max-w-[92vw]"
        >
          {t.components.editor2.OperatorDiscPresetSelect.delete_confirm({
            name: deletingPreset?.label ?? '',
          })}
        </Alert>
      </>
    )
  },
)
