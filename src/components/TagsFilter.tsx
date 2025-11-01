import { Button, ButtonGroup } from '@blueprintjs/core'
import clsx from 'clsx'
import { FC, useMemo } from 'react'

import { TAGS } from '../constants/tags'

interface Props {
  className?: string
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

export const TagsFilter: FC<Props> = ({ className, value, onChange, disabled }) => {
  const selected = useMemo(() => new Set(value), [value])

  const toggle = (tag: string) => {
    const next = new Set(selected)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    onChange(Array.from(next))
  }

  return (
    <div
      className={clsx('inline-flex items-center gap-1', className)}
      style={{ display: 'none' }}
    >
      <ButtonGroup minimal className="flex flex-wrap items-center gap-1">
        {TAGS.map((tag) => (
          <Button
            key={tag}
            small
            className="bp4-button bp4-minimal !px-3"
            active={selected.has(tag)}
            onClick={() => toggle(tag)}
            disabled={disabled}
          >
            {tag}
          </Button>
        ))}
      </ButtonGroup>
      <Button
        small
        minimal
        className="!px-2"
        onClick={() => onChange([])}
        disabled={disabled || value.length === 0}
      >
        清空
      </Button>
    </div>
  )
}

TagsFilter.displayName = 'TagsFilter'

export default TagsFilter
