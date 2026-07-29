import { Button, Classes, MenuItem } from '@blueprintjs/core'

import clsx from 'clsx'
import { FC, memo } from 'react'

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
import { Select } from '../../Select'
import { EditorOperator, useEdit } from '../editor-state'
import { applyAssistStarPreset, applyMainStarPreset } from './operatorDiscModel'

interface OperatorStarStonePresetSelectProps {
  operator: EditorOperator
  operatorId: string
  operatorProfile: StarStoneOperatorProfile
  onChange?: (operator: EditorOperator) => void
}

interface PresetControlProps<T extends string> {
  label: string
  presets: OperatorStarPreset<T>[]
  getDisabledReason: (preset: OperatorStarPreset<T>) => string | undefined
  onSelect: (preset: OperatorStarPreset<T>) => void
}

function PresetControl<T extends string>({
  label,
  presets,
  getDisabledReason,
  onSelect,
}: PresetControlProps<T>) {
  const availablePresets = presets.filter(
    (preset) => !getDisabledReason(preset),
  )

  return (
    <Select
      className="flex-1 min-w-0"
      filterable={false}
      items={availablePresets}
      itemRenderer={(preset, { handleClick, handleFocus, modifiers }) => (
        <MenuItem
          roleStructure="listoption"
          key={preset.id}
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
    const edit = useEdit()
    const presetSet = OPERATOR_STAR_STONE_PRESETS[operatorId]
    const mainStarPresets = presetSet?.mainStarPresets ?? []
    const assistStarPresets = presetSet?.assistStarPresets ?? []

    if (mainStarPresets.length === 0 && assistStarPresets.length === 0) {
      return null
    }

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

    return (
      <li className="h-8 flex items-center gap-1 ml-1">
        {mainStarPresets.length > 0 ? (
          <PresetControl
            label="主星预设"
            presets={mainStarPresets}
            getDisabledReason={getMainPresetDisabledReason}
            onSelect={applyMainPreset}
          />
        ) : null}
        {assistStarPresets.length > 0 ? (
          <PresetControl
            label="辅星预设"
            presets={assistStarPresets}
            getDisabledReason={getAssistPresetDisabledReason}
            onSelect={applyAssistPreset}
          />
        ) : null}
      </li>
    )
  })
OperatorStarStonePresetSelect.displayName = 'OperatorStarStonePresetSelect'
