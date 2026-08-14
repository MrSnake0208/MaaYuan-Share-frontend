import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  Switch,
} from '@blueprintjs/core'

import { useTranslation } from 'i18n/i18n'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'

import {
  downloadJsonEnabledAtom,
  onboardingDoneAtom,
  readEnabledAtom,
  sunkEnabledAtom,
} from 'store/operationPrefs'
import { useCurrentSize } from 'utils/useCurrenSize'

/**
 * 移动端首次访问引导教程：
 * 参考 yuan-bonds 的编号徽标步骤视觉，在首次访问时（仅移动端，延迟 600ms）弹出，
 * 让用户选择是否开启「已读」「沉底」「下载 JSON」功能，完成后写入 onboardingDoneAtom，此后不再弹出。
 */
export const OnboardingDialog = () => {
  const t = useTranslation()
  const { isMD } = useCurrentSize()
  const [onboardingDone, setOnboardingDone] = useAtom(onboardingDoneAtom)
  const [readEnabled, setReadEnabled] = useAtom(readEnabledAtom)
  const [sunkEnabled, setSunkEnabled] = useAtom(sunkEnabledAtom)
  const [downloadJsonEnabled, setDownloadJsonEnabled] = useAtom(
    downloadJsonEnabledAtom,
  )
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (onboardingDone || !isMD) {
      return
    }

    // 延迟片刻再弹出，避免打断首屏渲染（参考 SiteRetireDialog）
    const timer = window.setTimeout(() => setVisible(true), 600)
    return () => window.clearTimeout(timer)
  }, [onboardingDone, isMD])

  const finish = () => {
    setOnboardingDone(true)
    setVisible(false)
  }

  const stepItems = [
    {
      title: t.components.OnboardingDialog.read_title,
      desc: t.components.OnboardingDialog.read_desc,
    },
    {
      title: t.components.OnboardingDialog.sink_title,
      desc: t.components.OnboardingDialog.sink_desc,
    },
    {
      title: t.components.OnboardingDialog.download_json_title,
      desc: t.components.OnboardingDialog.download_json_desc,
    },
  ]

  return (
    <Dialog
      isOpen={visible}
      onClose={finish}
      title={t.components.OnboardingDialog.title}
      className="w-[92vw] max-w-[440px]"
      style={{ maxHeight: '90vh' }}
      canEscapeKeyClose
      canOutsideClickClose={false}
    >
      <DialogBody className="max-h-[70vh] overflow-y-auto">
        <p className="mb-4 text-zinc-500">
          {t.components.OnboardingDialog.subtitle}
        </p>

        <div className="flex flex-col gap-3">
          {stepItems.map((step, index) => (
            <div key={step.title} className="flex gap-3 items-start">
              <div className="w-7 h-7 shrink-0 rounded-full bg-amber-400 text-white flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{step.title}</div>
                <p className="mb-0 text-sm text-zinc-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Switch
            checked={readEnabled}
            label={t.components.ProfilePreferences.read_enabled}
            onChange={(e) => setReadEnabled(e.currentTarget.checked)}
          />
          <Switch
            checked={sunkEnabled}
            label={t.components.ProfilePreferences.sink_enabled}
            onChange={(e) => setSunkEnabled(e.currentTarget.checked)}
          />
          <Switch
            checked={downloadJsonEnabled}
            label={t.components.ProfilePreferences.download_json_enabled}
            onChange={(e) => setDownloadJsonEnabled(e.currentTarget.checked)}
          />
        </div>
      </DialogBody>
      <DialogFooter
        actions={
          <Button
            intent="primary"
            fill
            text={t.components.OnboardingDialog.start}
            onClick={finish}
          />
        }
      />
    </Dialog>
  )
}
