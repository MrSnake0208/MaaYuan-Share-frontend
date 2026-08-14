import { Button, Tooltip } from '@blueprintjs/core'

import { useMemo } from 'react'

import { useTranslation } from '../i18n/i18n'
import { getSiteSwitchInfo } from '../utils/serverSwitch'
import { useCurrentSize } from '../utils/useCurrenSize'

export const ServerSwitchButton = () => {
  const { isMD } = useCurrentSize()
  const t = useTranslation()
  const { targetSite } = useMemo(() => getSiteSwitchInfo(), [])

  if (!targetSite) {
    return null
  }

  const handleClick = () => {
    window.location.href = targetSite
  }

  return (
    <Tooltip
      content={t.components.ServerSwitchButton.tooltip({ target: targetSite })}
    >
      <Button
        minimal
        icon="exchange"
        text={!isMD && t.components.ServerSwitchButton.switch_site}
        aria-label={t.components.ServerSwitchButton.switch_site}
        onClick={handleClick}
      />
    </Tooltip>
  )
}
