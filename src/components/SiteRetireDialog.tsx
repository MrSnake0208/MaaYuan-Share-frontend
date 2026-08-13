import { Alert, H4 } from '@blueprintjs/core'

import { useEffect, useState } from 'react'

import { useTranslation } from '../i18n/i18n'
import {
  dismissRetireNotice,
  isRetireNoticeDismissed,
  isRetiringHost,
  siteRetireConfig,
} from '../utils/siteRetireNotice'

/**
 * 域名迁移一次性提示弹窗：
 * 仅当当前访问的域名命中 VITE_SITE_RETIRE_HOST 时展示（如 share.maayuan.fun:16666），
 * 提示该域名保留截止日期并引导用户前往新地址；关闭一次后不再弹出（localStorage）。
 */
export const SiteRetireDialog = () => {
  const t = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!siteRetireConfig.host || isRetireNoticeDismissed()) {
      return
    }
    if (!isRetiringHost(window.location.host, siteRetireConfig.host)) {
      return
    }

    // 延迟片刻再弹出，避免打断首屏渲染
    const timer = window.setTimeout(() => setVisible(true), 600)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) {
    return null
  }

  const close = () => {
    dismissRetireNotice()
    setVisible(false)
  }

  const goToTarget = () => {
    dismissRetireNotice()
    if (siteRetireConfig.target) {
      window.location.href = siteRetireConfig.target
    }
  }

  return (
    <Alert
      isOpen={visible}
      icon="warning-sign"
      intent="warning"
      canEscapeKeyCancel
      canOutsideClickCancel={false}
      cancelButtonText={t.components.SiteRetireDialog.close}
      confirmButtonText={t.components.SiteRetireDialog.go_to_target}
      onCancel={close}
      onConfirm={goToTarget}
    >
      <H4>{t.components.SiteRetireDialog.title}</H4>
      <p className="mb-0 break-all">
        {t.components.SiteRetireDialog.body.jsx({
          host: window.location.host,
          date: siteRetireConfig.date ?? '',
          target: siteRetireConfig.target ? (
            <a
              className="underline"
              href={siteRetireConfig.target}
              target="_blank"
              rel="noreferrer"
            >
              {siteRetireConfig.target}
            </a>
          ) : (
            ''
          ),
        })}
      </p>
    </Alert>
  )
}
