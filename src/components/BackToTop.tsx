import { Button } from '@blueprintjs/core'

import { useEffect, useState } from 'react'

import { useTranslation } from '../i18n/i18n'

export const BackToTop = () => {
  const t = useTranslation()
  const [showButton, setShowButton] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 100) {
        setShowButton(true)
      } else {
        setShowButton(false)
      }
    }
    document.addEventListener('scroll', handleScroll)
    return () => {
      document.removeEventListener('scroll', handleScroll)
    }
  }, [])
  const handleClickButton = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <div>
      {showButton && (
        <Button
          large
          onClick={handleClickButton}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
          }}
          icon="symbol-triangle-up"
          aria-label={t.components.BackToTop.back_to_top}
        />
      )}
    </div>
  )
}
