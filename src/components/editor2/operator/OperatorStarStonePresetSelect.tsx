import { Button, Classes, MenuItem } from '@blueprintjs/core'

import clsx from 'clsx'
import { FC, memo } from 'react'

import {
  AssistStarName,
  MainStarName,
  OPERATOR_STAR_STONE_PRESETS,
  OperatorStarPreset,
} from '../../../data/operator-star-stone-presets'
import { Select } from '../../Select'
import { EditorOperator, useEdit } from '../editor-state'
import {
  applyAssistStarPreset,
  applyMainStarPreset,
  getDiscSlots,
} from './operatorDiscModel'

interface OperatorStarStonePresetSelectProps {
  operator: EditorOperator
  operatorId: string
  onChange?: (operator: EditorOperator) => void
}

interface PresetControlProps<T extends string> {
  emptyLabel: string
  currentValues: string[]
  presets: OperatorStarPreset<T>[]
  onSelect: (preset: OperatorStarPreset<T>) => void
}

function PresetControl<T extends string>({
  emptyLabel,
  currentValues,
  presets,
  onSelect,
}: PresetControlProps<T>) {
  const matchedPreset = presets.find((preset) =>
    currentValues.every(
      (value, index) => value === (preset.values[index] ?? ''),
    ),
  )
  const hasCustomValues = currentValues.some(Boolean)
  const buttonText = matchedPreset
    ? `${emptyLabel.replace('预设', '')}：${matchedPreset.label}`
    : hasCustomValues
      ? `${emptyLabel.replace('预设', '')}：自定义`
      : emptyLabel

  return (
    <Select
      className="flex-1 min-w-0"
      filterable={false}
      items={presets}
      itemRenderer={(preset, { handleClick, handleFocus, modifiers }) => (
        <MenuItem
          roleStructure="listoption"
          key={preset.id}
          className={clsx(
            'min-w-36 !rounded-none text-sm font-serif text-slate-700 dark:text-slate-200',
            modifiers.active && Classes.ACTIVE,
          )}
          text={preset.label}
          title={preset.description ?? preset.label}
          onClick={handleClick}
          onFocus={handleFocus}
          selected={matchedPreset?.id === preset.id}
        />
      )}
      onItemSelect={onSelect}
      popoverProps={{
        placement: 'top',
        popoverClassName:
          '!rounded-none [&_.bp4-popover2-content]:!p-0 [&_.bp4-menu]:min-w-36 [&_li]:!mb-0',
      }}
    >
      <Button
        small
        minimal
        title={buttonText}
        className="!w-full min-w-0 !px-1 !rounded-md !border-2 !border-current bg-slate-200 dark:bg-slate-600"
      >
        <span className="block min-w-0 truncate">{buttonText}</span>
      </Button>
    </Select>
  )
}

export const OperatorStarStonePresetSelect: FC<OperatorStarStonePresetSelectProps> =
  memo(({ operator, operatorId, onChange }) => {
    const edit = useEdit()
    const presetSet = OPERATOR_STAR_STONE_PRESETS[operatorId]
    const mainStarPresets = presetSet?.mainStarPresets ?? []
    const assistStarPresets = presetSet?.assistStarPresets ?? []

    if (mainStarPresets.length === 0 && assistStarPresets.length === 0) {
      return null
    }

    const slots = getDiscSlots(operator)
    const mainStarValues = slots.map((slot) => slot.starStone ?? '')
    const assistStarValues = slots.map((slot) => slot.assistStar ?? '')

    const applyMainPreset = (preset: OperatorStarPreset<MainStarName>) => {
      edit(() => {
        onChange?.(applyMainStarPreset(operator, preset.values))
        return {
          action: 'apply-operator-main-star-preset',
          desc: `应用主星预设：${preset.label}`,
        }
      })
    }

    const applyAssistPreset = (preset: OperatorStarPreset<AssistStarName>) => {
      edit(() => {
        onChange?.(applyAssistStarPreset(operator, preset.values))
        return {
          action: 'apply-operator-assist-star-preset',
          desc: `应用辅星预设：${preset.label}`,
        }
      })
    }

    return (
      <li className="h-8 flex items-center gap-1 ml-1">
        {mainStarPresets.length > 0 ? (
          <PresetControl
            emptyLabel="主星预设"
            currentValues={mainStarValues}
            presets={mainStarPresets}
            onSelect={applyMainPreset}
          />
        ) : null}
        {assistStarPresets.length > 0 ? (
          <PresetControl
            emptyLabel="辅星预设"
            currentValues={assistStarValues}
            presets={assistStarPresets}
            onSelect={applyAssistPreset}
          />
        ) : null}
      </li>
    )
  })
OperatorStarStonePresetSelect.displayName = 'OperatorStarStonePresetSelect'
