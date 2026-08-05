import {
  Button,
  ButtonGroup,
  Callout,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
  InputGroup,
} from '@blueprintjs/core'

import type { OperatorBoxPresetRes } from 'maa-copilot-client'
import { FormEvent, useMemo, useState } from 'react'

import { saveOperatorBoxTrainingConfigs } from '../apis/operator-box-training-config'
import {
  createOperatorBoxPreset,
  deleteOperatorBoxPreset,
  updateOperatorBoxPreset,
  useOperatorBoxPresets,
} from '../apis/operator-box-preset'
import { useTranslation } from '../i18n/i18n'
import {
  toOperatorBoxMembers,
} from '../models/operator-box-preset'
import { formatError } from '../utils/error'
import { Confirm } from './Confirm'
import type { EditorOperator } from './editor2/types'
import { toOperatorTrainingConfig } from './editor2/operator/operatorTrainingConfigModel'
import { AppToaster } from './Toaster'

interface OperatorBoxPresetManagerProps {
  activePresetId: string
  operators: EditorOperator[]
  onSelect: (preset?: OperatorBoxPresetRes) => void
}

type DialogMode = 'create' | 'rename'

export function OperatorBoxPresetManager({
  activePresetId,
  operators,
  onSelect,
}: OperatorBoxPresetManagerProps) {
  const t = useTranslation()
  const { data: presets = [], error, isLoading, mutate } =
    useOperatorBoxPresets()
  const [dialogMode, setDialogMode] = useState<DialogMode>()
  const [presetName, setPresetName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === activePresetId),
    [activePresetId, presets],
  )
  const members = toOperatorBoxMembers(
    operators.map((operator) => operator.name),
  )

  const updateCache = async (saved: OperatorBoxPresetRes) => {
    await mutate(
      (current = []) => [
        saved,
        ...current.filter((preset) => preset.id !== saved.id),
      ],
      { revalidate: false },
    )
  }

  const showError = (caught: unknown) => {
    AppToaster.show({ intent: 'danger', message: formatError(caught) })
  }

  const applyPreset = (id: string) => {
    const preset = presets.find((candidate) => candidate.id === id)
    onSelect(preset)
  }

  const saveCurrent = async () => {
    if (!selectedPreset || members.length === 0 || submitting) return
    setSubmitting(true)
    try {
      const saved = await updateOperatorBoxPreset({
        id: selectedPreset.id,
        expectedRevision: selectedPreset.revision,
        members,
      })
      await updateCache(saved)
    } catch (caught) {
      showError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  const openDialog = (mode: DialogMode) => {
    setDialogMode(mode)
    setPresetName(mode === 'rename' ? (selectedPreset?.label ?? '') : '')
  }

  const submitDialog = async (event: FormEvent) => {
    event.preventDefault()
    const label = presetName.trim()
    if (!label || submitting) return
    setSubmitting(true)
    try {
      const saved =
        dialogMode === 'rename' && selectedPreset
          ? await updateOperatorBoxPreset({
              id: selectedPreset.id,
              expectedRevision: selectedPreset.revision,
              label,
            })
          : await createOperatorBoxPreset({ label, members })
      await updateCache(saved)
      if (dialogMode !== 'rename') {
        await saveOperatorBoxTrainingConfigs({
          boxId: saved.id,
          configs: operators.map(toOperatorTrainingConfig),
        })
        onSelect(saved)
      }
      setDialogMode(undefined)
    } catch (caught) {
      showError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteSelected = async () => {
    if (!selectedPreset) return
    try {
      await deleteOperatorBoxPreset({
        id: selectedPreset.id,
        expectedRevision: selectedPreset.revision,
      })
      await mutate(
        (current = []) =>
          current.filter((preset) => preset.id !== selectedPreset.id),
        { revalidate: false },
      )
      onSelect(undefined)
    } catch (caught) {
      showError(caught)
    }
  }

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4 dark:border-gray-700">
        <HTMLSelect
          aria-label={t.pages.operator_recorder.select_preset}
          disabled={isLoading}
          value={activePresetId}
          onChange={(event) => applyPreset(event.currentTarget.value)}
        >
          <option value="">
            {isLoading
              ? t.common.loading
              : t.pages.operator_recorder.select_preset}
          </option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </HTMLSelect>
        <ButtonGroup>
          <Button
            icon="floppy-disk"
            disabled={members.length === 0}
            onClick={() => openDialog('create')}
          >
            {t.pages.operator_recorder.save_as_preset}
          </Button>
          <Button
            icon="saved"
            loading={submitting}
            disabled={!selectedPreset || members.length === 0}
            onClick={saveCurrent}
          >
            {t.pages.operator_recorder.save_changes}
          </Button>
          <Button
            icon="edit"
            title={t.pages.operator_recorder.rename_preset}
            disabled={!selectedPreset}
            onClick={() => openDialog('rename')}
          />
          <Confirm
            intent="danger"
            confirmButtonText={t.common.delete}
            onConfirm={deleteSelected}
            trigger={({ handleClick }) => (
              <Button
                icon="trash"
                intent="danger"
                title={t.pages.operator_recorder.delete_preset}
                disabled={!selectedPreset}
                onClick={handleClick}
              />
            )}
          >
            {t.pages.operator_recorder.delete_preset_confirm}
          </Confirm>
        </ButtonGroup>
      </div>

      {error ? (
        <Callout className="mt-3" intent="danger" icon="error">
          {t.pages.operator_recorder.preset_load_failed({
            error: formatError(error),
          })}
        </Callout>
      ) : null}

      <Dialog
        isOpen={dialogMode !== undefined}
        icon={dialogMode === 'rename' ? 'edit' : 'floppy-disk'}
        title={
          dialogMode === 'rename'
            ? t.pages.operator_recorder.rename_preset
            : t.pages.operator_recorder.save_as_preset
        }
        onClose={() => {
          if (!submitting) setDialogMode(undefined)
        }}
      >
        <form onSubmit={submitDialog}>
          <DialogBody>
            <FormGroup
              label={t.pages.operator_recorder.preset_name}
              labelFor="operator-box-preset-name"
            >
              <InputGroup
                id="operator-box-preset-name"
                autoFocus
                maxLength={32}
                value={presetName}
                onChange={(event) => setPresetName(event.currentTarget.value)}
              />
            </FormGroup>
          </DialogBody>
          <DialogFooter
            actions={
              <>
                <Button
                  minimal
                  onClick={() => setDialogMode(undefined)}
                  disabled={submitting}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="submit"
                  intent="primary"
                  icon="tick"
                  loading={submitting}
                  disabled={!presetName.trim()}
                >
                  {t.common.confirm}
                </Button>
              </>
            }
          />
        </form>
      </Dialog>
    </>
  )
}
